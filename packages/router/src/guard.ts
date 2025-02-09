import { GuardIdentity, GuardTypes, IGuardOptions, } from './guardian';
import { ComponentAppellation, GuardFunction, GuardTarget, IComponentAndOrViewportOrNothing, INavigatorInstruction, IRouteableComponentType, ViewportHandle } from './interfaces';
import { ComponentAppellationResolver, ViewportHandleResolver } from './type-resolvers';
import { Viewport } from './viewport';
import { ViewportInstruction } from './viewport-instruction';

export class Guard {
  public type: GuardTypes = GuardTypes.Before;
  public includeTargets: Target[] = [];
  public excludeTargets: Target[] = [];

  constructor(
    public guard: GuardFunction,
    options: IGuardOptions,
    public id: GuardIdentity
  ) {
    if (options.type) {
      this.type = options.type;
    }

    for (const target of options.include || []) {
      this.includeTargets.push(new Target(target));
    }
    for (const target of options.exclude || []) {
      this.excludeTargets.push(new Target(target));
    }
  }

  public matches(viewportInstructions: ViewportInstruction[]): boolean {
    if (this.includeTargets.length && !this.includeTargets.some(target => target.matches(viewportInstructions))) {
      return false;
    }
    if (this.excludeTargets.length && this.excludeTargets.some(target => target.matches(viewportInstructions))) {
      return false;
    }
    return true;
  }

  public check(viewportInstructions: ViewportInstruction[], navigationInstruction: INavigatorInstruction): boolean | ViewportInstruction[] {
    return this.guard(viewportInstructions, navigationInstruction);
  }
}

class Target {
  public componentType: IRouteableComponentType | null = null;
  public componentName: string | null = null;
  public viewport: Viewport | null = null;
  public viewportName: string | null = null;

  constructor(target: GuardTarget) {
    if (typeof target === 'string') {
      this.componentName = target;
    } else if (ComponentAppellationResolver.isType(target as IRouteableComponentType)) {
      this.componentType = target as IRouteableComponentType;
      this.componentName = ComponentAppellationResolver.getName(target as IRouteableComponentType);
    } else {
      const cvTarget = target as IComponentAndOrViewportOrNothing;
      this.componentType = ComponentAppellationResolver.isType(cvTarget.component as ComponentAppellation) ? ComponentAppellationResolver.getType(cvTarget.component as ComponentAppellation) : null;
      this.componentName = ComponentAppellationResolver.getName(cvTarget.component as ComponentAppellation);
      this.viewport = ViewportHandleResolver.isInstance(cvTarget.viewport as ViewportHandle) ? cvTarget.viewport as Viewport : null;
      this.viewportName = ViewportHandleResolver.getName(cvTarget.viewport as ViewportHandle);
    }
  }

  public matches(viewportInstructions: ViewportInstruction[]): boolean {
    const instructions = viewportInstructions.slice();
    if (!instructions.length) {
      instructions.push(new ViewportInstruction(''));
    }
    for (const instruction of instructions) {
      if (this.componentName === instruction.componentName ||
        this.componentType === instruction.componentType ||
        this.viewportName === instruction.viewportName ||
        this.viewport === instruction.viewport) {
        return true;
      }
    }
    return false;
  }
}
