import { preprocessHtmlTemplate, preprocessOptions } from '@aurelia/plugin-conventions';
import { assert } from '@aurelia/testing';
import * as path from 'path';

describe('preprocessHtmlTemplate', function () {
  it('processes template with no dependencies', function () {
    const html = '<template></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [  ];
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'foo-bar.html'), contents: html }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('processes template with css pair', function () {
    const html = '<template></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import d0 from "./foo-bar.css";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ Registration.defer('.css', d0) ];
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'foo-bar.html'), contents: html, filePair: 'foo-bar.css' }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('do not import css pair if a pair is imported', function () {
    const html = '<import from="./foo-bar.less"></import><template></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import { Registration } from '@aurelia/kernel';
import d0 from "./foo-bar.less";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ Registration.defer('.css', d0) ];
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'foo-bar.html'), contents: html, filePair: 'foo-bar.css' }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('processes template with dependencies', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import * as h0 from "./hello-world.html";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'FooBar.html'), contents: html }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('supports HTML-only dependency not in html format', function () {
    const html = '<import from="./hello-world.md" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import * as h0 from "./hello-world.md";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate({ path: path.join('lo', 'FooBar.html'), contents: html }, preprocessOptions());
    assert.equal(result.code, expected);
  });

  it('processes template with dependencies, wrap css module id', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import * as h0 from "./hello-world.html";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({ stringModuleWrap: (id: string) => `raw-loader!${id}` })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in shadowDOM mode', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import * as h0 from "./hello-world.html";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'open' };
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'open' },
        stringModuleWrap: (id: string) => `raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in shadowDOM mode with string module wrap', function () {
    const html = '<import from="./hello-world.html" /><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import * as h0 from "./hello-world.html";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'closed' };
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in shadowDOM mode with string module wrap and explicit shadow mode', function () {
    const html = '<import from="./hello-world.html"><use-shadow-dom><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import * as h0 from "./hello-world.html";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'open' };
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with css dependencies in per-file shadowDOM mode with string module wrap and explicit shadow mode', function () {
    const html = '<import from="./hello-world.html"><use-shadow-dom><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
import * as h0 from "./hello-world.html";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "raw-loader!./foo-bar.scss";
export const name = "foo-bar";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
export const shadowOptions = { mode: 'open' };
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, shadowOptions });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'FooBar.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('turn off shadowDOM mode for one word element', function () {
    const html = '<import from="./hello-world.html"><use-shadow-dom><template><import from="foo"><require from="./foo-bar.scss"></require></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
console.warn("WARN: ShadowDOM is disabled for ${path.join('lo', 'foo.html')}. ShadowDOM requires element name to contain a dash (-), you have to refactor <foo> to something like <lorem-foo>.");
import * as h0 from "./hello-world.html";
const d0 = h0.getHTMLOnlyElement();
import * as d1 from "foo";
import { Registration } from '@aurelia/kernel';
import d2 from "./foo-bar.scss";
export const name = "foo";
export const template = "<template></template>";
export default template;
export const dependencies = [ d0, d1, Registration.defer('.css', d2) ];
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        defaultShadowOptions: { mode: 'closed' },
        stringModuleWrap: (id: string) => `raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  });

  it('processes template with containerless and bindables', function() {
    const html = '<bindable name="age" mode="one-way"><containerless><template bindable="firstName, lastName"></template>';
    const expected = `import { CustomElement } from '@aurelia/runtime';
export const name = "foo";
export const template = "<template ></template>";
export default template;
export const dependencies = [  ];
export const containerless = true;
export const bindables = {"age":{"mode":2},"firstName":{},"lastName":{}};
let _e;
export function getHTMLOnlyElement() {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, containerless, bindables });
  }
  return _e;
}
`;
    const result = preprocessHtmlTemplate(
      { path: path.join('lo', 'foo.html'), contents: html },
      preprocessOptions({
        stringModuleWrap: (id: string) => `raw-loader!${id}`
      })
    );
    assert.equal(result.code, expected);
  })
});
