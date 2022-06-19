import {
  isAssignmentNode,
  isFunctionAssignmentNode,
  isString,
  MathNode,
  SymbolNode,
} from "mathjs";
import * as M from "mathjs";
import {
  parse,
  getDependencies as getVars,
  inline,
  freeVars as getFreeVars,
} from "../js/math/mathUtil";

import {
  builtinConstants,
  builtinFunctions,
  missingPlotFunctions,
} from "../js/math/symbols";

import { Set as ISet } from "immutable";
import { Map as IMap } from "immutable";

import { defined, hasPropIs, isBoolean } from "../js/util";
import {
  errorable,
  Errorable,
  flatMap,
  isLeft,
  map,
  raise,
} from "../js/Either";
import { graph } from "./uiUtil";
import { Datum } from "../js/function-plot/FunctionPlotDatum";
import { reactive } from "vue";

export type ExprEnv = IMap<string, ValidExpr>;
export const emptyEnv: ExprEnv = IMap();

export const SaveRep = {
  toSave,
  fromSave,
  saveKey: "ExprEnvSaveRep" as const,
};

export function parseExpr(
  env: ExprEnv,
  s: string,
  forceName?: string | undefined
): Errorable<[ExprEnv, string]> {
  const result = parse(s);

  return flatMap(result, (node) =>
    errorable(() => {
      const name = forceName ?? getNodeName(node);

      if (!defined(forceName) && env.has(name)) {
        throw new Error(name + " already defined");
      }

      return [env.set(name, validExpr(name, node, ISet(getVars(node)))), name];
    })
  );
}

export interface ValidExpr {
  name: string;
  node: MathNode;
  vars: ISet<string>;
}

let anonCnt = 0;

export const validExpr = (
  name: string,
  node: MathNode,
  vars: ISet<string>
): ValidExpr => ({ name, node, vars });

const xSymbolNode = new SymbolNode("x");

export function isGraphable(env: ExprEnv, expr: ValidExpr) {
  return defined(getGraphFn(env, expr));
}

export function getFunctionBody(node: MathNode) {
  return isFunctionAssignmentNode(node) ? node.expr : node;
}

export function getBody(node: MathNode) {
  return isAssignmentNode(node) ? node.value : node;
}

export function envToMathEnv(
  env: ExprEnv,
  includeConstants = false
): Record<string, number | MathNode> {
  const constants = includeConstants ? builtinConstants.toObject() : {};
  const mathEnv : Record<string, MathNode | number > = env.map((x) => getBody(x.node)).toObject();
  return reactive({ ...mathEnv, ...constants });
}
export function getGraphFnStr(
  env: ExprEnv,
  expr: ValidExpr,
  subConstants = false
): string | undefined {
  return getGraphFn(env, expr, subConstants)?.toString();
}

export function getGraphFn(
  env: ExprEnv,
  expr: ValidExpr | undefined,
  subConstants = false
): MathNode | undefined {
  if (!defined(expr)) {
    return undefined;
  }
  // TODO return something other than undefined when not graphable?
  const node = getBody(expr.node);
  const mathEnv = envToMathEnv(env, subConstants);
  const inlined = inline(node, mathEnv);
  const freeVars = ISet(getFreeVars(mathEnv, inlined));

  if (freeVars.size === 0) {
    return inlined;
  }
  if (freeVars.size > 1) {
    return undefined;
  }

  const free = freeVars.first()!;

  const graphNode = inline(inlined, {
    [free]: xSymbolNode,
    ...missingPlotFunctions.toObject(),
  });
  return getFunctionBody(graphNode);
}

export function getDependencies(
  env = emptyEnv,
  expr: ValidExpr,
  bound: "bound" | "free" | "all" = "all"
) {
  const deps = transativeDependencies(env, expr.vars);
  if (bound === "all") {
    return deps;
  }

  return deps.filter((dep) => (bound === "bound") === env.has(dep));
}

function transativeDependencies(
  env: ExprEnv,
  deps: ISet<string>,
  ancestors: ISet<string> = ISet()
): ISet<string> {
  if (deps.some((dep) => ancestors.has(dep))) {
    throw new Error("Cyclic dependency: " + deps.join(", "));
  }

  const newAncestors = deps.union(ancestors);
  return newAncestors.union(
    deps.flatMap((dep) => {
      const children = env[dep]?.vars;
      if (!children) {
        return ISet();
      }
      return transativeDependencies(children, newAncestors);
    })
  );
}

// Broken
/*
export function updateExpr(key: string, value: string): ExprError | 'valid' {
   const expr = parseExpr(value);
   if (expr.name === '#error') {
      return expr as ExprError;
   }
   if (typeof key === 'number') {
      delete expressions.anonymous[key];
   } else {
      delete expressions.named[key];
   }

   return addExpr(expr);
}
*/

export const getNodeName = (node: MathNode) =>
  isAssignmentNode(node) || isFunctionAssignmentNode(node)
    ? node.name
    : "anon: " + node.toString();

function getDefinition(env: ExprEnv, name: string) {
  if (!env.has(name)) {
    return false;
  }

  const node = env.get(name)?.node!;
  if (M.isAssignmentNode(node)) {
    return node.value;
  }

  return false;
}

export type SaveRep = Record<
  string,
  { expr: string; color: string; show: boolean }
>;

export function toSaveRep(env: ExprEnv): SaveRep {
  const saveRep = env.map((v, k) => ({
    expr: v.node.toString(),
    color: graph.options.data[k].color,
    show: graph.options.data[k].show,
  }));
  return saveRep.toObject();
}

function toSave(rep: SaveRep): string {
  return JSON.stringify(rep);
}

function fromSave(s: string): Errorable<SaveRep> {
  return errorable(() => {
    const entries = Object.entries(JSON.parse(s));
    const saveRep: SaveRep = {};

    entries.forEach(([k, v]) => {
      if (!hasPropIs(v, "expr", isString)) {
        throw new Error("Save entry: " + k + ' missing "expr"');
      }
      const expr = v.expr;
      const color = hasPropIs(v, "color", isString) ? v.color : "#ff0000";
      const show = hasPropIs(v, "show", isBoolean) ? v.show : false;
      saveRep[k] = { expr, color, show };
    });

    return saveRep;
  });
}

export const ValidExpr = {
  toDatum: (
    expr: ValidExpr,
    env: ExprEnv,
    show: boolean,
    color = "#FFFFFF"
  ) => {
    const body = getBody(expr.node);
    const inlined = inline(body, envToMathEnv(env));
    const firstFree = getDependencies(env, expr, "free").first("x");
    const evalFn = (x: number) =>
      inlined.compile().evaluate({ [firstFree]: x });
    return Datum(evalFn, { show, color });
  },
};
