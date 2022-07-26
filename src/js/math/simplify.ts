import { MathNode, simplify as _simplify, parse } from "mathjs";
import { isString } from "../util";
import { Either, errorable } from "../Either";

const rules = [..._simplify.rules, "sin(n1)/cos(n1) -> tan(n1)"];
export function simplify(expr: string | MathNode, exactFractions = true) {
  const node = isString(expr) ? parse(expr) : expr;
  const result = errorable(() => _simplify(node, rules, { exactFractions }));
  return Either.on(result, {
    Left: () => node,
    Right: (value) => value,
  });
}
