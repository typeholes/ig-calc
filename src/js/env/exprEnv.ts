import { isFunctionAssignmentNode, isNumber, MathNode } from 'mathjs';
import { defaultCall, getAssignmentBody, ValidExpr } from '../expressions';
import { Set as ISet, Map as IMap } from 'immutable';
import { builtinConstants } from '../math/symbols';
import { reactive } from 'vue';
import { Graph } from '../function-plot/d3util';
import {
   Datum,
   DatumOptions,
   EvalFn,
} from '../function-plot/FunctionPlotDatum';

import { EnvType, EnvTypeTag } from './EnvType';

import { Animation } from './Animation';
import { EnvExpr } from './EnvExpr';
import { inline } from '../math/mathUtil';
import { state } from '../../components/uiUtil';

export type MathEnv = Record<string, MathNode | number>;

export interface EnvItem {
   name: string;
   color: `#${string}`;
   hidden: boolean;
   showGraph: boolean;
   showValue: boolean;
   description: string | undefined;
   typeTag: EnvTypeTag;
}

export interface ExprEnv {
   constant: EnvType<number>;
   animated: EnvType<Animation>;
   expression: EnvType<EnvExpr>;
   has: (key: string) => boolean;
   get: (key: string) => ValidExpr;
   set: (key: string, value: ValidExpr) => ValidExpr;
   delete: (key: string) => void;
   map: <T>(fn: (value: ValidExpr, key: string) => T) => Record<string, T>;
   clear: () => void;
   forEach: (fn: (expr: ValidExpr) => void) => void;
   toRecord: () => Record<string, ValidExpr>;
   toMap: () => IMap<string, ValidExpr>;
   getMathEnv: (includeConstants?: boolean) => MathEnv;
   updateMathEnv: (key: string) => void;
   names: Set<string>;
   getDependencies: (key: string) => DependencyTree;
   items: Map<string, EnvItem>;
   getDatum: (key: string) => Datum | undefined;
}

const datumGetter = (
   item: EnvItem,
   evalFn: EvalFn,
   options: Partial<DatumOptions> = {}
) => Datum(evalFn, { show: item.showGraph, color: item.color, ...options });

export function mkExprEnv(graph: () => Graph): ExprEnv {
   const items = reactive(new Map<string, EnvItem>());
   const data: Record<string, ValidExpr> = reactive({});
   const mathEnv: MathEnv = reactive({});
   const names: Set<string> = reactive(new Set());
   const constants = new Map<string, number>();
   const animations = new Map<string, Animation>();
   const expressions = new Map<string, EnvExpr>();
   const exprEnv: ExprEnv = {
      constant: EnvType({
         names,
         tag: 'constant',
         data: constants,
         getGraph: graph,
         mathEnv,
         getMathValue: (x) => x,
         items,
         getDatum: (v, item) => datumGetter(item, () => v, { nSamples: 2 }),
         getDependencies: () => ISet(),
         toTex: (v) => v.toString(),
      }),
      animated: EnvType({
         names,
         tag: 'animated',
         data: animations,
         getGraph: graph,
         mathEnv,
         getMathValue: (x) => Animation.toMathNode(x),
         items,
         getDatum: (v, item) =>
            datumGetter(item, nodeToEvalFn(Animation.toMathNode(v), exprEnv)),
         getDependencies: () => ISet(['time']),
         toTex: Animation.toTex,
      }),
      expression: EnvType({
         names,
         tag: 'expression',
         data: expressions,
         getGraph: graph,
         mathEnv,
         getMathValue: (v) => v.node ?? 0, // TODO
         items,
         getDatum: (v, item) =>
            datumGetter(item, EnvExpr.toEvalFn(item.name, v, exprEnv)),
         getDependencies: EnvExpr.getDependencies,
         toTex: EnvExpr.toTex
      }),
      items,
      has: (key: string) => key in data,
      get: (key: string) => data[key],
      set: (key: string, value: ValidExpr) => {
         if (key === 'time') {
            debugger;
         }
         data[key] = value;
         mathEnv[key] = getAssignmentBody(value.node);
         graph().options.data[key] = ValidExpr.toDatum(value, exprEnv, false);
         names.add(key);
         return value;
      },
      delete: (key: string) => {
         delete data[key];
         delete mathEnv[key];
         delete graph().options.data[key];
         names.delete(key);
      },
      map: <T>(fn: (value: ValidExpr, key: string) => T) => {
         const mapped = Object.entries(data).map(
            ([k, v]) => [k, fn(v, k)] as const
         );
         return Object.fromEntries(mapped);
      },
      clear: () => {
         for (const k in data) {
            exprEnv.delete(k);
         }
      },
      forEach: (fn: (expr: ValidExpr) => void) =>
         Object.values(data).forEach(fn),
      toRecord: () => ({ ...data }),
      toMap: () => IMap(data),
      getMathEnv: (includeConstants = false) =>
         includeConstants
            ? { ...mathEnv, ...builtinConstants.toObject() }
            : mathEnv,
      updateMathEnv: (key: string) =>
         (mathEnv[key] = getAssignmentBody(data[key].node)),
      names: names,
      getDependencies: (key: string) => getDependencies(key, exprEnv, items),
      getDatum: (key: string) => getDatum(key, exprEnv, items),
   } as const;
   /*
   exprEnv.constant.set('foo', 1);
   exprEnv.constant.set('bar', 2);
   exprEnv.animated.set('t', Animation('zigZag', 0, 5, 3));
   exprEnv.expression.set('g', EnvExpr('g(x) = x * q'));
   exprEnv.expression.set('f', EnvExpr('sin(g(t))'));
   exprEnv.expression.set('oops', EnvExpr('foo) * bar'));
   */
   exprEnv.expression.set(
      'zigZag',
      EnvExpr(
         'zigZag(x, min, height, width) = min + height * (acos(0.999 sin(2 pi x / width)) / pi)'
      )
   );
   return exprEnv;
}

