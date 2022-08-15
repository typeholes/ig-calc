import * as M from 'mathjs';

import { unique, defined, hasProp, tuple } from '../util';
import {
  ConstantNode,
  FunctionAssignmentNode,
  FunctionNode,
  isAssignmentNode,
  isConstantNode,
  isFunctionAssignmentNode,
  isFunctionNode,
  isOperatorNode,
  isParenthesisNode,
  isSymbolNode,
  MathNode,
} from 'mathjs';
import { Either, errorable } from '../Either';

import { knownSymbols } from './symbols';
import { simplify } from './simplify';
import { Tree } from './RosetTree';

export { getDerivative, getDependencies };

export function parse(s: string): Either<Error, MathNode> {
  return errorable(() => {
    const parsed = M.parse(s);
    if (M.isAssignmentNode(parsed)) {
      return parsed;
    } else if (M.isFunctionAssignmentNode(parsed)) {
      return parsed;
    }
    return simplify(parsed);
  });
}

//simplify.rules.push({ l: 'n1*n2/(n1*n3)', r: 'n2/n3' });
//
function getDerivative(
  node: M.MathNode,
  by: string,
  args: Record<string, MathNode> = {}
): M.MathNode {
  const expanded: M.MathNode = inline(node, args);
  const derived = M.derivative(expanded, by);
  return derived;
}

export function freeVars(
  env: Record<string, MathNode | number>,
  node: MathNode
) {
  const free = node.filter(
    (x) => isSymbolNode(x) && !hasProp(env, x.name) && !knownSymbols.has(x.name)
  ) as M.SymbolNode[];
  return free.map((x) => x.name);
}

export function inline(
  node: MathNode,
  env: Record<string, MathNode | number>,
  depth = 0,
  maxDepth = 100
): MathNode {
  //   console.log({ depth: depth, node: node.toString() })
  if (depth > maxDepth) {
    return node;
  }

  if (isFunctionNode(node)) {
    const name = node.fn.name;
    const to = env[name];
    if (isFunctionAssignmentNode(to)) {
      const subbed = subs(to, node);
      // console.log({
      //   to: to.toString(),
      //   n: n.toString(),
      //   subbed: subbed.toString(),
      // })
      return inline(subbed, env, depth + 1);
    }
  }
  return node.transform((n: MathNode) => {
    if (isFunctionNode(n)) {
      const name = n.fn.name;
      const to = env[name];
      if (isFunctionAssignmentNode(to)) {
        const subbed = subs(to, n);
        // console.log({
        //   to: to.toString(),
        //   n: n.toString(),
        //   subbed: subbed.toString(),
        // })
        return inline(subbed, env, depth + 1);
      }
    }
    if (isSymbolNode(n)) {
      const name = n.name;
      const value = env[name];
      const to =
        defined(value) && typeof value === 'number'
          ? new M.ConstantNode(value)
          : value;
      if (defined(to)) {
        const subbed = n.transform((s) =>
          isSymbolNode(s) && s.name === name ? to : s
        );
        // console.log({
        //   to: to.toString(),
        //   n: n.toString(),
        //   subbed: subbed.toString(),
        // })
        return inline(subbed, env, depth + 1);
      }
    }
    return n;
  });
}

function getDependencies(expr: string | M.MathNode, args = {}): string[] {
  const node = typeof expr === 'string' ? M.parse(expr) : expr;

  const expanded = inline(node, args);

  const body: M.MathNode = M.isAssignmentNode(expanded)
    ? expanded.value
    : expanded;

  const params = M.isFunctionAssignmentNode(expanded) ? expanded.params : [];

  const filtered = body.filter(
    (node) =>
      M.isSymbolNode(node) &&
      !knownSymbols.has(node.name) &&
      !params.includes(node.name)
  ) as M.SymbolNode[];

  const dependencies = unique(filtered.map((x) => x.name ?? ''));

  return dependencies;
}

export function subs(
  def: FunctionAssignmentNode,
  call: FunctionNode
): MathNode {
  const ret = call.transform((n) => {
    if (isFunctionNode(n)) {
      if (n.fn.name === def.name || def.name === '#dummy#') {
        const env = Object.fromEntries(
          def.params.map((p, i) => [p, n.args[i] ?? new ConstantNode(0)])
        );
        const ret = def.expr.transform((s: MathNode) =>
          isSymbolNode(s) && s.name in env ? env[s.name] : s
        );
        return ret;
      }
      return n;
    } else {
      return n;
    }
  });

  return ret;
  //return new M.ParenthesisNode(ret);
}

