import * as M from "mathjs";
import { hasProp } from "../util";
import { transformNode, tx, always, C0, C1, C2, op, fn } from "./mathUtil";
import { simplify as _simplify} from "./simplify";

const integrateTransforms = (by: string) => {
  const go = <T extends M.MathNode>(n: T) =>
    transformNode(n.clone(), integrateTransforms(by));
  const hasBy = <T extends M.MathNode>(n: M.MathNode) =>
    n.filter((x) => M.isSymbolNode(x) && x.name === by).length > 0;
  const goIf = <T extends M.MathNode>(b: boolean, n: T) => (b ? go(n) : n);
  const byNode = new M.SymbolNode(by);

  return [
    tx(M.isConstantNode, always, (n) => op("*", n, byNode)),
    tx(M.isSymbolNode, always, (n) =>
      n.name === by ? op("/", op("^", n, C2), C2) : op("*", n, byNode)
    ),
    tx(M.isParenthesisNode, always, (n) => new M.ParenthesisNode(go(n))),
    tx(
      M.isOperatorNode,
      (n) => n.isBinary() && (n.op === "+" || n.op === "-"),
      (n) => op("+", ...n.args.map((a) => go(a)))
    ),
    tx(
      M.isOperatorNode,
      (n) => n.isBinary() && n.op === "*",
      (n) => {
        const leftBy = hasBy(n.args[0]);
        const rightBy = hasBy(n.args[1]);

        if (!leftBy && !rightBy) {
          return op("*", n, byNode);
        }

        if (leftBy && rightBy) {
          return op("+", n.args[1], op("*", n.args[0], go(n.args[1])));
        }

        return op("*", goIf(leftBy, n.args[0]), goIf(rightBy, n.args[1]));
      }
    ),
    tx(
      // TODO
      M.isOperatorNode,
      (n) => n.isBinary() && n.op === "/",
      (n) => {
        const leftBy = hasBy(n.args[0]);
        const rightBy = hasBy(n.args[1]);

        if (!leftBy && !rightBy) {
          return op("*", n, byNode);
        }

        if (leftBy && rightBy) {
          return op(
            "/",
            op(
              "-",
              op("*", go(n.args[0]), n.args[1]),
              op("*", n.args[0], go(n.args[1]))
            ),
            op("^", n.args[1].clone(), new M.ConstantNode(2))
          );
        }

        if (leftBy) {
          return op("/", n.args[0], go(n.args[1]));
        } else {
          return op("*", n.args[0], fn("log", n.args[1]));
        }
      }
    ),
    tx(
      M.isOperatorNode,
      (n) => n.op === "^",
      (n) => {
        const leftBy = hasBy(n.args[0]);
        const rightBy = hasBy(n.args[1]);

        if (!leftBy && !rightBy) {
          return op("*", n, byNode);
        }

        if (leftBy && rightBy) {
          throw "terms of the form x^x cannot be integrated";
        }

        if (leftBy) {
          return op(
            "/",
            op("^", byNode, op("+", n.args[1], C1)),
            op("+", n.args[1], C1)
          );
        } else {
          return op("/", n, fn("log", n.args[0]));
        }
      }
    ),
    tx(
      // No chain rule :(
      // TODO
      M.isFunctionNode,
      (n) => hasProp(functionIntegrals, n.fn.name),
      (n) => functionIntegrals[n.fn.name](...n.args)
    ),
  ];
}; // as NodeTransform<MathNode>[];

const functionIntegrals = {
  sin: (n) => fn("cos", n),
  cos: (n) => op("-", C0, fn("sin", n)),
  tan: (n) => op("^", fn("sec", n), C2),
  sec: (n) => op("*", n, fn("tan", n)),
};

export function integrate(
  node: M.MathNode,
  by = "x",
  simplify = true
): M.MathNode {
  const d = transformNode(node, integrateTransforms(by));
  return simplify ? _simplify(d) : d;
}
