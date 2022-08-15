export type Tree<T> = [T, Tree<T>[]];

export const Tree = <T>(t: T, fn: (t: T) => T[] = () => []): Tree<T> => {
  return [t, fn(t).map((u) => Tree(u, fn))];
};

Tree.toObject = <T, U extends Record<string, unknown>>(
  tree: Tree<T>,
  mapper: (t: T, idx?: number, parent?: T) => U,
    idx = 0,
  parent?: T
): U & { children: U[] } => {
  const [t, children] = tree;
  return {
    ...mapper(t, idx, parent),
    children: children.map((u, uidx) => Tree.toObject(u, mapper, uidx, t)),
  };
};
