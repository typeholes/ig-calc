import utils from './utils';

import { MathNode } from 'mathjs';
import { Interval, Point, Points } from './types';
import { defined } from '../util';

function checkAsymptote(
   d0: Point,
   d1: Point,
   getY: (x: number) => number,
   sign: number,
   level: number
): {
   asymptote: boolean;
   d0: Point;
   d1: Point;
} {
   if (!level) {
      //    console.log("asymptote", d0, d1);
      return {
         asymptote: true,
         d0: d0,
         d1: d1,
      };
   }
   const n = 10;
   const x0 = d0[0];
   const x1 = d1[0];
   const samples = utils.linspace(x0, x1, n);
   let oldY, oldX;
   for (let i = 0; i < n; i += 1) {
      const x = samples[i];
      const y = getY(x);

      if (i && oldY) {
         const deltaY = y - oldY;
         const newSign = Math.sign(deltaY);
         if (newSign === sign) {
            return checkAsymptote([oldX, oldY], [x, y], getY, sign, level - 1);
         }
      }
      oldY = y;
      oldX = x;
   }
   return {
      asymptote: false,
      d0: d0,
      d1: d1,
   };
}

/**
 * Splits the evaluated data into arrays, each array is separated by any asymptote found
 * through the process of detecting slope/sign brusque changes
 * @param chart
 * @param d
 * @param data
 * @returns {Array[]}
 */
export function split(
   domain: Interval,
   getY: (x: number) => number,
   data: Points
): Points[] {
   let i: number,
      oldSign: number | undefined = undefined;
   let deltaX = 0;
   let st: Points = [];
   const sets: Points[] = [];
   const yMin = domain.lo;
   const yMax = domain.hi;

   //  console.log("split domain", domain);

   if (data[0]) {
      st.push(data[0]);
      deltaX = data[1][0] - data[0][0];
      oldSign = Math.sign(data[1][1] - data[0][1]);
   }

   function updateY(d: Point) {
      d[1] = Math.min(d[1], yMax);
      d[1] = Math.max(d[1], yMin);
      return d;
   }

   i = 1;
   while (i < data.length) {
      const y0 = data[i - 1][1];
      const y1 = data[i][1];
      const deltaY = y1 - y0;
      const newSign = Math.sign(deltaY);
      // make a new set if:
      if (
         // utils.sgn(y1) * utils.sgn(y0) < 0 && // there's a change in the evaluated values sign
         // there's a change in the slope sign
         defined(oldSign) &&
         oldSign !== newSign &&
         // the slope is bigger to some value (according to the current zoom scale)
         Math.abs(deltaY / deltaX) > 1 / 1
      ) {
         // retest this section again and determine if it's an asymptote
         const check = checkAsymptote(data[i - 1], data[i], getY, newSign, 3);
         if (check.asymptote) {
            st.push(updateY(check.d0));
            sets.push(st);
            st = [updateY(check.d1)];
         }
      }
      oldSign = newSign;
      st.push(data[i]);
      ++i;
   }

   if (st.length) {
      sets.push(st);
   }

   return sets;
}

export function evalFn(
   fn: MathNode,
   scope: Record<string, number | MathNode>,
   scope2: Record<string, number | MathNode>
): number {
   const result: unknown = fn
      .compile()
      .evaluate({ ...scope, ...(scope2 || {}) });
   if (typeof result === 'number') {
      return result;
   }
   throw new Error('result is not a number: ' + result);
}

export function scaleInterval(interval: Interval, by: number): Interval {
   const diff = (interval.hi - interval.lo) * by;
   return { lo: interval.lo - diff, hi: interval.hi + diff };
}

export function offsetInterval(interval: Interval, by: number): Interval {
   return { lo: interval.lo + by, hi: interval.hi + by };
}
