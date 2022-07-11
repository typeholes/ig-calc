import { MathNode } from "mathjs";
import { Errorable } from "../Either";
import { parseNode, getNodeName } from "../expressions";
import { EvalFn } from "../function-plot/FunctionPlotDatum";
import { defined } from "../util";
import { Set as ISet } from 'immutable';
import { getDependencies as getNodeDependencies } from "../math/mathUtil";

export interface EnvExprVar {
   name: string;
}

export interface EnvExpr {
   expr: string;
   vars: Map<string, EnvExprVar>;
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
      const vars = new Map(); //getDependencies(env, env.constant.toRecord(), { vars: ISet() }, 'all');
      return { expr, error, node, vars, name };
   } else {
      const name = defined(node) ? getNodeName(node) : `ERROR: ${expr}`;
      const vars = new Map();
      return { expr, error, node, vars, name };
   }
}

EnvExpr.toEvalFn = (expr: EnvExpr): EvalFn => {
   if (!defined(expr.node)) {
      return () => 0;
   }

   return () => 1;
};

EnvExpr.toExprString = (expr: EnvExpr): string =>
   defined(expr.error) ? expr.error.replaceAll(' ', '\\ ') : expr.expr;

EnvExpr.getDependencies = (expr: EnvExpr): ISet<string> => {
   if (defined(expr.node)) {
      return ISet(getNodeDependencies(expr.node));
   }

   return ISet();
};
