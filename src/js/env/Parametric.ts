import { MathNode, parse as parseMathNode } from 'mathjs';
import { Point } from '../interval';
import { EvalFn } from './EnvType';
import { ExprEnv } from './exprEnv';

export interface Parametric {
  fnName: string;
  xName: string;
  yName: string;
}

export function Parametric(
  fnName: string,
  xName: string,
  yName: string
): Parametric {
  return { fnName, xName, yName };
}
Parametric.toExprString = ({ fnName, xName, yName }: Parametric): string =>
  `${fnName}(t) = [ ${xName}(t), ${yName}(t) ]`;

Parametric.toMathNode = (parametric: Parametric): MathNode =>
  parseMathNode(Parametric.toExprString(parametric));

Parametric.toTex = (parametric: Parametric): string =>
  Parametric.toMathNode(parametric).toTex();

const zero = () => 0;

const magnitude = (x: number | Point) =>
  Array.isArray(x) ? Math.sqrt(x[0] ** 2 + x[1] ** 2) : x;

Parametric.toEvalFn = (
  _name: string,
  expr: Parametric,
  exprEnv: ExprEnv
): EvalFn => {
  const fnX = exprEnv.getDatum(expr.xName)?.evalFn ?? zero;
  const fnY = exprEnv.getDatum(expr.yName)?.evalFn ?? zero;
  return (x) => [magnitude(fnX(x)), magnitude(fnY(x))];
};
