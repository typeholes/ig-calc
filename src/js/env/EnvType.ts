import { Datum, FunctionPlotDatum } from '../function-plot/FunctionPlotDatum';
import { Set as ISet } from 'immutable';
import { EnvItem, MathEnv } from './exprEnv';
import { Graph } from '../function-plot/d3util';
import { assert } from '../util';
import { reactive, watch } from 'vue';
import { state as appState } from 'components/uiUtil';

export type EnvTypeTag = 'constant' | 'animated' | 'expression';

export interface EnvType<V> {
   tag: EnvTypeTag;
   has: (key: string) => boolean;
   get: (key: string) => V | undefined;
   set: (key: string, value: V, props?: Partial<EnvItem>) => V;
   delete: (key: string) => void;
   toRecord: () => Record<string, V>;
   getDatum: (v: V, item: EnvItem) => Datum;
   showGraph: (key: string, showGraph: boolean) => void;
   colorGraph: (key: string, color: `#${string}`) => void;
   getState: (key: string) => EnvItem & { value: V };
   getDependencies: (v: V) => ISet<string>;
   toTex: (key: string, v: V) => string;
}

export function EnvType<V>({
   names,
   tag,
   data,
   getGraph,
   mathEnv,
   getMathValue,
   items,
   getDatum,
   getDependencies,
   toTex,
}: {
   names: Set<string>;
   tag: EnvTypeTag;
   data: Map<string, V>;
   getGraph: () => Graph;
   mathEnv: MathEnv;
   getMathValue: (v: V) => MathEnv[string];
   items: Map<string, EnvItem>;
   getDatum: (v: V, item: EnvItem) => FunctionPlotDatum;
   getDependencies: (v: V) => ISet<string>;
   toTex: (v: V) => string;
}): EnvType<V> {
   const envType: EnvType<V> = {
      tag,
      getDatum,
      getDependencies,
      has: (key) => data.has(key),
      get: (key) => data.get(key),
      set: (key, value, props = {}) => {
         if (key != 'time') { appState.modified = true; }
         names.add(key);
         data.set(key, value);
         mathEnv[key] = getMathValue(value);
         if (!items.has(key)) {
            items.set(key, {
               name: key,
               color: '#FFFF00',
               hidden: false,
               showGraph: false,
               showValue: false,
               description: undefined,
               typeTag: tag,
               ...props,
            });
         } else {
            const item = items.get(key);
            assert.defined(item);
            envType.showGraph(key, item.showGraph);
         }
         return value;
      },
      delete: (key) => {
         appState.modified = true;
         data.delete(key);
         delete mathEnv[key];
         names.delete(key);
         // leave envItem so it can be reused by another item with the same name
      },
      toRecord: () => Object.fromEntries(data.entries()),
      showGraph: (key: string, showGraph: boolean) => {
         const item = items.get(key);
         assert.defined(item);
         const graph = getGraph();
         const value = data.get(key);
         assert.defined(value);
         if (item.showGraph === showGraph) {
            return;
         }
         appState.modified = true;
         item.showGraph = showGraph;
         if (showGraph) {
            graph.options.data[key] = getDatum(value, item);
         } else {
            delete graph.options.data[key];
         }
         if (!appState.runTimer) { graph.drawLines()}
      },
      colorGraph: (key: string, color: `#${string}`) => {
         const item = items.get(key);
         assert.defined(item);
         const graph = getGraph();
         if (color === item.color) {
            return;
         }
         appState.modified = true;
         item.color = color;
         if (key in graph.options.data) {
            graph.options.data[key].color = color;
         }
         if (!appState.runTimer) { graph.drawLines()}
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
      toTex: (key, v) => {
         const tex = toTex(v);
         const fullTex = tex.includes('=')
            ? tex
            : '\\mathrm{' + key + '}:=' + tex;
         console.log({ toTex: key, fullTex });
         return fullTex;
      },
   };
   return envType;
}
