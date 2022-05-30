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

export function unInterval(i: Interval): [number, number] {
  return [i.lo, i.hi];
}

export function reverseInterval(i: Interval): Interval {
  return { lo: i.hi, hi: i.lo };
}

export function offsetInterval(i: Interval, by): Interval {
  return { lo: i.lo + by, hi: i.hi + by };
}
