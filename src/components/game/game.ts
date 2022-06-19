import { isNumber } from "mathjs";
import { reactive } from "vue";
import { hasPropIs } from "../../js/function-plot/utils";
import { defined, isString } from "../../js/util";
import { getGraphFn, getDependencies } from "../expressions";
import { state as igCalcState, initGraph, graph, addNewExpr } from "../uiUtil";

export type ItemType = "GameVar" | "GameButton";
export type GameItem = { label: string; type: ItemType };
export type GameVar = GameItem & { valueFn: string };
export type GameButton = GameItem & {
  costFn: string;
  cntFn: string;
  currencyFn: string;
};

export function isItemType(x: unknown): x is ItemType {
  return x === "GameVar" || x === "GameButton";
}

export function GameVar(label: string, valueFn: string): GameVar {
  return { label, type: "GameVar", valueFn };
}

export function GameButton(
  label: string,
  costFn: string,
  cntFn: string,
  currencyFn: string
): GameButton {
  return { label, type: "GameButton", costFn, cntFn, currencyFn };
}

export function isGameItem(x: unknown): x is GameItem {
  return (
    (hasPropIs(x, "label", isString) && hasPropIs(x, "type", isString)) ?? false
  );
}

export function isGameButton(x: unknown): x is GameButton {
  return (
    isGameItem(x) &&
    x.type === "GameButton" &&
    hasPropIs(x, "costFn", isString) &&
    hasPropIs(x, "cntFn", isString) &&
    hasPropIs(x, "currencyFn", isString)
  );
}

export function isGameVar(x: unknown): x is GameVar {
  return (
    isGameItem(x) && x.type === "GameVar" && hasPropIs(x, "valueFn", isString)
  );
}

export function initGameVar(name: string, expr: string) {
  if (!igCalcState.env.has(name)) {
    addNewExpr(name, `${name} = ${expr}`);
  }
}

export function addGameVars() {
  if (!defined(graph)) {
    initGraph(); // TODO separate graph from env so we don't need this here
  }
  initGameVar("time", "0");
  initGameVar("money", "time");
  initGameVar("inc_cnt", "0");
  initGameVar("inc_cost", "inc_cnt * 1.25^inc_cnt");
  defaultItemList.forEach((item) => addGameItem(item));
}

export let time = 0;
export function gameLoop(elapsedTime) {
  const delta = elapsedTime - time;
  if (delta >= 1000) {
    time = elapsedTime;
    addNewExpr("time", `time = ${time}`);
  }
  window.requestAnimationFrame(gameLoop);
}

const defaultItemList: GameItem[] = [
  GameVar("time", "time"),
  GameVar("money", "money"),
  GameButton("Increment a", "inc_cost", "inc_cnt", "money"),
];

const defaultItems = Object.fromEntries(
  defaultItemList.map((x) => [x.label, x])
);

export const game = reactive({
  items: {},
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

export function affordable(item: GameButton) {
  const cost = getValue(item.costFn);
  const currency = getValue(item.currencyFn);
  return isNumber(cost) && isNumber(currency) && currency >= cost;
}

export function buy(item: GameButton) {
  const cnt = getValue(item.cntFn);
  const cost = getValue(item.costFn);
  const currency = getValue(item.currencyFn);
  if (
    isNumber(cnt) &&
    isNumber(cost) &&
    isNumber(currency) &&
    currency >= cost
  ) {
    addNewExpr(item.cntFn, (cnt + 1).toString());
  }
}

export function getUsableFnNames(item: GameItem, ...uses: string[]) {
  console.log(`getting usable names for ${item.label}`, uses);
  return igCalcState.env
    .filter((expr) => getDependencies(igCalcState.env, expr, "free").size == 0)
    .map((expr) => {
      if (uses.includes(expr.name)) {
        return false;
      }
      const some = getDependencies(igCalcState.env, expr, "bound").some(
        (_, k) => {
          console.log({ k, uses, includes: uses.includes(k) });
          return uses.includes(k);
        }
      );
      console.log({ name: expr.name, some });
      return !some;
    })
    .sort()
    .entries();
}

export function itemExists(label: string) {
  return defined(game.items[label]);
}

export function addGameItem(item: GameItem) {
  game.items[item.label] = item;
  if (isGameButton(item)) {
    const currencyExpr = igCalcState.env.get(item.currencyFn)!.node.toString();
    addNewExpr(item.currencyFn, `${currencyExpr} - ${item.costFn}`);
  }
}

export function updateButtonCurrency(
  button: GameButton,
  oldCurrencyFn: string,
  newCurrencyFn: string
) {
  if (oldCurrencyFn !== newCurrencyFn) {
    const oldCurrencyExpr = igCalcState.env.get(oldCurrencyFn)!.node.toString();
    addNewExpr(oldCurrencyFn, `${oldCurrencyExpr} + (${button.costFn})`);
    const newCurrencyExpr = igCalcState.env.get(oldCurrencyFn)!.node.toString();
    addNewExpr(newCurrencyFn, `${newCurrencyExpr} - (${button.costFn})`);
  }
}
