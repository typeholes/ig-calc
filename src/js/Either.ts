import { defined, hasProp, tagged } from "./util";

export interface Left<L> {
  _tag: "Left";
  value: L;
}
export const Left = <L>(value: L): Left<L> => ({
  _tag: "Left",
  value,
});

export interface Right<R> {
  _tag: "Right";
  value: R;
}
export const Right = <R>(value: R): Right<R> => ({
  _tag: "Right",
  value,
});

export type Either<L, R> = Left<L> | Right<R>;

export const isLeft = (x: unknown): x is Left<unknown> =>
  tagged(x, "Left") && hasProp(x, "value");

export const isRight = (x: unknown): x is Right<unknown> =>
  tagged(x, "Right") && hasProp(x, "value");

export const isEither = (x: unknown): x is Either<unknown, unknown> =>
  isLeft(x) || isRight(x);

export type Errorable<R> = Either<Error, R>;

export function errorable<R>(f: () => R): Errorable<R> {
  try {
    return Right(f());
  } catch (e: unknown) {
    return e instanceof Error ? Left(e) : Left(new Error(String(e)));
  }
}

export function map<L, R, S>(x: Either<L, R>, f: (r: R) => S) {
  return isLeft(x) ? x : Right(f(x.value));
}
export function flatMap<L, R, S>(x: Either<L, R>, f: (r: R) => Either<L, S>) {
  return isLeft(x) ? x : f(x.value);
}

export function on<L, R, T>(
  x: Either<L, R>,
  go: { Left: (l: L) => T; Right: (r: R) => T }
) {
  return isLeft(x) ? go.Left(x.value) : go.Right(x.value);
}

export function raise<R>(e: Errorable<R>): Right<R> {
  if (isLeft(e)) {
    throw e.value;
  }
  return e;
}

export const Either = { on, map };

export const Errorable = {
  on,
  map,
  handle: <R>(
    e: Errorable<R>,
    onError: (e: Error) => void,
    defaultValue: R
  ) => {
    if (isLeft(e)) {
      onError(e.value);
      return defaultValue;
    }
    return e.value;
  },
  catch: (e: Errorable<unknown>, onError: (e: Error) => void) => {
    if (isLeft(e)) {
      onError(e.value);
    }
  },
  raise,
};
