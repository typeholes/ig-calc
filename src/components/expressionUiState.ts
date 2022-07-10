// eslint-disable-next-line vue/prefer-import-from-vue
import { isObject } from "@vue/shared";

import { isString } from "mathjs";
import { reactive } from "vue";
import { errorable, Errorable } from "../js/Either";
import { assert, hasPropIs, isBoolean } from "../js/util";

interface State {
  color: string;
  show: boolean;
}

export type ExpressionUiState = Record<string, State>;
const states: ExpressionUiState = reactive({});

export function getExpressionUiState(): ExpressionUiState {
  return { ...states };
}

export function setExpressionUiState(state: ExpressionUiState) {
  for (const key in state) {
    states[key] = state[key];
  }
}

let colorIdx = 0;
const defaultColors = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
];
function pickColor() {
  colorIdx = (colorIdx + 1) % defaultColors.length;
  return defaultColors[colorIdx];
}

const defaultState = (): State => ({ show: false, color: pickColor() });

export function getColor(id: string): string {
  states[id] ??= defaultState();
  return states[id].color;
}

export function setColor(id: string, color: string) {
  states[id] ??= defaultState();
  states[id].color = color;
}

export function getShow(id: string) {
  states[id] ??= defaultState();
  return states[id].show;
}

export function setShow(id: string, show: boolean) {
  states[id] ??= defaultState();
  states[id].show = show;
}

function toSave(s: ExpressionUiState): string {
  return JSON.stringify(s);
}

function fromSave(s: string): Errorable<ExpressionUiState> {
  return errorable(() => {
    const obj : unknown = JSON.parse(s);
    assert.is(obj, isObject)
    const ret: ExpressionUiState = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (
        !(hasPropIs(v, "show", isBoolean) && hasPropIs(v, "color", isString))
      ) {
        throw new Error("invalid state for ExpressionUiState: " + String(v));
      }
      ret[k] = v;
    });
    return ret;
  });
}

export const ExpressionUiState = {
  toSave,
  fromSave,
  saveKey: "ExpressionUiState" as const,
};
