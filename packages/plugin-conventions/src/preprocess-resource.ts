import { kebabCase } from '@aurelia/kernel';
import modifyCode, { ModifyCodeResult } from 'modify-code';
import * as path from 'path';
import * as ts from 'typescript';
import { nameConvention } from './name-convention';
import { IFileUnit, IPreprocessOptions, ResourceType } from './options';

interface ICapturedImport {
  names: string[];
  start: number;
  end: number;
}

interface IPos {
  pos: number;
  end: number;
}

interface IFoundResource {
  localDep?: string;
  needDecorator?: [number, string];
  implicitStatement?: IPos;
  runtimeImportName?: string;
  jitImportName?: string;
}

interface IModifyResourceOptions {
  runtimeImport: ICapturedImport;
  jitImport: ICapturedImport;
  implicitElement?: IPos;
  localDeps: string[];
  conventionalDecorators: [number, string][];
}

export function preprocessResource(unit: IFileUnit, options: IPreprocessOptions): ModifyCodeResult {
  const basename = path.basename(unit.path, path.extname(unit.path));
  const expectedResourceName = kebabCase(basename);
  const sf = ts.createSourceFile(unit.path, unit.contents, ts.ScriptTarget.Latest);

  let runtimeImport: ICapturedImport = { names: [], start: 0, end: 0 };
  let jitImport: ICapturedImport = { names: [], start: 0, end: 0 };

  let implicitElement: IPos | undefined;

  // When there are multiple exported classes (e.g. local value converters),
  // they might be deps for rendering the main implicit custom element.
  const localDeps: string[] = [];
  const conventionalDecorators: [number, string][] = [];

  sf.statements.forEach(s => {
    // Find existing import {customElement} from '@aurelia/runtime';
    const runtime = captureImport(s, '@aurelia/runtime', unit.contents);
    if (runtime) {
      // Assumes only one import statement for @aurelia/runtime
      runtimeImport = runtime;
      return;
    }

    // Find existing import {bindingCommand} from '@aurelia/jit';
    const jit = captureImport(s, '@aurelia/jit', unit.contents);
    if (jit) {
      // Assumes only one import statement for @aurelia/jit
      jitImport = jit;
      return;
    }

    // Only care about export class Foo {...}.
    // Note this convention simply doesn't work for
    //   class Foo {}
    //   export {Foo};
    const resource = findResource(s, expectedResourceName, unit.filePair, unit.contents);
    if (!resource) return;
    const {
      localDep,
      needDecorator,
      implicitStatement,
      runtimeImportName,
      jitImportName
    } = resource;

    if (localDep) localDeps.push(localDep);
    if (needDecorator) conventionalDecorators.push(needDecorator);
    if (implicitStatement) implicitElement = implicitStatement;
    if (runtimeImportName) ensureTypeIsExported(runtimeImport.names, runtimeImportName);
    if (jitImportName) ensureTypeIsExported(jitImport.names, jitImportName);
  });

  return modifyResource(unit, {
    runtimeImport,
    jitImport,
    implicitElement,
    localDeps,
    conventionalDecorators
  });
}

