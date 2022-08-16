import { MathNode } from 'mathjs';
import { Errorable } from '../Either';
import { parseNode, getNodeName } from '../expressions';
import { EvalFn } from '../function-plot/FunctionPlotDatum';
import {
  defined,
  hasProp,
  hasPropIs,
  isBoolean,
  isString,
} from '../util';
import { Set as ISet } from 'immutable';
import {
  getDependencies,
  getDependencies as getNodeDependencies,
} from '../math/mathUtil';
import { ExprEnv, nodeToEvalFn, flattenDependencyTree } from './exprEnv';
import { addTexElement } from '../typeset';
import { simplify } from '../math/simplify';

export interface EnvExprVar {
  name: string;
}

export interface EnvExpr {
  expr: string;
  vars: string[];
  error: string | undefined;
  node: MathNode | undefined;
  simpleNode: MathNode | undefined;
  isSimplified: boolean;
  name: string;
}

export function isEnvExpr(x: unknown): x is EnvExpr {
  return (
    defined(x) &&
    hasPropIs(x, 'expr', isString) &&
    hasPropIs(x, 'name', isString) &&
    hasProp(x, 'error') &&
    hasProp(x, 'node') &&
    hasProp(x, 'simpleNode') &&
    hasPropIs(x, 'isSimplified', isBoolean)
  );
}

export function EnvExpr(expr: string, env: ExprEnv | undefined): EnvExpr {
  const parsed = parseNode(expr, env?.getMathEnv() || {});
  const { node, error } = Errorable.on<
    Error,
    MathNode,
    { node?: MathNode | undefined; error?: string | undefined }
  >(parsed, {
    Left: (err) => ({ error: err.message }),
    Right: (node) => ({ node }),
  });

  if (defined(node)) {
    const name = getNodeName(node);
    const simpleNode = simplify(node, true);
    const isSimplified = node.toString() === simpleNode.toString();
    const vars = getDependencies(node);
    const tex = node.toTex();
    addTexElement('tex_' + name, tex);
    return { expr, error, node, vars, name, simpleNode, isSimplified };
  } else {
    const name = defined(node) ? getNodeName(node) : `ERROR: ${expr}`;
    return {
      expr,
      error,
      node,
      vars: [],
      name,
      simpleNode: undefined,
      isSimplified: true,
    };
  }
}

EnvExpr.toEvalFn = (name: string, expr: EnvExpr, exprEnv: ExprEnv): EvalFn => {
  if (defined(expr.node)) {
    const vars = flattenDependencyTree(exprEnv.getDependencies(name));
    const free = vars.filter((x) => !x);
    const first = free.keySeq().first();
    return nodeToEvalFn(expr.node, exprEnv, first ?? '__unused');
  }

  return () => 0;
};

{
  const formatError = (expr: EnvExpr): string =>
    (expr.error ?? 'Error') + expr.expr;
  EnvExpr.toExprString = (expr: EnvExpr): string =>
    defined(expr.error)
      ? formatError(expr)
      : expr.node?.toString() ?? expr.expr;
}

{
  EnvExpr.toTex = (expr: EnvExpr): string => expr.node?.toTex() ?? expr.expr;
}

EnvExpr.getDependencies = (expr: EnvExpr): ISet<string> => {
  if (defined(expr.node)) {
    return ISet(getNodeDependencies(expr.node));
  }

  return ISet();
};
