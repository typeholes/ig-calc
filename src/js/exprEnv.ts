import { MathNode } from 'mathjs';
import { getAssignmentBody, parseExpr, ValidExpr } from './expressions';
import { Map as IMap } from 'immutable';
import { builtinConstants } from './math/symbols';
import { FunctionPlotOptions } from './function-plot/FunctionPlotOptions';
import { reactive } from 'vue';

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
}

export function mkExprEnv(graphOptions: FunctionPlotOptions): ExprEnv {
   const data: Record<string, ValidExpr> = reactive({});
   const mathEnv: MathEnv = {};
   const exprEnv = {
      has: (key: string) => key in data,
      get: (key: string) => data[key],
      set: (key: string, value: ValidExpr) => {
         data[key] = value;
         mathEnv[key] = getAssignmentBody(value.node);
         graphOptions[key] = ValidExpr.toDatum(value, exprEnv, false);
         return value;
      },
      delete: (key: string) => {
         delete data[key];
         delete mathEnv[key];
         delete graphOptions.data[key];
      },
      map: <T>(fn: (value: ValidExpr, key: string) => T) => {
         const mapped = Object.entries(data).map(([k, v]) => [v, fn(v, k)]);
         return Object.fromEntries(mapped);
      },
      clear: () => {
         for (const k in data) {
            delete data[k];
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
   };
   return exprEnv;
}
