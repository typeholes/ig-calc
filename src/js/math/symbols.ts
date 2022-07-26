import { Map as IMap, Set as ISet } from "immutable";
import * as M from "mathjs";
import { parse as mathParse, isFunctionAssignmentNode } from "mathjs";

function splitToSet(s: string) {
  return ISet(s.split(/\s+/).filter((x) => !!x));
}

export const builtinConstants = IMap([
  ["e", Math.E],
  ["pi", Math.PI],
]);

// TODO: log arity 1 should be built in but arity 2 shadowed
// how to handle overloaded functions in general
export const overloadedFunction = `
log
log1p
`
  .split("\n")
  .filter((x) => !!x);

export const builtinFunctions = IMap([
  [
    "other",
    splitToSet(`
abs ceil fix floor gcd hypot invmod lcm log mod round sign 
bitAnd bitNot bitOr bitXor leftShift rightArithShift rightLogShift
bellNumbers catalan composition stirlingS2
combinations combinationsWithRep factorial gamma kldivergence
lgamma multinomial permutations erf
`),
  ],
  [
    "trig",
    splitToSet(` 
sin asin sinh asinh
cos acos cosh acosh
cot acot coth acoth
csc acsc csch acsch
sec sech
tan atan atan2 tanh atanh
`),
  ],
]);

function parseToEntry(s: string): [string, M.FunctionAssignmentNode] {
  console.log(s);
  const node = mathParse(s);
  if (!isFunctionAssignmentNode(node)) {
    throw new Error("invalid function for shadowed builtin:" + s);
  }
  return [node.name, node];
}

export const missingPlotFunctions = IMap(
  splitToSet(`
sec(x)=1/cos(x)
csc(x)=1/sin(x)
`).map(parseToEntry)
);

export const shadowedBuiltins = IMap(
  splitToSet(`
add(x,y)=x+y
cbrt(x)=x^(1/3)
cube(x)=x^3
divide(x,y)=x/y
exp(x)=e^x
expm1(x)=e^x-1
log10(x)=log(x)/log(10)
log1p(x)=log(x+1)
log2(x)=log(x)/log(2)
multiply(a,b)=a*b
nthRoot(b,p)=b^(1/p)
pow(b,p)=b^p
sqrt(x)=x^.5
square(x)=x^2
subtract(a,b)=a-b
unaryMinus(x)=-x
unaryPlus(x)=x
`).map(parseToEntry)
);

export const complexBuiltins = splitToSet(`
arg conj im re
`);

export const bannedBuiltins = splitToSet(`
dotDived dotMultiply dotPow norm nthRoots xgcd 
and not or xor apply column concat count cross
ctranspose det diag diff dot eitgs expm filter
flatten forEach getMatrixDataType identity inv
kron map matrixfromColumns matrixFromFunction
matrixFromRows ones partitionSelect pinv
range reshape resize rotate rotationMatrix row
size sort sqrtm squeeze transpose zeros pickRandom
random randomInt compare compareNatural compareText
equal equalText larger largerEq smaller smallerEq unequal
setCartesian setDifference setDistinct setIntersect setIsSubset
setMultiplicity setPowerset setSize setSymDifference setUnion
cumsum mad max mean median min mode prod quantileSeq std
sum variance bin format hex oct print to clone hasNumericValue
isInteger isNaN isNegative isNumberic isPositive isPrime isZero
numeric typeOf
`);

export const knownSymbols = builtinFunctions
  .valueSeq()
  .reduce((r: typeof v, v) => v.union(r), ISet(builtinConstants.keySeq()));