function modifyResource(unit: IFileUnit, options: IModifyResourceOptions) {
  const {
    runtimeImport,
    jitImport,
    implicitElement,
    localDeps,
    conventionalDecorators
  } = options;

  const m = modifyCode(unit.contents, unit.path);
  if (implicitElement && unit.filePair) {
    const viewDef = '__au2ViewDef';
    m.prepend(`import * as ${viewDef} from './${unit.filePair}';\n`);

    if (localDeps.length) {
      // When in-file deps are used, move the body of custom element to end of the file,
      // in order to avoid TS2449: Class '...' used before its declaration.
      const elementStatement = unit.contents.slice(implicitElement.pos, implicitElement.end);
      m.replace(implicitElement.pos, implicitElement.end, '');
      m.append(`\n@customElement({ ...${viewDef}, dependencies: [ ...${viewDef}.dependencies, ${localDeps.join(', ')} ] })\n${elementStatement}\n`);
    } else {
      conventionalDecorators.push([implicitElement.pos, `@customElement(${viewDef})\n`]);
    }
  }

  if (conventionalDecorators.length) {
    if (runtimeImport.names.length) {
      let runtimeImportStatement = `import { ${runtimeImport.names.join(', ')} } from '@aurelia/runtime';`;
      if (runtimeImport.end === runtimeImport.start) runtimeImportStatement += '\n';
      m.replace(runtimeImport.start, runtimeImport.end, runtimeImportStatement);
    }

    if (jitImport.names.length) {
      let jitImportStatement = `import { ${jitImport.names.join(', ')} } from '@aurelia/jit';`;
      if (jitImport.end === jitImport.start) jitImportStatement += '\n';
      m.replace(jitImport.start, jitImport.end, jitImportStatement);
    }

    conventionalDecorators.forEach(([pos, str]) => m.insert(pos, str));
  }

  return m.transform();
}

function captureImport(s: ts.Statement, lib: string, code: string): ICapturedImport | void {
  if (ts.isImportDeclaration(s) &&
      ts.isStringLiteral(s.moduleSpecifier) &&
      s.moduleSpecifier.text === lib &&
      s.importClause &&
      s.importClause.namedBindings &&
      ts.isNamedImports(s.importClause.namedBindings)) {
        return {
          names: s.importClause.namedBindings.elements.map(e => e.name.text),
          start: ensureTokenStart(s.pos, code),
          end: s.end
        };
  }
}

// This method mutates runtimeExports.
function ensureTypeIsExported(runtimeExports: string[], type: string) {
  if (!runtimeExports.includes(type)) {
    runtimeExports.push(type);
  }
}

// TypeScript parsed statement could contain leading white spaces.
// This find the exact starting position for latter code injection.
function ensureTokenStart(start: number, code: string) {
  while (start < code.length - 1 && code[start].match(/^\s$/)) start++;
  return start;
}

function findExportPos(node: ts.Node): number | void {
  if (!node.modifiers) return;
  for (const mod of node.modifiers) {
    if (mod.kind === ts.SyntaxKind.ExportKeyword) return mod.pos;
  }
}

const KNOWN_DECORATORS = ['customElement', 'customAttribute', 'valueConverter', 'bindingBehavior', 'bindingCommand'];

function findDecoratedResourceType(node: ts.Node): ResourceType | void {
  if (!node.decorators) return;
  for (const d of node.decorators) {
    if (!ts.isCallExpression(d.expression)) return;
    const exp = d.expression.expression;
    if (ts.isIdentifier(exp)) {
      const name = exp.text;
      if (KNOWN_DECORATORS.includes(name)) {
        return name as ResourceType;
      }
    }
  }
}

function findResource(node: ts.Node, expectedResourceName: string, filePair: string | undefined, code: string): IFoundResource | void {
  if (!ts.isClassDeclaration(node)) return;
  if (!node.name) return;
  let exportPos = findExportPos(node);
  if (typeof exportPos !== 'number') return;
  exportPos = ensureTokenStart(exportPos, code);

  const className = node.name.text;
  const {name, type} = nameConvention(className);
  const isImplicitResource = name === expectedResourceName;
  const decoratedType = findDecoratedResourceType(node);

  if (decoratedType) {
    // Explicitly decorated resource
    if (!isImplicitResource && decoratedType !== 'customElement') {
      return { localDep: className };
    }
  } else {
    if (type === 'customElement') {
      // Custom element can only be implicit resource
      if (isImplicitResource && filePair) {
        return {
          implicitStatement: { pos: exportPos, end: node.end },
          runtimeImportName: type
        };
      }
    } else {
      const result: IFoundResource = {
        needDecorator: [exportPos, `@${type}('${name}')\n`],
        localDep: className,
      };

      if (type === 'bindingCommand') {
        result.jitImportName = type;
      } else {
        result.runtimeImportName = type;
      }

      return result;
    }
  }
}