// utterly accursed unsafe type
type U2I<U> = (U extends U ? (u: U) => 0 : never) extends (i: infer I) => 0
   ? Extract<I, U>
   : never;

type DependencyTree = IMap<
   string,
   { bound: boolean; transitive: DependencyTree }
>;

function getDatum(
   key: string,
   env: ExprEnv,
   items: Map<string, EnvItem>
): Datum | undefined {
   if (!items.has(key)) {
      return undefined;
   }

   const item = items.get(key)!;
   const value = env[item.typeTag].get(key)!;
   const Ivalue = value as U2I<typeof value>; // fake it as an intersection so we can call getDependencies
   const datum = env[item.typeTag].getDatum(Ivalue, item);
   return datum;
}

function getDependencies(
   key: string,
   env: ExprEnv,
   items: Map<string, EnvItem>
): DependencyTree {
   if (!items.has(key)) {
      return IMap();
   }

   const item = items.get(key)!;
   const value = env[item.typeTag].get(key)!;
   const Ivalue = value as U2I<typeof value>; // fake it as an intersection so we can call getDependencies
   const local = env[item.typeTag].getDependencies(Ivalue);
   const deps = local.toMap().map((name) => ({
      bound: items.has(name),
      transitive: items.has(name)
         ? getDependencies(name, env, items)
         : (IMap() as DependencyTree),
   }));
   return deps;
}

const tuple = <A, B>(a: A, b: B): [A, B] => [a, b];

export function flattenDependencyTree(
   tree: DependencyTree
): IMap<string, boolean> {
   function go(tree: DependencyTree, acc: [string, boolean][]) {
      const x = tree.toArray().map(([name, obj]) => tuple(name, obj.bound));
      acc.push(...x);
      tree.forEach(({ transitive }) => go(transitive, acc));
      return acc;
   }
   return IMap(go(tree, []));
}

export const nodeToEvalFn = (
   node: MathNode,
   env: ExprEnv,
   freeVar = '__unused'
): EvalFn => {
   const body = isFunctionAssignmentNode(node)
      ? defaultCall(node)
      : getAssignmentBody(node);
   const mathEnv = { ...env.getMathEnv() };
   delete mathEnv['time'];
   const inlined = inline(body, mathEnv);
   // eslint-disable-next-line @typescript-eslint/unbound-method
   const fn = inlined.compile().evaluate;
   const ret = (x: number) => {
      try {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
         const result = fn({ [freeVar]: x, ...env.getMathEnv() });
         if (!isNumber(result)) {
            debugger;
            return 0;
         } else {
            return result;
         }
      } catch (e) {
         state.error = String(e);
         debugger;
         return 0;
      }
   };
   return ret;
};
