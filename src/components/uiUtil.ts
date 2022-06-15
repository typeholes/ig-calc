import { defined } from "../js/util";
import { Map as IMap } from "immutable";
import { Graph, mkGraph } from "../js/function-plot/d3util";
import { reactive } from "vue";
import { FunctionPlotOptions } from "../js/function-plot/FunctionPlotOptions";
import { Interval } from "../js/function-plot/types";

const colors = IMap(
  "ff0000 00ff00 0000ff ffff00 ff00ff 00ffff ffffff"
    .split(" ")
    .map((s) => ["#" + s, false] as [string, boolean])
);
let usedColors = colors;

export function currentColor(): string {
  const unused = usedColors.findKey((x) => !x);
  return unused ?? newColor();
}

export function newColor(): string {
  const unused = usedColors.findKey((x) => !x);
  if (!defined(unused)) {
    usedColors = colors;
    return newColor();
  }

  usedColors = usedColors.set(unused, true);
  return unused;
}

export let graph: Graph;

export const graphOptions: FunctionPlotOptions = {
  target: "#graph",
  title: "Default",
  data: {}, //  reactive({}),  can't make this reactive without recursive vue updates
  width: 800,
  height: 600,
  xDomain: reactive(Interval(0, 1)),
  yDomain: reactive(Interval(0, 1)),
};

export function initGraph() {
  graph = mkGraph(graphOptions);
  graph.resetZoom(Interval(-10, 10), 0);
}
