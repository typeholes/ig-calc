import { defined } from "../js/util";
import { Map as IMap } from "immutable";
import { Graph, mkGraph } from "../js/function-plot/d3util";
import { reactive } from "vue";
import { FunctionPlotOptions } from "../js/function-plot/FunctionPlotOptions";
import { Interval } from "../js/function-plot/types";
import {
  ValidExpr,
  getNodeName,
  parseExpr,
  ExprEnv,
  SaveRep,
} from "./expressions";
import DisplayData from "./DisplayData.vue";
import DisplayGraph from "./DisplayGraph.vue";
import { on } from "../js/Either";

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

export const displayComponents = { DisplayData, DisplayGraph };
export const state = reactive({
  hideBottom: false,
  hideLeft: false,
  hideLibrary: true,
  env: IMap() as ExprEnv,
  newExpr: "",
  parseResult: undefined as undefined | ValidExpr,
  src: "x",
  error: undefined as undefined | string,
  info: "",
  showHelp: false,
  loading: false,
  modified: false,
  showGraphOptions: false,
  showMenuBar: false,
  displayComponent: "DisplayGraph" as keyof typeof displayComponents,
});

export function checkNewExpr() {
  const expr = state.newExpr.trim();
  if (!defined(expr) || expr.trim() === "") {
    state.error = undefined;
    state.parseResult = undefined;
    return;
  }
  const result = parseExpr(state.env, expr, "__tmp");
  on(result, {
    Left: (err) => {
      state.error = err.toString();
    },
    Right: ([env, _]) => {
      state.error = undefined;
      state.env = env;
      const expr = env.get("__tmp")!;
      state.parseResult = expr;
      graph.options.data["__tmp"] = ValidExpr.toDatum(
        expr,
        state.env,
        true,
        currentColor()
      );
    },
  });
}

export function addToEnv(s: string) {
  const name = state.parseResult ? getNodeName(state.parseResult.node) : "";
  const oldExpr = state.env.get(name);
  const result = parseExpr(state.env, s, name);
  on(result, {
    Left: (err) => {
      state.error = err.toString();
      state.parseResult = undefined;
    },
    Right: ([env, _]) => {
      newColor();
      const oldDatum = graph.options.data[name];
      graph.options.data[name] = { ...graph.options.data["__tmp"] };
      state.error = undefined;
      state.env = env.delete("__tmp");
      state.parseResult = undefined;

      if (defined(oldExpr)) {
        state.newExpr = oldExpr.node.toString();
        graph.options.data["__tmp"] = { ...oldDatum };
      } else {
        state.newExpr = "";
        delete graph.options.data["__tmp"];
      }
      checkNewExpr();
      state.modified = true;
    },
  });
}

export function removeExpr(name: string) {
  state.env = state.env.remove(name);
  state.modified = true;
}

export function addNewExpr(name: string, newExpr: string) {
  const expr = newExpr;
  if (!defined(expr) || expr.trim() === "") {
    throw new Error("empty expression");
  }
  const result = parseExpr(state.env, expr, name);
  on(result, {
    Left: (err) => {
      throw err;
    },
    Right: ([env, _]) => {
      state.env = env;
      const expr = env.get(name)!;
      const datum = graph.options.data[name];
      graph.options.data[name] = ValidExpr.toDatum(
        expr,
        state.env,
        datum?.show ?? false,
        datum?.color ?? currentColor()
      );
    },
  });
}

export function loadEnv(args: { saveRep: SaveRep }) {
  state.env = state.env.clear();
  if (!defined(graph)) {
    initGraph();
  } else {
    for (const key in graph.options.data) {
      delete graph.options.data[key];
    }
  }
  state.parseResult = undefined;
  state.newExpr = "";
  checkNewExpr();

  for (const name in args.saveRep) {
    const rep = args.saveRep[name];
    state.newExpr = rep.expr;
    checkNewExpr();
    addToEnv(rep.expr);
    graph.options.data[name].color = rep.color;
  }

  // set show after all expressions are added so we don't try to show one that has unloaded dependencies
  for (const name in args.saveRep) {
    const rep = args.saveRep[name];
    graph.options.data[name].show = rep.show;
  }

  state.newExpr = "";
  checkNewExpr();
}

export function refreshDatumEnvironments() {
  for (const expr of state.env.values()) {
    const currentDatum = graph.options.data[expr.name];
    graph.options.data[expr.name] = ValidExpr.toDatum(
      expr,
      state.env,
      currentDatum.show,
      currentDatum.color
    );
  }
}
