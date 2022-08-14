import { MathNode } from 'mathjs';
import { Errorable } from '../Either';
import { parseNode, getNodeName } from '../expressions';
import { EvalFn } from '../function-plot/FunctionPlotDatum';
import { defined } from '../util';
import { Set as ISet } from 'immutable';
import { getDependencies, getDependencies as getNodeDependencies } from '../math/mathUtil';
import { ExprEnv, nodeToEvalFn, flattenDependencyTree } from './exprEnv';

export interface EnvExprVar {
   name: string;
}

export interface EnvExpr {
   expr: string;
   vars: string[];
   error: string | undefined;
   node: MathNode | undefined;
   name: string;
}

export function EnvExpr(expr: string): EnvExpr {
   const parsed = parseNode(expr);
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
      const vars = getDependencies(node);
      return { expr, error, node, vars, name };
   } else {
      const name = defined(node) ? getNodeName(node) : `ERROR: ${expr}`;
      return { expr, error, node, vars: [], name };
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
   EnvExpr.toTex = (expr: EnvExpr): string =>
          expr.node?.toTex() ?? expr.expr
}

EnvExpr.getDependencies = (expr: EnvExpr): ISet<string> => {
   if (defined(expr.node)) {
      return ISet(getNodeDependencies(expr.node));
   }

   return ISet();
};
