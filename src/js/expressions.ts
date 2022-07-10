import {
   isAssignmentNode,
   isConstantNode,
   isFunctionAssignmentNode,
   isNumber,
   isString,
   MathNode,
   SymbolNode,
} from 'mathjs';
import * as M from 'mathjs';
import {
   parse,
   getDependencies as getVars,
   inline,
   freeVars as getFreeVars,
} from '../js/math/mathUtil';

import { missingPlotFunctions } from '../js/math/symbols';

import { Set as ISet } from 'immutable';
import { Map as IMap } from 'immutable';

import { assert, defined, hasPropIs, isBoolean } from '../js/util';
import { errorable, Errorable, flatMap } from '../js/Either';
import {
   currentColor,
   graph,
   refreshDatumEnvironments,
   refreshTex,
   state,
} from '../components/uiUtil';
import { Datum, EvalFn } from '../js/function-plot/FunctionPlotDatum';
import { simplify } from '../js/math/simplify';
import { ExprEnv } from './exprEnv';

// eslint-disable-next-line vue/prefer-import-from-vue
import { isArray, isObject } from '@vue/shared';

export const SaveRep = {
   toSave,
   fromSave,
   saveKey: 'ExprEnvSaveRep' as const,
};

function unJS(expr: string) {
   return expr
      .replaceAll('**', '^')
      .replaceAll('Math.PI', 'pi')
      .replaceAll('Math.E', 'e')
      .replaceAll('Math.', '')
      .replace(
         /const ([^=]+)=(.+)=>(.+)/,
         (match, name, args, body) => name + args + '=' + body
      )
      .replace(/const ([^=]+)=(.+)/, (match, name, body) => name + '=' + body);
}
export function parseExpr(
   env: ExprEnv,
   s: string,
   forceName?: string | undefined
): Errorable<[ValidExpr, string]> {
   const result = parse(unJS(s));

   return flatMap(result, (node) =>
      errorable(() => {
         const name = forceName ?? getNodeName(node);

         if (!defined(forceName) && env.has(name)) {
            throw new Error(name + ' already defined');
         }

         const newExpr = validExpr(name, node, ISet(getVars(node)));
         env.set(name, newExpr);
         return [newExpr, name];
      })
   );
}

export interface ValidExpr {
   name: string;
   node: MathNode;
   vars: ISet<string>;
   showValue: boolean;
   description: string | undefined;
   showExpr: boolean;
}

export const validExpr = (
   name: string,
   node: MathNode,
   vars: ISet<string>,
   showValue = false,
   showExpr = true,
   description = undefined as string | undefined
): ValidExpr => ({ name, node, vars, showValue, description, showExpr });

const xSymbolNode = new SymbolNode('x');

export function isGraphable(env: ExprEnv, expr: ValidExpr) {
   return defined(getGraphFn(env, expr));
}

export function getFunctionBody(node: MathNode) {
   return isFunctionAssignmentNode(node) ? node.expr : node;
}

export function getAssignmentBody(node: MathNode) {
   return isAssignmentNode(node) ? node.value : node;
}

export function getBody(node: MathNode) {
   return getFunctionBody(getAssignmentBody(node));
}

export function getGraphFnStr(
   env: ExprEnv,
   expr: ValidExpr,
   subConstants = false
): string | undefined {
   return getGraphFn(env, expr, subConstants)?.toString();
}

export function getGraphFn(
   env: ExprEnv,
   expr: ValidExpr | undefined,
   subConstants = false
): MathNode | undefined {
   if (!defined(expr)) {
      return undefined;
   }
   // TODO return something other than undefined when not graphable?
   const node = getBody(expr.node);
   const mathEnv = env.getMathEnv(subConstants);
   const inlined = inline(node, mathEnv);
   const freeVars = ISet(getFreeVars(mathEnv, inlined));

   if (freeVars.size === 0) {
      return inlined;
   }
   if (freeVars.size > 1) {
      return undefined;
   }

   const free = freeVars.first()!;

   const graphNode = inline(inlined, {
      [free]: xSymbolNode,
      ...missingPlotFunctions.toObject(),
   });
   return getFunctionBody(graphNode);
}

