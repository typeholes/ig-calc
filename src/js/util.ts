import { isValidNumber } from "./function-plot/utils";
import { isNumber as _isNumber } from "mathjs";

export function removeValuefromArray<T>(arr: T[], value: T): void {
   const idx = arr.indexOf(value);
   if (idx === -1) {
      return;
   }
   arr.splice(idx, 1);
}

export function unique<T>(arr: T[]): T[] {
   const check = (value: T, index: number, self: T[]) =>
      self.indexOf(value) === index;
   return arr.filter(check);
}

export function formatNumber(n: number, pad = 8) {
   if (typeof n !== 'number') {
      return n;
   }
   const fixed = n > 1000 ? n.toExponential(2) : n.toFixed(2);
   const str = fixed.toString().replace('+', '');
   return str.padStart(pad, '\u2000');
   //   const pad = Math.max(10 - str.length,0)
   //   return fixed + '&nbsp'.repeat(pad);
}

export function callEach<F extends (...args: unknown[]) => void>(
   f1: F,
   ...fns: typeof f1[]
): (...args: [...Parameters<F>]) => void {
   return (...args) => {
      f1(...args);
      fns.forEach((fn) => fn(...args));
   };
}

type Transform<From, To> = (
   value: From,
   index: number,
   entries: [unknown, From][]
) => To;

type Choose<A, B> = A extends B ? A : B;

export const overObj =
   <From, To>(t: Transform<From, To>) =>
   <Input extends Record<string, From>>(obj: Input) =>
      Object.fromEntries(
         Object.entries(obj).map(([key, val], i, arr) => [key, t(val, i, arr)])
      ) as Choose<Input, Record<keyof Input, To>>;

export function objMap<ObjT extends Record<string, From>, From, To>(
   obj: ObjT,
   f: (value: From) => To
) {
   return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [key, f(val)])
   ) as Choose<ObjT, Record<keyof ObjT, To>>;
}

export function defined<T>(x: T | undefined | null): x is NonNullable<T> {
   return typeof x !== 'undefined' && x !== null;
}

export function defaulted<T>(x: T | undefined, dfault: T): T {
   return defined(x) ? x : dfault;
}

export function iskey<ObjectType extends Record<PropertyKey, unknown>>(
   property: PropertyKey,
   object: ObjectType
): property is keyof ObjectType {
   return Object.prototype.hasOwnProperty.call(object, property);
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

export function assert(p: boolean, msg: string): asserts p {
   if (!p) {
      // debugger;
      throw new Error(msg);
   }
}
assert.defined = <T>(x: T): asserts x is NonNullable<T> =>
   assert(defined(x), `undefined: $x`);
assert.props = <T extends string>(
   x: unknown,
   ...props: T[]
): asserts x is Record<T, unknown> => {
   assert(typeof x === 'object', 'crud');
   assert.defined(x);
   //  assert(Object.hasOwn(x, props[0]), "crud");
   assert(x.hasOwnProperty(props[0]), 'crud');
   //  return typeof x === "object" && defined(x) &&
};

assert.is = <T>(x: unknown, f: (x: unknown) => x is T, typeName?: string) : asserts x is T => {
   assert(f(x), `invalid type ${typeName??""}`);
};

assert.mayBe = <T>(x: unknown, f: (x: unknown) => x is T, typeName?: string) : asserts x is T | undefined => {
   assert(typeof x === 'undefined' || f(x), `invalid type ${typeName??""}`);
};

assert.propIs = <T extends string, U>(
   x: unknown,
   prop: T,
   is: (x: unknown) => x is U
): asserts x is Record<T, U> => {
   assert.props(x, prop);
   assert.is(x, is);
};

assert.propMayBe = <T extends string, U > (
   x: unknown,
   prop: T,
   is: (x: unknown) => x is U
): asserts x is Record<T, U | undefined> => {
   if (!hasProp(x,prop) || !defined(x[prop])) { return }
   assert.is(x[prop],is);
};



export function tagged<T extends string>(
   x: unknown,
   tag: T
): x is Record<'_tag', T> {
   return hasProp(x, '_tag') && x._tag === tag;
}

export function isBoolean(x: unknown): x is boolean {
   return typeof x === 'boolean';
}

export function isString(x: unknown): x is string {
   return typeof x === 'string';
}

export function notBlank(s: string | null | undefined): s is string {
   return defined(s) && defined(s.match(/\S/));
}

export function isNumber(x: unknown): x is number {
   return _isNumber(x) && isValidNumber(x)
}

export function mayBe<T>(x: unknown, is: (x: unknown) => x is T) : x is (undefined | T) {
   return typeof x === 'undefined' || is(x);
}

export type Expand<T> = T extends
   | string
   | number
   | boolean
   | bigint
   | null
   | void
   | symbol
   // eslint-disable-next-line @typescript-eslint/ban-types
   | Function
   | Date
   ? T
   : { [K in keyof T]: T[K] };

export function* mapIter<T,U>(iterable: IterableIterator<T>, callback: (t: T) => U) {
  for (const x of iterable) {
    yield callback(x);
  }
}
