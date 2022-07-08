import { MathNode } from 'mathjs';
import { getAssignmentBody, parseExpr, ValidExpr } from './expressions';
import { Map as IMap } from 'immutable';
import { builtinConstants } from './math/symbols';
import { FunctionPlotOptions } from './function-plot/FunctionPlotOptions';
import { reactive, ReactiveEffect } from 'vue';
import { Graph } from './function-plot/d3util';

type MathEnv = Record<string, MathNode | number>;

export interface ExprEnv {
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

export function mkExprEnv(graph: () => Graph): ExprEnv {
   const data: Record<string, ValidExpr> = {};
   const mathEnv: MathEnv = {};
   const names: Set<string> = reactive(new Set());
   const exprEnv = {
      has: (key: string) => key in data,
      get: (key: string) => data[key],
      set: (key: string, value: ValidExpr) => {
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
         const mapped = Object.entries(data).map(([k, v]) => [k, fn(v, k)]);
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
   };
   return exprEnv;
}
