import { MathNode } from 'mathjs';
import { getAssignmentBody, ValidExpr } from './expressions';
import { Map as IMap } from 'immutable';
import { builtinConstants } from './math/symbols';
import { reactive, watch } from 'vue';
import { Graph } from './function-plot/d3util';
import {
   Datum,
   DatumOptions,
   EvalFn,
   FunctionPlotDatum,
} from './function-plot/FunctionPlotDatum';
import { assert } from './util';

type MathEnv = Record<string, MathNode | number>;

interface EnvItem {
   color: `#${string}`;
   hidden: boolean;
   showGraph: boolean;
   showValue: boolean;
   description: string | undefined;
}

interface EnvType<V> {
   has: (key: string) => boolean;
   get: (key: string) => V | undefined;
   set: (key: string, value: V) => V;
   delete: (key: string) => void;
   toRecord: () => Record<string, V>;
   getDatum: (v: V, item: EnvItem) => Datum;
   showGraph: (key: string, showGraph: boolean) => void;
   colorGraph: (key: string, color: `#${string}`) => void;
   getState: (key: string) => EnvItem & { value: V };
}

function EnvType<V>(
   data: Map<string, V>,
   getGraph: () => Graph,
   mathEnv: MathEnv,
   getMathValue: (v: V) => MathEnv[string],
   items: Map<string, EnvItem>,
   getDatum: (v: V, item: EnvItem) => FunctionPlotDatum
): EnvType<V> {
   const envType: EnvType<V> = {
      getDatum,
      has: (key) => data.has(key),
      get: (key) => data.get(key),
      set: (key, value) => {
         data.set(key, value);
         mathEnv[key] = getMathValue(value);
         if (!items.has(key)) {
            items.set(key, {
               color: '#FFFF00',
               hidden: false,
               showGraph: false,
               showValue: false,
               description: undefined,
            });
         } else {
            const item = items.get(key);
            assert.defined(item);
            envType.showGraph(key, item.showGraph);
         }
         return value;
      },
      delete: (key) => {
         data.delete(key);
         delete mathEnv[key];
         // leave envItem so it can be reused by another item with the same name
      },
      toRecord: () => Object.fromEntries(data.entries()),
      showGraph: (key: string, showGraph: boolean) => {
         const item = items.get(key);
         assert.defined(item);
         const graph = getGraph();
         const value = data.get(key);
         assert.defined(value);
         item.showGraph = showGraph;
         if (showGraph) {
            graph.options.data[key] = getDatum(value, item);
            graph.drawLines();
         } else {
            delete graph.options.data[key];
         }
      },
      colorGraph: (key: string, color: `#${string}`) => {
         const item = items.get(key);
         assert.defined(item);
         const graph = getGraph();
         item.color = color;
         if (key in graph.options.data) {
            graph.options.data[key].color = color;
            graph.drawLines();
         }
      },
      getState: (key: string) => {
         const item = items.get(key);
         assert.defined(item);
         const value = data.get(key);
         //         assert.defined(value);
         const state = reactive({ ...item, value });
         watch(
            () => state.value,
            (value) => {
               envType.set(key, value as V); // UnwrapRef<V> should just be V
            }
         );

         watch(
            () => state.showGraph,
            (show) => envType.showGraph(key, show)
         );

         watch(
            () => state.color,
            (color) => envType.colorGraph(key, color)
         );
         return state as typeof state & { value: V }; // UnwrapRef<V> should just be V
      },
   };
   return envType;
}

export interface ExprEnv {
   constant: EnvType<number>;
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
   names: () => Set<string>;
}

const datumGetter = (
   item: EnvItem,
   evalFn: EvalFn,
   options: Partial<DatumOptions> = {}
) => Datum(evalFn, { show: item.showGraph, color: item.color, ...options });

export function mkExprEnv(graph: () => Graph): ExprEnv {
   const items = new Map<string, EnvItem>();
   const data: Record<string, ValidExpr> = reactive({});
   const mathEnv: MathEnv = reactive({});
   const names: Set<string> = reactive(new Set());
   const constants: Map<string, number> = new Map<string, number>();
   const exprEnv = {
      constant: EnvType(
         constants,
         graph,
         mathEnv,
         (x) => x,
         items,
         (v, item) => datumGetter(item, () => v, { nSamples: 2 })
      ),
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
      names: () => names,
   } as const;
   exprEnv.constant.set('foo', 1);
   exprEnv.constant.set('bar', 2);
   return exprEnv;
}
