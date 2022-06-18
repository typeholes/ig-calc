import { reactive } from "vue";
import { defined } from "../../js/util";
import { getGraphFn, getDependencies } from "../expressions";
import {
  state as igCalcState,
  initGraph,
  addToEnv,
  graph,
  addNewExpr,
} from "../uiUtil";

export type ItemType = "GameVar" | "GameButton";
export type GameItem = { label: string; type: ItemType };
export type GameVar = GameItem & { valueFn: string };
export type GameButton = GameItem & { costFn: string; cntFn: string };

function GameVar(label: string, valueFn: string): GameVar {
  return { label, type: "GameVar", valueFn };
}

function GameButton(label: string, costFn: string, cntFn: string): GameButton {
  return { label, type: "GameButton", costFn, cntFn };
}

function initGameVar(name: string, expr: string) {
  if (!igCalcState.env.has(name)) {
    addNewExpr(name, expr);
  }
}

export function addGameVars() {
  if (!defined(graph)) {
    initGraph(); // TODO separate graph from env so we don't need this here
  }
  initGameVar("inc_cnt", "0");
  initGameVar("inc_cost", "inc_cnt * 1.25^inc_cnt");
}

const defaultItems: GameItem[] = [
  GameVar("a", "inc_cnt"),
  GameButton("Increment a", "inc_cost", "inc_cnt"),
];

export const game = reactive({
  items: defaultItems,
});

export function getValue(fnName: string): number | string {
  const env = igCalcState.env;
  const expr = env.get(fnName);
  if (!defined(expr)) {
    return "not found";
  }

  const fn = getGraphFn(env, expr);
  return fn?.evaluate() ?? "not found";
}

export function buy(fnName: string) {
  const cnt = getValue(fnName);
  if (typeof cnt === "number") {
    addNewExpr(fnName, (cnt + 1).toString());
  }
}

export function getFnNames() {
  return igCalcState.env
    .filter((expr) => getDependencies(igCalcState.env, expr, "free").size == 0)
    .keys();
}
