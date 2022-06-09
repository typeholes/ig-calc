import { interval } from "d3";
import { MathNode } from "mathjs";

export type Point = [x: number, y: number];
export type Points = Point[];

export interface Interval {
  lo: number;
  hi: number;
}

// should use a tuple arg here but too many things return arrays instead of tuples
export function Interval(...args: number[]) {
  return { lo: args[0], hi: args[1] };
}

Interval.span = (i: Interval) => i.hi - i.lo;

// should use a tuple arg here but too many things return arrays instead of tuples
Interval.update = (i: Interval, vals: number[]): Interval => {
  [i.lo, i.hi] = vals;
  return i;
};

Interval.clampNumber = (i: Interval, n: number) =>
  Math.max(i.lo, Math.min(n, i.hi));

Interval.midpoint = (i: Interval): number => i.lo + (i.hi - i.lo) / 2;

export function unInterval(i: Interval): [number, number] {
  return [i.lo, i.hi];
}

export function reverseInterval(i: Interval): Interval {
  return { lo: i.hi, hi: i.lo };
}

export function offsetInterval(i: Interval, by): Interval {
  return { lo: i.lo + by, hi: i.hi + by };
}

  





