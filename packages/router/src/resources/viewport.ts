import {
  Key,
  Writable
} from '@aurelia/kernel';

import {
  bindable,
  createRenderContext,
  CustomElement,
  IController,
  ICustomElementType,
  IDOM,
  INode,
  IRenderContext,
  IRenderingEngine,
  ITemplate,
  LifecycleFlags,
  TemplateDefinition
} from '@aurelia/runtime';

import {
  IRouter,
} from '../router';
import {
  IViewportOptions,
  Viewport
} from '../viewport';

export class ViewportCustomElement {
  public static readonly inject: readonly Key[] = [IRouter, INode, IRenderingEngine];

  @bindable public name: string;
  @bindable public usedBy: string;
  @bindable public default: string;
  @bindable public noScope: boolean;
  @bindable public noLink: boolean;
  @bindable public noHistory: boolean;
  @bindable public stateful: boolean;

  public viewport: Viewport;

  public $controller!: IController; // This is set by the controller after this instance is constructed

  private readonly router: IRouter;
  private readonly element: Element;
  private readonly renderingEngine: IRenderingEngine;

  constructor(router: IRouter, element: Element, renderingEngine: IRenderingEngine) {
    this.name = 'default';
    this.usedBy = null;
    this.default = null;
    this.noScope = null;
    this.noLink = null;
    this.noHistory = null;
    this.stateful = null;
    this.viewport = null;

    this.router = router;
    this.element = element;
    this.renderingEngine = renderingEngine;
  }

  public render(flags: LifecycleFlags, host: INode, parts: Record<string, TemplateDefinition>, parentContext: IRenderContext | null): void {
    const Type = this.constructor as ICustomElementType;
    const dom = parentContext.get(IDOM);
    const template = this.renderingEngine.getElementTemplate(dom, Type.description, parentContext, Type);
    (template as Writable<ITemplate>).renderContext = createRenderContext(dom, parentContext, Type.description.dependencies, Type);
    template.render(this, host, parts);
  }

  // public created(...rest): void {
  //   console.log('Created', rest);
  //   const booleanAttributes = {
  //     'scope': 'scope',
  //     'no-link': 'noLink',
  //     'no-history': 'noHistory',
  //   };
  //   const valueAttributes = {
  //     'used-by': 'usedBy',
  //     'default': 'default',
  //   };
  //   const name = this.element.hasAttribute('name') ? this.element.getAttribute('name') : 'default';
  //   const options: IViewportOptions = {};
  //   for (const attribute in booleanAttributes) {
  //     if (this.element.hasAttribute[attribute]) {
  //       options[booleanAttributes[attribute]] = true;
  //     }
  //   }
  //   for (const attribute in valueAttributes) {
  //     if (this.element.hasAttribute(attribute)) {
  //       const value = this.element.getAttribute(attribute);
  //       if (value && value.length) {
  //         options[valueAttributes[attribute]] = value;
  //       }
  //     }
  //   }
  //   this.viewport = this.router.addViewport(name, this.element, (this as any).$context.get(IContainer), options);
  // }
  public bound(): void {
    this.connect();
  }
  public unbound(): void {
    this.disconnect();
  }

  public connect(): void {
    const options: IViewportOptions = { scope: !this.element.hasAttribute('no-scope') };
    if (this.usedBy && this.usedBy.length) {
      options.usedBy = this.usedBy;
    }
    if (this.default && this.default.length) {
      options.default = this.default;
    }
    if (this.element.hasAttribute('no-link')) {
      options.noLink = true;
    }
    if (this.element.hasAttribute('no-history')) {
      options.noHistory = true;
    }
    if (this.element.hasAttribute('stateful')) {
      options.stateful = true;
    }
    this.viewport = this.router.addViewport(this.name, this.element, this.$controller.context as IRenderContext, options);
  }
  public disconnect(): void {
    this.router.removeViewport(this.viewport, this.element, this.$controller.context as IRenderContext);
  }

  public binding(flags: LifecycleFlags): void {
    if (this.viewport) {
      this.viewport.binding(flags);
    }
  }

  public attaching(flags: LifecycleFlags): void {
    if (this.viewport) {
      this.viewport.attaching(flags);
    }
  }

  public detaching(flags: LifecycleFlags): void {
    if (this.viewport) {
      this.viewport.detaching(flags);
    }
  }

  public unbinding(flags: LifecycleFlags): void {
    if (this.viewport) {
      this.viewport.unbinding(flags);
    }
  }
}
// eslint-disable-next-line no-template-curly-in-string
CustomElement.define({ name: 'au-viewport', template: '<template><div class="viewport-header" style="display: none;"> Viewport: <b>${name}</b> ${scope ? "[new scope]" : ""} : <b>${viewport.content && viewport.content.componentName()}</b></div></template>' }, ViewportCustomElement);
