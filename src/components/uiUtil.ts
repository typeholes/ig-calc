import { defined } from "../js/util";
import { Map as IMap } from "immutable";
import { Graph, mkGraph } from "../js/function-plot/d3util";

const colors = IMap(
  "ff0000 00ff00 0000ff ffff00 ff00ff 00ffff ffffff"
    .split(" ")
    .map((s) => ["#" + s, false] as [string, boolean])
);
let usedColors = colors;

export function pickColor(): string {
  const unused = usedColors.findKey((x) => !x);
  if (!defined(unused)) {
    usedColors = colors;
    return pickColor();
  }

  usedColors = usedColors.set(unused, true);
  return unused;
}

export let graph : Graph;

export function initGraph() { graph =  mkGraph({
  target: "#graph",
  data: {},
  width: 800,
  height: 600,
})
};
