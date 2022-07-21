import { MathNode, parse as parseMathNode } from 'mathjs';

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

Animation.toTex = (animation: Animation): string =>
   Animation.toMathNode(animation).toTex();
