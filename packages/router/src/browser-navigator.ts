import { Key, Reporter } from '@aurelia/kernel';
import { IDOM, ILifecycle } from '@aurelia/runtime';
import { HTMLDOM } from '@aurelia/runtime-html';
import { INavigatorState, INavigatorStore, INavigatorViewer, INavigatorViewerEvent } from './navigator';
import { Queue, QueueItem } from './queue';

interface Call {
  target: object;
  methodName: string;
  parameters: unknown[];
  propagateResolve?: boolean;
  suppressPopstate?: boolean;
}

interface ForwardedState {
  suppressPopstate?: boolean;
  resolve?: ((value?: void | PromiseLike<void>) => void);
}
export class BrowserNavigator implements INavigatorStore, INavigatorViewer {
  public static readonly inject: readonly Key[] = [ILifecycle, IDOM];

  public readonly lifecycle: ILifecycle;

  public window: Window;
  public history: History;
  public location: Location;

  public useHash: boolean;
  public allowedExecutionCostWithinTick: number; // Limit no of executed actions within the same RAF (due to browser limitation)

  private readonly pendingCalls: Queue<Call>;
  private isActive: boolean;
  private callback: (ev?: INavigatorViewerEvent) => void;

  private forwardedState: ForwardedState;

  constructor(
    lifecycle: ILifecycle,
    dom: HTMLDOM
  ) {
    this.lifecycle = lifecycle;

    this.window = dom.window;
    this.history = dom.window.history;
    this.location = dom.window.location;
    this.useHash = true;
    this.allowedExecutionCostWithinTick = 2;
    this.pendingCalls = new Queue<Call>(this.processCalls);
    this.isActive = false;
    this.callback = null;
    this.forwardedState = {};
  }

  public activate(callback: (ev?: INavigatorViewerEvent) => void): void {
    if (this.isActive) {
      throw new Error('Browser navigation has already been activated');
    }
    this.isActive = true;
    this.callback = callback;
    this.pendingCalls.activate({ lifecycle: this.lifecycle, allowedExecutionCostWithinTick: this.allowedExecutionCostWithinTick });
    this.window.addEventListener('popstate', this.handlePopstate);
  }

  public loadUrl(): Promise<void> {
    return this.handlePopstate(null);
  }

  public deactivate(): void {
    if (!this.isActive) {
      throw new Error('Browser navigation has not been activated');
    }
    this.window.removeEventListener('popstate', this.handlePopstate);
    this.pendingCalls.deactivate();
    this.callback = null;
    this.isActive = false;
  }

  get length(): number {
    return this.history.length;
  }
  get state(): Record<string, unknown> {
    return this.history.state;
  }

  public go(delta?: number, suppressPopstate: boolean = false): Promise<void> {
    return this.enqueue(this.history, 'go', [delta], suppressPopstate);
  }

  public pushNavigatorState(state: INavigatorState): Promise<void> {
    const { title, path } = state.currentEntry;
    return this.enqueue(this.history, 'pushState', [state, title, `#${path}`]);
  }

  public replaceNavigatorState(state: INavigatorState): Promise<void> {
    const { title, path } = state.currentEntry;
    return this.enqueue(this.history, 'replaceState', [state, title, `#${path}`]);
  }

  public popNavigatorState(): Promise<void> {
    return this.enqueue(this, 'popState', []);
  }

  public readonly handlePopstate = (ev: PopStateEvent): Promise<void> => {
    return this.enqueue(this, 'popstate', [ev]);
  }

  private popstate(ev: PopStateEvent, resolve: ((value?: void | PromiseLike<void>) => void), suppressPopstate: boolean = false): void {
    if (!suppressPopstate) {
      const { pathname, search, hash } = this.location;
      this.callback({
        event: ev,
        state: this.history.state,
        path: pathname,
        data: search,
        hash,
        instruction: this.useHash ? hash.slice(1) : pathname,
      });
    }
    if (resolve) {
      resolve();
    }
  }

  private async popState(resolve: ((value?: void | PromiseLike<void>) => void)): Promise<void> {
    await this.go(-1, true);
    const state = this.history.state;
    // TODO: Fix browser forward bug after pop on first entry
    if (state && state.navigationEntry && !state.navigationEntry.firstEntry) {
      await this.go(-1, true);
      return this.pushNavigatorState(state);
    }
    resolve();
  }

  private forwardState(state: ForwardedState): void {
    this.forwardedState = state;
  }

  // Everything that wants to await a browser event should pass suppressPopstate param
  // Events NOT resulting in popstate events should NOT pass suppressPopstate param
  private enqueue(target: object, methodName: string, parameters: unknown[], suppressPopstate?: boolean): Promise<void> {
    const calls: Call[] = [];
    const costs: number[] = [];
    const promises: Promise<void>[] = [];

    if (suppressPopstate !== undefined) {
      // Due to (browser) events not having a promise, we create and propagate one
      let resolve: ((value?: void | PromiseLike<void>) => void);
      promises.push(new Promise(_resolve => {
        resolve = _resolve;
      }));

      calls.push({
        target: this,
        methodName: 'forwardState',
        parameters: [
          {
            resolve,
            suppressPopstate,
          }
        ],
      });
      costs.push(0);
    }

    calls.push({
      target: target,
      methodName: methodName,
      parameters: parameters,
    });
    costs.push(1);

    // The first promise is the relevant one since it's either a) the propagated one (in
    // case of a browser action), or b) the only one since there's only one call
    promises.push(this.pendingCalls.enqueue(calls, costs)[0]);
    return promises[0];
  }

  private readonly processCalls = (qCall: QueueItem<Call>): void => {
    const call = qCall as Call;

    if (call.target === this && call.methodName !== 'forwardState') {
      call.parameters.push(this.forwardedState.resolve);
      this.forwardedState.resolve = null;

      // Should we suppress this popstate event?
      if (call.methodName === 'popstate' && this.forwardedState.suppressPopstate) {
        call.parameters.push(true);
        this.forwardedState.suppressPopstate = false;
      }
    }
    const method = call.target[call.methodName];
    Reporter.write(10000, 'DEQUEUE', call.methodName, call.parameters);
    method.apply(call.target, call.parameters);
    qCall.resolve();
  }
}
