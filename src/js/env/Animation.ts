import { isFunctionAssignmentNode, isNumber, MathNode, parse as parseMathNode } from "mathjs";
import { defaultCall, getAssignmentBody } from "../expressions";
import { EvalFn } from "../function-plot/FunctionPlotDatum";
import { inline } from "../math/mathUtil";
import { ExprEnv } from "./exprEnv";

export interface Animation {
   fnName: string;
   from: number;
   to: number;
   period: number;
}

export function Animation(
   fnName: string,
   from: number,
   to: number,
   period: number
): Animation {
   return { fnName, from, to, period };
}
Animation.toExprString = ({ fnName, from, to, period }: Animation): string =>
   `${fnName}(time, ${from}, ${to - from}, ${period})`;

Animation.toMathNode = (animation: Animation): MathNode =>
   parseMathNode(Animation.toExprString(animation));

Animation.toEvalFn = (node: MathNode, env: ExprEnv): EvalFn => {
   const body = isFunctionAssignmentNode(node)
      ? defaultCall(node)
      : getAssignmentBody(node);
   const mathEnv = { ...env.getMathEnv() };
   delete mathEnv['time'];
   const inlined = inline(body, mathEnv);
   console.log('inlined', inlined.toString());
   // eslint-disable-next-line @typescript-eslint/unbound-method
   const fn = inlined.compile().evaluate;
   const ret = () => {
      try {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
         const result = fn(env.getMathEnv());
         if (!isNumber(result)) {
            return 0;
         } else {
            return result;
         }
      } catch (e) {
         return 0;
      }
   };
   return ret;
};