type ExprMap = IMap<string, ValidExpr>;
const emptyEnv: ExprMap = IMap();

export function getDependencies(
   env = emptyEnv,
   constants: Record<string, number>,
   expr: ValidExpr,
   bound: 'bound' | 'free' | 'all' = 'all'
) {
   const deps = transativeDependencies(env, expr.vars);
   if (bound === 'all') {
      return deps;
   }

   return deps.filter(
      (dep) => (bound === 'bound') === (env.has(dep) || dep in constants)
   );
}

function transativeDependencies(
   env: ExprMap,
   deps: ISet<string>,
   ancestors: ISet<string> = ISet()
): ISet<string> {
   if (deps.some((dep) => ancestors.has(dep))) {
      throw new Error('Cyclic dependency: ' + deps.join(', '));
   }

   const newAncestors = deps.union(ancestors);
   return newAncestors.union(
      deps.flatMap((dep) => {
         const children = env.get(dep)?.vars;
         if (!children) {
            return ISet();
         }
         return transativeDependencies(env, children, newAncestors);
      })
   );
}

// Broken
/*
export function updateExpr(key: string, value: string): ExprError | 'valid' {
   const expr = parseExpr(value);
   if (expr.name === '#error') {
      return expr as ExprError;
   i
   if (typeof key === 'number') {
      delete expressions.anonymous[key];
   } else {
      delete expressions.named[key];
   }

   return addExpr(expr);
}
*/

export const getNodeName = (node: MathNode) =>
   isAssignmentNode(node) || isFunctionAssignmentNode(node)
      ? node.name
      : 'anon: ' + node.toString();

export type SaveRep = Record<
   string,
   {
      expr: string;
      color: string;
      show: boolean;
      showValue: boolean;
      description: string | undefined;
      showExpr: boolean;
   }
>;

export function toSaveRep(env: ExprEnv): SaveRep {
   const saveRep = env.map((v, k) => ({
      expr: v.node.toString(),
      color: graph.options.data[k].color,
      show: graph.options.data[k].show,
      showValue: v.showValue,
      description: v.description,
      showExpr: v.showExpr,
   }));
   return saveRep;
}

function toSave(rep: SaveRep): string {
   return JSON.stringify(rep);
}

function fromSave(s: string): Errorable<SaveRep> {
   return errorable(() => {
      const obj : unknown = JSON.parse(s);
      assert.is(obj, isObject)
      const entries: unknown = Object.entries(obj);
      const saveRep: SaveRep = {};

      assert.is(entries, isArray);
      entries.forEach(([k, v]) => {
         assert.is(k, isString)
         if (!hasPropIs(v, 'expr', isString)) {
            throw new Error('Save entry: ' + k + ' missing "expr"');
         }
         const expr = v.expr;
         const color = hasPropIs(v, 'color', isString) ? v.color : '#ff0000';
         const show = hasPropIs(v, 'show', isBoolean) ? v.show : false;
         const showValue = hasPropIs(v, 'showValue', isBoolean)
            ? v.showValue
            : false;
         const showExpr = hasPropIs(v, 'showExpr', isBoolean)
            ? v.showExpr
            : true;
         const description = hasPropIs(v, 'description', isString)
            ? v.description
            : undefined;
         saveRep[k] = { expr, color, show, showValue, description, showExpr };
      });

      return saveRep;
   });
}

function defaultCall(fn: M.FunctionAssignmentNode): MathNode {
   const name = fn.name;
   const args = fn.params;
   const call = `${name}(${args.join(',')})`;
   return M.parse(call);
}

