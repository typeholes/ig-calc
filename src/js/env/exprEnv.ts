import { isFunctionAssignmentNode, isNumber, MathNode } from 'mathjs';
import { defaultCall, getAssignmentBody } from '../expressions';
import { Set as ISet, Map as IMap } from 'immutable';
import { builtinConstants } from '../math/symbols';
import { nextTick, reactive } from 'vue';
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
import {
  defaultFunctionPlotOptionsAxis,
  FunctionPlotOptions,
} from '../function-plot/FunctionPlotOptions';
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
  getMathEnv: (includeConstants?: boolean) => MathEnv;
  getDependencies: (key: string) => DependencyTree;
  items: Map<string, EnvItem>;
  getDatum: (key: string) => Datum | undefined;
  dirty: boolean;
  //  graph: Graph;
  order: string[];
  getType: (key: string) => EnvTypeTag;
  activate: () => void;
  drawLines: () => void;
}

const datumGetter = (
  item: EnvItem,
  evalFn: EvalFn,
  options: Partial<DatumOptions> = {}
) => Datum(evalFn, { show: item.showGraph, color: item.color, ...options });

// eslint-disable-next-line no-var
export const mkExprEnv = (): ExprEnv => {
  const items = reactive(new Map<string, EnvItem>());
  const graph = initGraph();
  const mathEnv: MathEnv = {};
  const constants = new Map<string, number>();
  const animations = new Map<string, Animation>();
  const expressions = new Map<string, EnvExpr>();
  const order: string[] = reactive([]);
  let active = false;
  function onChange(
    name: string,
    changeType: 'insert' | 'update' | 'delete' = 'update'
  ) {
    if (!active) {
      return;
    }

    exprEnv.dirty = true;
    if (changeType === 'delete') {
      const idx = order.indexOf(name);
      if (idx >= 0) {
        order.splice(idx, 1);
      }
    } else {
      if (!order.includes(name)) {
        order.push(name);
      }
      graph.drawLines();
    }
  }
  const exprEnv: ExprEnv = {
    //    graph,
    dirty: false,
    constant: EnvType({
      onChange,
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
      onChange,
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
      onChange,
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
    getMathEnv: (includeConstants = false) =>
      includeConstants
        ? { ...mathEnv, ...builtinConstants.toObject() }
        : mathEnv,
    getDependencies: (key: string) => getDependencies(key, exprEnv, items),
    getDatum: (key: string) => getDatum(key, exprEnv, items),
    order,
    getType: (key: string) => items.get(key)?.typeTag ?? 'constant',
    activate: () => {
      active = true;
      nextTick(() => {
        graph.injectIntoTarget();
        graph.resetZoom(Interval(-10, 10), 0);
        graph.drawLines();
        graph.drawLines();
      });
    },
    drawLines: () => {
      if (active) {
        graph.drawLines();
      }
    },
  } as const;
  return exprEnv;
};

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
    ? defaultCall(node, new Set(env.order))
    : getAssignmentBody(node);
  const mathEnv = { ...env.getMathEnv() };
  delete mathEnv['time'];
  // not inlining causes big performance issues
  // and functions to not evaluate
  // can't inline unless we call this again when dependencies change
  const inlined = inline(body, mathEnv);
  const fn = inlined.compile().evaluate;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  // const fn = body.compile().evaluate;
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

function initGraph() {
  const graph = mkGraph(graphOptions('#graph')); // + elementId));
  return graph;
}

function graphOptions(target: string): FunctionPlotOptions {
  return {
    target,
    data: {},
    width: Math.max(window.innerWidth, 400),
    height: Math.max(window.innerHeight, 400),
    xDomain: reactive(Interval(0, 1)),
    xAxis: { ...defaultFunctionPlotOptionsAxis(), type: 'linear' },
    yDomain: reactive(Interval(0, 1)),
  };
}