export type NodeTransform<T, U> = {
  is: (node: unknown) => node is T;
  when: (node: T) => boolean | [boolean, U];
  then: <T extends MathNode>(node: T, u?: U) => MathNode;
};

export function transformNode<U>(
  node: MathNode,
  transforms: NodeTransform<MathNode, U>[]
): MathNode {
  return node.transform((n: MathNode) => {
    for (const t of transforms) {
      if (t.is(n)) {
        const check = t.when(n);
        const matched = typeof check === 'boolean' ? check : check[0];
        const val = typeof check === 'boolean' ? undefined : check[1];

        if (matched) {
          return t.then(n, val);
        }
      }
    }
    return n;
  });
}

export function tx<T extends MathNode, U>(
  is: (n: unknown) => n is T,
  when: (n: T) => boolean | [boolean, U],
  then: (n: T, u: U) => MathNode
) {
  return { is, when, then };
}
export const always = () => true;

export const [C0, C1, C2] = [0, 1, 2].map((x) => new ConstantNode(x));

export function fn(name: string, ...args: MathNode[]) {
  return new M.FunctionNode(
    name,
    args.map((x) => x.clone())
  );
}

export const opMap = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'pow',
} as const;
export function op(
  op: '+' | '-' | '*' | '/' | '^',
  ...[left, right]: MathNode[]
) {
  const name = opMap[op];
  return new M.OperatorNode(op, name, [left, right]);
}

const jsConstants: Record<string, string> = {
  e: 'Math.E',
  pi: 'Math.PI',
};

export function getJavaScript(node: MathNode): string {
  if (isConstantNode(node)) {
    return node.toString();
  }
  if (isSymbolNode(node)) {
    return jsConstants[node.name] ?? node.toString();
  }
  if (isParenthesisNode(node)) {
    return `${getJavaScript(node.content)})`;
  }
  if (isOperatorNode(node)) {
    const op = node.op === '^' ? '**' : node.op;
    const result = node.args.map(getJavaScript).join(` ${op} `);
    return `(${result})`;
  }
  if (isAssignmentNode(node)) {
    const result = 'const ' + node.name + ' = ' + getJavaScript(node.value);
    return result;
  }
  if (isFunctionAssignmentNode(node)) {
    const result =
      'const ' +
      node.name +
      ' = (' +
      node.params.join(', ') +
      ') => (' +
      getJavaScript(node.expr);
    return result;
  }
  if (isFunctionNode(node)) {
    const name = node.fn.toString();
    const jsName = M[name] instanceof Function ? 'Math.' + name : name;
    const result = jsName + '(' + node.args.map(getJavaScript).join(', ') + ')';
    return result;
  }
  throw new Error('node type not implemented: ' + node.type);
}

function getChildren(n: MathNode): MathNode[] {
  const children: MathNode[] = [];
  n.forEach((c) => children.push(c));
  return children;
}

export function nodeToTree(n: MathNode): Tree<MathNode> {
  return Tree(n, getChildren);
}

export type MathNodeObject = { mathNode: MathNode, id: number, type: MathNode['type'], label: string, children?: MathNodeObject[], parent: MathNode | undefined, childIdx: number | undefined };

let nodeObjectCnt = 0;
export function nodeToObject(n: MathNode, childIdx: number | undefined, parent: MathNode | undefined): MathNodeObject {
  return { mathNode: n, id: nodeObjectCnt++, type: n.type, label: nodeToLabel(n), parent, childIdx };
}

export function nodeToObjectTree(n: MathNode): MathNodeObject {
   nodeObjectCnt = 0;
  return Tree.toObject(nodeToTree(n), nodeToObject);
}

type LabelExtractor<T> = [ <T>(x: unknown) => x is T, (t: T) => string];
// type LabelExtractors<U extends MathNode> = LabelExtractor<U>[];
function lx<T>( is: (x: unknown) => x is T, to: (t: T) => string) : LabelExtractor<T> { return tuple(is,to) as LabelExtractor<T>; }
const labelExtractors = [
  lx(M.isArrayNode, ()=>'array'),
  lx(M.isAssignmentNode, (n) => n.name),
  lx(M.isSymbolNode, (n) => n.name),
  lx(M.isFunctionNode, () => 'function call'),
  lx(M.isOperatorNode, (n) => n.op),
  lx(M.isConstantNode, (n) => n.value),
];

function nodeToLabel(n: MathNode) : string{
  for ( const [is, to] of labelExtractors) {
    if (is(n)) { return to(n as never) }
  }

  return 'Unknown type: ' + n.type;

}
