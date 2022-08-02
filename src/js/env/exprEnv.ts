import { isFunctionAssignmentNode, isNumber, MathNode } from 'mathjs';
import { defaultCall, getAssignmentBody, ValidExpr } from '../expressions';
import { Set as ISet, Map as IMap } from 'immutable';
import { builtinConstants } from '../math/symbols';
import { reactive } from 'vue';
import { Graph, mkGraph } from '../function-plot/d3util';
import {
  Datum,
  DatumOptions,
  EvalFn,
} from '../function-plot/FunctionPlotDatum';

import { EnvType, EnvTypeTag } from './EnvType';

import { Animation } from './Animation';
import { EnvExpr } from './EnvExpr';
import { inline } from '../math/mathUtil';
import { assert, defined } from '../util';
import { libraries } from '../libraryValues';
import { defaultFunctionPlotOptionsAxis, FunctionPlotOptions } from '../function-plot/FunctionPlotOptions';
import { Interval } from '../function-plot/types';

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
export function defaultEnvItem(
  typeTag: EnvTypeTag,
  name: string,
  description = ''
): EnvItem {
  return {
    name,
    color: `#00FFFF`,
    hidden: false,
    showGraph: false,
    showValue: false,
    description,
    typeTag,
  };
}

type ExprEnvIndexable = {
  constant: EnvType<number>;
  animated: EnvType<Animation>;
  expression: EnvType<EnvExpr>;
};
export interface ExprEnv extends ExprEnvIndexable {
  constant: EnvType<number>;
  animated: EnvType<Animation>;
  expression: EnvType<EnvExpr>;
  map: <T>(fn: (value: ValidExpr, key: string) => T) => Record<string, T>;
  forEach: (fn: (expr: ValidExpr) => void) => void;
  toRecord: () => Record<string, ValidExpr>;
  toMap: () => IMap<string, ValidExpr>;
  getMathEnv: (includeConstants?: boolean) => MathEnv;
  updateMathEnv: (key: string) => void;
  names: Set<string>;
  getDependencies: (key: string) => DependencyTree;
  items: Map<string, EnvItem>;
  getDatum: (key: string) => Datum | undefined;
  dirty: boolean;
  graph: Graph;
  graphId: string;
}

const datumGetter = (
  item: EnvItem,
  evalFn: EvalFn,
  options: Partial<DatumOptions> = {}
) => Datum(evalFn, { show: item.showGraph, color: item.color, ...options });

// eslint-disable-next-line no-var
let graphCnt = 0;
export const mkExprEnv = (): ExprEnv => {
  graphCnt++;
  const graphId = 'graph-' + graphCnt.toString();
  const items = reactive(new Map<string, EnvItem>());
  const graph = initGraph(graphId);
  const data: Record<string, ValidExpr> = reactive({});
  const mathEnv: MathEnv = reactive({});
  const names: Set<string> = reactive(new Set());
  const constants = new Map<string, number>();
  const animations = new Map<string, Animation>();
  const expressions = new Map<string, EnvExpr>();
  const exprEnv: ExprEnv = reactive({
    graph,
    graphId,
    dirty: false,
    constant: EnvType({
      onChange: () => {
        exprEnv.dirty = true;
      },
      names,
      tag: 'constant',
      data: constants,
      getGraph: () => graph,
      mathEnv,
      getMathValue: (x) => x,
      items,
      getDatum: (v, item) => datumGetter(item, () => v, { nSamples: 2 }),
      getDependencies: () => ISet(),
      toTex: (v) => v.toString(),
    }),
    animated: EnvType({
      onChange: () => {
        exprEnv.dirty = true;
      },
      names,
      tag: 'animated',
      data: animations,
      getGraph: () => graph,
      mathEnv,
      getMathValue: (x) => Animation.toMathNode(x),
      items,
      getDatum: (v, item) => {
        if (!defined(exprEnv.expression.get(v.fnName))) {
          const fn = libraries.get('periodic')?.expression[v.fnName][0];
          assert(defined(fn), 'missing periodic function: ' + v.fnName);
          exprEnv.expression.set(v.fnName, fn, { hidden: true });
        }
        return datumGetter(
          item,
          nodeToEvalFn(Animation.toMathNode(v), exprEnv)
        );
      },
      getDependencies: () => ISet(['time']),
      toTex: Animation.toTex,
    }),
    expression: EnvType({
      onChange: () => {
        exprEnv.dirty = true;
      },
      names,
      tag: 'expression',
      data: expressions,
      getGraph: () => graph,
      mathEnv,
      getMathValue: (v) => v.node ?? 0, // TODO
      items,
      getDatum: (v, item) =>
        datumGetter(item, EnvExpr.toEvalFn(item.name, v, exprEnv)),
      getDependencies: EnvExpr.getDependencies,
      toTex: EnvExpr.toTex,
    }),
    items,
    map: <T>(fn: (value: ValidExpr, key: string) => T) => {
      const mapped = Object.entries(data).map(
        ([k, v]) => [k, fn(v, k)] as const
      );
      return Object.fromEntries(mapped);
    },
    forEach: (fn: (expr: ValidExpr) => void) => Object.values(data).forEach(fn),
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
  } as const);
  return exprEnv;
}

// utterly accursed unsafe type
export type U2I<U> = (U extends U ? (u: U) => 0 : never) extends (
  i: infer I
) => 0
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
    ? defaultCall(node, env.names)
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
        // debugger;
        return 0;
      } else {
        return result;
      }
    } catch (e) {
  //    appState.error = String(e);
      //  debugger;
      return 0;
    }
  };
  return ret;
};

function initGraph(elementId: string) {
  const graph = mkGraph(graphOptions('#' + elementId));
  return graph;
}

function graphOptions(target: string): FunctionPlotOptions {
  return {
    target,
    data: {},
    width: Math.max(window.innerWidth, 400),
    height: Math.max(window.innerHeight * 0.9, 400),
    xDomain: reactive(Interval(0, 1)),
    xAxis: { ...defaultFunctionPlotOptionsAxis(), type: 'linear' },
    yDomain: reactive(Interval(0, 1)),
  };
}


