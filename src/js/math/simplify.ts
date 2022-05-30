import { Repeat } from "immutable";
import { MathNode, simplify as _simplify } from "mathjs";

const rules = [..._simplify.rules, "sin(n1)/cos(n1) -> tan(n1)", ];
export function simplify(n: MathNode) {
  return _simplify(n, rules);
}
