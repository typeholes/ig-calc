import { MathNode } from 'mathjs';
import { getAssignmentBody, parseExpr, ValidExpr } from './expressions';
import { Map as IMap } from 'immutable';
import { builtinConstants } from './math/symbols';
import { reactive } from 'vue';
import { Graph } from './function-plot/d3util';
import { defaultGraphItemValues, GraphConstant } from './GraphItem';

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
   hasConstant: (key: string) => boolean;
   getConstant: (key: string) => number;
   setConstant: (key: string, value: number) => number;
   deleteConstant: (key: string) => void;
   getConstants: () => Record<string, number>;
   getGraphConstants: () => Map<string, GraphConstant>;
}

export function mkExprEnv(graph: () => Graph): ExprEnv {
   const data: Record<string, ValidExpr> = reactive({});
   const mathEnv: MathEnv = reactive({});
   const names: Set<string> = reactive(new Set());
   const constants: Record<string, number> = {};
   const graphConstants: Map<string, GraphConstant> = reactive(new Map());
   const exprEnv = {
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
      hasConstant: (key: string) => key in constants,
      getConstant: (key: string) => constants[key],
      setConstant: (key: string, value: number) => {
         constants[key] = value;
         mathEnv[key] = value;
         if (graphConstants.has(key)) {
            graphConstants.get(key)!.value = value;
         } else {
            graphConstants.set(
               key,
               GraphConstant({ name: key, ...defaultGraphItemValues }, value)
            );
         }
         return value;
      },
      deleteConstant: (key: string) => {
         delete constants[key];
         delete mathEnv[key];
      },
      getConstants: () => constants,
      getGraphConstants: () => graphConstants,
   };
   exprEnv.setConstant('foo', 1);
   exprEnv.setConstant('bar', 2);
   return exprEnv;
}
