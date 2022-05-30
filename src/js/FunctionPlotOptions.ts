import { FunctionPlotData } from "../js/function-plot/FunctionPlotDatum";
import { Interval } from "../js/function-plot/types";

export interface FunctionPlotOptions {
  /**
   * @private
   * For internal usage
   */
  id?: string;

  /**
   * DOM node of the parent element that will contain the graph
   */
  target: string;

  /**
   * The chart title
   */
  title?: string;

  /**
   * The chart width (set on the svg element)
   */
  width?: number;

  /**
   * The chart height (set on the svg element)
   */
  height?: number;

  /**
   * The x-axis configuration
   */
  xAxis?: FunctionPlotOptionsAxis;

  /**
   * The y-axis configuration
   */
  yAxis?: FunctionPlotOptionsAxis;

  /**
   * The x-axis domain, internally state used to preserve the x-domain across multiple calls to function plot
   */
  xDomain?: Interval;

  /**
   * The y-axis domain, internally state used to preserve the y-domain across multiple calls to function plot
   */
  yDomain?: Interval;

  /**
   * The tip configuration
   */
  tip?: FunctionPlotTip;

  /**
   * True to display a grid
   */
  grid?: boolean;

  /**
   * True to disable panning and zoom
   */
  disableZoom?: boolean;

  /**
   * The functions to plot
   */
  data?: FunctionPlotData;

  /**
   * The annotations displayed in the graph
   */
  //  annotations?: FunctionPlotAnnotation[]
}

export interface FunctionPlotOptionsAxis {
  /**
   * Initial ends of the axis
   */
  domain?: Interval;

  /**
   * The type of axis (either {@link ScaleLinear} or {@link ScaleLogarithmic}
   */
  type?: "linear" | "log";

  /**
   * The label to display next to the axis
   */
  label?: string;

  /**
   * True to invert the direction of the axis
   */
  invert?: boolean;
}

export interface FunctionPlotTip {
  /**
   * True to display a vertical line on mouseover
   */
  xLine?: boolean;

  /**
   * True to display a horizontal line on mouseover
   */
  yLine?: boolean;

  /**
   * A function to override what's rendered on mouseover
   */
  renderer?: (x: number, y: number, index: number) => string;

  /**
   * Internal reference to the {@link Chart} instance
   */
  owner?: any;
}
