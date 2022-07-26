import { DatumOptions } from './FunctionPlotDatum';
import { Globals } from './globals';

import { Interval, Point } from './types';

export default { clamp, linspace, logspace, isValidNumber, space, color };

export function clamp(n: number, interval: Interval): number {
   return Math.min(interval.hi, Math.max(interval.lo, n));
}

export function linspace(lo: number, hi: number, n: number): number[] {
   const step = (hi - lo) / (n - 1);
   return Array.from({ length: n }, (val, i) => lo + step * i);
}

export function logspace(lo: number, hi: number, n: number): number[] {
   return linspace(lo, hi, n).map((x: number) => Math.pow(10, x));
}

export function isValidNumber(v: number) {
   return typeof v === 'number' && defined(v) && !isNaN(v);
}

export function isValidPoint(p: Point) {
   return isValidNumber(p[0]) && isValidNumber(p[1]);
}

export function onNan(n: number, m: number) {
   return isValidNumber(n) ? n : m;
}

export function space(
   xAxisType: 'linear' | 'log',
   range: Interval,
   n: number
): number[] {
   const lo = range.lo;
   const hi = range.hi;
   if (xAxisType === 'log') {
      return logspace(Math.log10(lo), Math.log10(hi), n);
   }
   // default is linear
   return linspace(lo, hi, n);
}

/*
  export function getterSetter(config: any, option: string) {
    const me = this
    this[option] = function (value: any) {
      if (!arguments.length) {
        return config[option]
      }
      config[option] = value
      return me
    }
  }
  */

export function color(data: DatumOptions, index: number): string {
   return data.color || Globals.COLORS[index].hex();
}

export function defined<T>(x: T | undefined | null): x is T {
   return typeof x !== 'undefined' && x !== null;
}

export function defaulted<T>(x: T | undefined, dfault: T): T {
   return defined(x) ? x : dfault;
}

export function notBlank(s: string | null | undefined): s is string {
   return defined(s) && !s.match(/^\s*$/);
}

export function hasProp<T extends string>(
   x: unknown,
   prop: T
): x is Record<T, unknown> {
   return typeof x === 'object' && defined(x) && x.hasOwnProperty(prop); // Object.hasOwn(x, prop);
}

export function hasPropIs<T extends string, U>(
   x: unknown,
   prop: T,
   is: (x: unknown) => x is U
): x is Record<T, U> {
   return hasProp(x, prop) && is(x[prop]);
}

export function pointToString(p: Point) {
   const r = p.map(Math.round);
   return `(${r[0]},${r[1]})`;
}

export function arrayRange(from: number, to: number): number[] {
   return [...Array(to - from + 1).keys()].map((n) => n + from);
}