function toEvalFn(
   getNode: (env: ExprEnv, expr: ValidExpr) => MathNode,
   expr: ValidExpr,
   env: ExprEnv
): EvalFn {
   const node = getNode(env, expr);
   const body = isFunctionAssignmentNode(node)
      ? defaultCall(node)
      : getAssignmentBody(node);
   const mathEnv = { ...env.getMathEnv() };
   delete mathEnv['time'];
   const inlined = inline(body, mathEnv);
   const firstFree = getDependencies(
      env.toMap(),
      env.constant.toRecord(),
      expr,
      'free'
   ).first('x');
   // eslint-disable-next-line @typescript-eslint/unbound-method
   const fn = inlined.compile().evaluate;
   const ret = (x: number) => {
      try {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
         const result = fn({ [firstFree]: x, ...env.constant.toRecord() });
         if (!isNumber(result)) {
            return 0;
         } else {
            return result;
         }
      } catch (e) {
         return 0;
      }
   };
   console.log({
      firstFree,
      expr: inlined.toString(),
      '(0)': ret(0),
      '(1)': ret(1),
   });
   return ret;
}
export const ValidExpr = {
   toDatum: (
      expr: ValidExpr,
      env: ExprEnv,
      show: boolean,
      color = '#FFFFFF'
   ) => {
      const graphFn = getGraphFn(env, expr, true);
      if (!defined(graphFn)) {
         return Datum(() => 0, { show, color });
      }
      // const firstFree = getDependencies(env, expr, 'free').first('x');
      //
      const datum = Datum(
         toEvalFn(() => expr.node, expr, env),
         { show, color },
         undefined //  simplifying and inlining is a net loss
         // TODO: revisit with dependency tracking to only simplify when needed
         // () =>
         //    toEvalFn(
         //       (env, expr) =>
         //          simplify(getGraphFn(env/*.delete('time')*/, expr, true)!, false),
         //       expr,
         //       env
         //    )
      );
      return datum;
   },
};

export function adjustExpr(
   env: ExprEnv,
   expr: ValidExpr,
   template: string,
   addParen = true
) {
   if (isFunctionAssignmentNode(expr.node)) {
      throw new Error('cannot adjust function assignment nodes');
   }

   //   const datum = graph.options.data[expr.name];
   const sub = addParen ? template.replace('%', '(%)') : template;
   if (isAssignmentNode(expr.node)) {
      const body = getBody(expr.node);
      const newBody = simplify(`${sub.replace('%', body.toString())}`);
      expr.node.value = newBody;
   } else {
      expr.node = simplify(
         `${expr.name} = ${sub.replace('%', expr.node.toString())}`
      );
   }
   env.set(expr.name, expr);
   refreshDatumEnvironments();
   errorable(() => graph.drawLines());
}

export function buildEnv(fns: Record<string, string>) {
   for (const name in fns) {
      state.env.delete(name);
      const exprStr = fns[name];
      const result = parseExpr(state.env, exprStr, name);
      Errorable.raise(result);
   }

   for (const name in fns) {
      const expr = state.env.get(name)!;
      graph.options.data[name] = ValidExpr.toDatum(
         expr,
         state.env,
         false,
         currentColor()
      );
   }

   refreshTex();
}

export function isNumericConstant(node: MathNode) {
   return isAssignmentNode(node) && isConstantNode(getAssignmentBody(node));
}

export function getNumericConstant(node: MathNode): number {
   let result = 0;
   if (isConstantNode(node) && isNumber(node.value)) {
      result = node.value;
   } else if (isAssignmentNode(node)) {
      result = getNumericConstant(getAssignmentBody(node));
   }

   return result;
}

export function setNumericConstant(node: MathNode, value: number) {
   if (isConstantNode(node) && isNumber(node.value)) {
      node.value = value;
   } else if (isAssignmentNode(node)) {
      const body = getAssignmentBody(node);
      if (isConstantNode(body)) {
         body.value = value;
      }
   }
}

export function setAssignmentBody(node: MathNode, expr: string) {
   if (isAssignmentNode(node)) {
      node.value = M.parse(expr);
   }
}
