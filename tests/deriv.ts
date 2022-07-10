import * as assert from "assert";
import { derive } from "../src/js/math/derivatives";
import { parse, derivative as Mderivative,  } from "mathjs";

export {};

function dx(fn: string, to: string) {
  return it("dx " + fn, () => assert.equal(derive(parse(fn)).toString(), to));
}

describe("derive", function () {
  dx("1", "0");
  dx("x", "1");
  dx("x", "1");
  dx("x y", "y");
  dx("y x", "y");
  dx("2 x", "2");
  dx("a x * b x", "2 * a * b * x");
  dx("x^2", "2 * x");
  dx("sin(x)", "cos(x)");
  dx("cos(x)", "-sin(x)");
  dx("sin(sin(x))", "cos(x) * cos(sin(x))");
  dx("x/y", "1 / y");
  dx("y/x", "-(y / x ^ 2)");
  dx("sin(x)/x", "(cos(x) - sin(x) / x) / x");
  dx("x/sin(x)", Mderivative("x/sin(x)", "x").toString());
});
