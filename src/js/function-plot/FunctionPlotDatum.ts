import { MathNode } from "mathjs";
import { evalFn, scaleInterval, split } from "./sampler";
import { Interval, Point, Points } from "./types";
import utils, { pointToString } from "./utils";

export type EvalFn = (x: number) => number;
export type Datum = { evalFn: EvalFn } & DatumOptions;
export function Datum(
  evalFn: EvalFn,
  options: Partial<DatumOptions>
): FunctionPlotDatum {
  return {
    evalFn,
    sample: linearSampler(evalFn),
    xAxisType: options.xAxisType ?? "linear",
    nSamples: options.nSamples ?? 100,
    closed: options.closed ?? false,
    color: options.color ?? "#ffff00",
    skipTip: options.skipTip ?? false,
    show: options.show ?? false,
  };
}

export type Sampler = (
  xDomain: Interval,
  yRange: Interval,
  xAxisType: "linear" | "log",
  nSamples: number
) => Points[];
function linearSampler(evalFn: EvalFn): Sampler {
  return (
    xDomain: Interval,
    yRange: Interval,
    xAxisType: "linear" | "log",
    nSamples: number
  ) => {
    const yBounds = scaleInterval(yRange, 1e5); // TODO: why are we clamping?
    const xs = utils
      .space(xAxisType, xDomain, nSamples)
      .filter(utils.isValidNumber);
    const points: Points = xs.map((x) => [x, utils.clamp(evalFn(x), yBounds)]);
    //const points: Points = xs.map((x) => [x, getY(x)]);
    const splitPoints = split(yBounds, evalFn, points);
    const edges = splitPoints.map((a) =>
      [a[0], a[1], ...a.slice(-2)].map(pointToString).join(" ")
    );

    return splitPoints;
  };
}

export function PolorDatum(
  fn: MathNode,
  freeVariable: string,
  xAxisType: "linear" | "log" = "linear",
  range: Interval, // TODO default -pi,pi
  nSamples: number,
  scope: Record<string, number>,
  options: DatumOptions
) {
  // TODO: no asymptote checks for polar?
  return {
    ...options,
    getPoints: () => {
      const getR = (theta: number) =>
        evalFn(fn, { [freeVariable]: theta }, scope);
      const thetas = utils
        .space(xAxisType, range, nSamples)
        .filter(utils.isValidNumber);
      const points: Points = thetas.map((theta) => {
        const r = getR(theta);
        return [r * Math.cos(theta), r * Math.sin(theta)];
      });
      return [points];
    },
  };
}

export function ParametricDatum(
  fnX: MathNode,
  fnY: MathNode,
  freeVariableX: string,
  freeVariableY: string,
  xAxisType: "linear" | "log" = "linear",
  range: Interval, // TODO default 0,2pi
  nSamples: number,
  scope: Record<string, number>,
  options: DatumOptions
) {
  // TODO: no asymptote checks for Parametric?
  return {
    ...options,
    getPoints: () => {
      const getX = (t: number) => evalFn(fnX, { [freeVariableX]: t }, scope);
      const getY = (t: number) => evalFn(fnY, { [freeVariableY]: t }, scope);
      const ts = utils
        .space(xAxisType, range, nSamples)
        .filter(utils.isValidNumber);
      const points: Points = ts.map((t) => [getX(t), getY(t)]);
      return [points];
    },
  };
}

export function VectorDatum(vector: [Point, Point], options: DatumOptions) {
  return PointsDatum(vector, options);
}

export function PointsDatum(points: Points, options: DatumOptions) {
  return {
    ...options,
    getPoints: () => [points],
  };
}

export interface DatumOptions {
  /**
   * The type of graph to render
   *
   * - polyline: uses the builtIn sampler to render a disjoint set of lines
   * - scatter: dotted line
   */
  graphType?: "polyline" | "scatter";

  /**
   * True to close the path,
   * for any segment of the closed area graph `y0` will be 0 and `y1` will be `f(x)`
   */
  closed: boolean;

  /**
   * The color of the function to render
   */
  color: string;

  /**
   * True to make the tip ignore this function
   */
  skipTip: boolean;

  show: boolean;

  xAxisType: "linear" | "log";

  nSamples: number;
}

type DatumPrivateOptions = {
  // helper data
  /**
   * @private
   * The datum index
   */
  index?: number;

  /**
   * @private
   * True if the datum is a helper function
   */
  isHelper?: boolean;

  /**
   * @private
   * True to bypass the range limits, used for helper functions
   */
  skipBoundsCheck?: boolean;
};

export type FunctionPlotDatum = DatumOptions & {
  evalFn: EvalFn;
  sample: Sampler;
};

export type FunctionPlotData = Record<string, FunctionPlotDatum>;
