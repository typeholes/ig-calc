import math, { isAssignmentNode, AssignmentNode, SymbolNode, MathNode, simplify as _simplify, parse } from "mathjs";
import { isString } from "../util";
import { Either, errorable } from "../Either";
import { getAssignmentBody } from "../expressions";

const rules = [..._simplify.rules, "sin(n1)/cos(n1) -> tan(n1)"];
export function simplify(expr: string | MathNode, exactFractions = true) {
  const node = isString(expr) ? parse(expr) : expr;
  const body = isAssignmentNode(node) ? getAssignmentBody(node) : node;
  const result = errorable(() => _simplify(body, rules, {}, { exactFractions  }));
  const simple = Either.on(result, {
    Left: () => node,
    Right: (value) => value,
  });

  if (isAssignmentNode(node)) {
    return new AssignmentNode(new SymbolNode(node.name), simple)
  }

  return simple;
}
