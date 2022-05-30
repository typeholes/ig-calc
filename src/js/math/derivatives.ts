import * as M from "mathjs";
import { MathNode } from "mathjs";
import { transformNode, tx, always, C0, C1, C2, op, fn } from "./mathUtil";

const deriveTransforms = (by: string) => {
  const go = <T extends M.MathNode>(n: T) =>
    transformNode(n.clone(), deriveTransforms(by));
  const hasBy = <T extends M.MathNode>(n: M.MathNode) =>
    n.filter((x) => M.isSymbolNode(x) && x.name === by).length > 0;
  const goIf = <T extends M.MathNode>(b: boolean, n: T) => (b ? go(n) : n);

  return [
    tx(M.isConstantNode, always, () => C0),
    tx(M.isSymbolNode, always, (n) => (n.name === by ? C1 : C0)),
    tx(
      M.isParenthesisNode,
      always,
      (n) => new M.ParenthesisNode(go(n.content))
    ),
    tx(
      M.isOperatorNode,
      (n) => [n.isBinary() && (n.op === "+" || n.op === "-"), n.op],
      (n, opChar) => op(opChar === "+" ? "+" : "-", ...n.args.map((a) => go(a)))
    ),
    tx(
      // Product Rule, d/dx(f(x)*g(x)) = f'(x)*g(x) + f(x)*g'(x)
      M.isOperatorNode,
      (n) => n.isBinary() && n.op === "*",
      (n) => {
        const leftBy = hasBy(n.args[0]);
        const rightBy = hasBy(n.args[1]);

        if (!leftBy && !rightBy) {
          return C0;
        }

        if (leftBy && rightBy) {
          return op(
            "+",
            op("*", go(n.args[0]), n.args[1]),
            op("*", n.args[0], go(n.args[1]))
          );
        }

        return op("*", goIf(leftBy, n.args[0]), goIf(rightBy, n.args[1]));
      }
    ),
    tx(
      // Quotient rule, d/dx(f(x) / g(x)) = (f'(x)g(x) - f(x)g'(x)) / g(x)^2
      // would be nice to specialize for simpler rules like constants and recipricals
      M.isOperatorNode,
      (n) => n.isBinary() && n.op === "/",
      (n) => {
        const leftBy = hasBy(n.args[0]);
        const rightBy = hasBy(n.args[1]);

        if (!leftBy && !rightBy) {
          return C0;
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
          return op("/", go(n.args[0]), n.args[1]);
        } else {
          return op(
            "*",
            op("-", C0, n.args[0]),
            op("/", go(n.args[1]), op("^", n.args[1], C2))
          );
        }
      }
    ),
    tx(
      // Functional Power Rule, d/dx(f^g) = f^g*[f'*(g/f) + g'ln(f)]
      M.isOperatorNode,
      (n) => n.op === "^",
      (n) =>
        op(
          "*",
          op("^", n.args[0], n.args[1]),
          op(
            "+",
            op("*", go(n.args[0]), op("/", n.args[1], n.args[0])),
            op("*", go(n.args[1]), fn("log", n.args[0]))
          )
        )
    ),
    tx(
      // chain rule d/dx( f(g(x) )) = g'(x) * f'( g(x) )
      // need to check that this works for functions with arity > 1
      //    Seems sus
      M.isFunctionNode,
      always,
      (n) => op("*", go(n.args[0]), functionDerivatives[n.fn.name](...n.args))
    ),
  ];
}; // as NodeTransform<MathNode>[];

const functionDerivatives: Record<string, (...args: MathNode[]) => MathNode> = {
  sin: (n) => fn("cos", n),
  cos: (n) => op("-", C0, fn("sin", n)),
  tan: (n) => op("^", fn("sec", n), C2),
  sec: (n) => op("*", n, fn("tan", n)),
};

export function derive(
  node: M.MathNode,
  by = "x",
  simplify = true
): M.MathNode {
  const d = transformNode(node, deriveTransforms(by));
  return simplify ? M.simplify(d) : d;
}
