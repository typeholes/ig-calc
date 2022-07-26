import { offsetInterval } from "./function-plot/sampler";
import { Interval, unInterval } from "./function-plot/types";

export function Rect(x: Interval, y: Interval) {
  return {
    left: () => x.lo,
    right: () => x.hi,
    top: () => y.lo,
    bottom: () => y.hi,
    x: () => x,
    xA: () => unInterval(x),
    y: () => y,
    yA: () => unInterval(y),
    width: () => x.hi - x.lo,
    height: () => y.hi - y.lo,
    translate: (dx: number, dy: number) =>
      Rect(offsetInterval(x, dx), offsetInterval(y, dy)),
    margined: (margin: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }) =>
      Rect(
        Interval(x.lo + margin.left, x.hi - margin.right),
        Interval(y.lo + margin.top, y.hi - margin.bottom)
      ),
  };
}

export type Rect = ReturnType<typeof Rect>;
