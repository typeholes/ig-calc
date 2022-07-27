import GraphExpr from './expression/gui/DisplayExpresssion.vue';
import { defined, isBoolean, isNumber } from '../js/util';
import { Map as IMap } from 'immutable';
import { Graph, mkGraph } from '../js/function-plot/d3util';
import { reactive, shallowReactive, shallowRef, nextTick, watch } from 'vue';
import {
  defaultFunctionPlotOptionsAxis,
  FunctionPlotOptions,
} from '../js/function-plot/FunctionPlotOptions';
import { Interval } from '../js/function-plot/types';
import { addTexElement, typeset } from '../js/typeset';
import {
  ValidExpr,
  getNodeName,
  parseExpr,
  isGraphable,
} from '../js/expressions';
import { on } from '../js/Either';

import IgCalc from './IgCalc.vue';
import HelpScreen from './HelpScreen.vue';
import GameEditor from './game/GameEditor.vue';
import GameDisplay from './game/GameDisplay.vue';
import GameMakerTutorial from './game/GameMakerTutorial.vue';
import GameMetaData from './game/GameMetaData.vue';
import { getStorageKey } from '../js/SaveManager';
import TextExpr from './TextExpr.vue';
import TextJsExpr from './TextJsExpr.vue';
import { mkExprEnv } from '../js/env/exprEnv';
import { tick as actionsTick } from '../js/actions';
import { isString } from 'mathjs';
export let graph: Graph;

const colors = IMap(
  'ff0000 00ff00 0000ff ffff00 ff00ff 00ffff ffffff'
    .split(' ')
    .map((s) => ['#' + s, false] as [string, boolean])
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

export const graphOptions: FunctionPlotOptions = {
  target: '#graph',
  //  title: "Default",
  data: {}, //  reactive({}),  can't make this reactive without recursive vue updates
  width: Math.max(window.innerWidth * 0.9, 400),
  height: Math.max(window.innerHeight * 0.8, 400),
  xDomain: reactive(Interval(0, 1)),
  xAxis: { ...defaultFunctionPlotOptionsAxis(), type: 'linear' },
  yDomain: reactive(Interval(0, 1)),
};

export function loadPersistantOptions() {
  persistantStateKeys.forEach(loadStateProp);

  persistantStateKeys.forEach((key) =>
    watch(
      () => state[key],
      (value: unknown) => saveStateProp(key, value)
    )
  );
}

let gameLoopRunning = false;
export function initUI() {
  if (!defined(graph)) {
    initGraph();
  }
  state.env.constant.set('time', 0);
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    window.requestAnimationFrame(gameLoop);
  }

  graph.resetZoom(Interval(-10, 10), 0);
  graph.drawLines();
}

export function initGraph() {
  graph = mkGraph({ ...graphOptions });
  graph.resetZoom(Interval(-10, 10), 0);
  return graph;
}

export const state = reactive({
  runTimer: true,
  hideBottom: false,
  hideLeft: false,
  hideLibrary: true,
  env: mkExprEnv(() => graph),
  newExpr: '',
  parseResult: undefined as undefined | ValidExpr,
  src: 'x',
  error: undefined as undefined | string,
  info: '',
  showHelp: false,
  modified: false,
  showGeneralOptions: false,
  showMenuBar: false,
  exprComponent: 'expr' as 'text' | 'expr',
  tickTime: 0.1,
  freeMin: 1,
  freeMax: 10,
  showHiddenExpressions: false,
  saveEditable: true, //TODO: set back to false once saves are added
  exprBarExpanded: true,
  saveBarExpanded: true,
});

// yes, getting the keys of an object literal is silly
// but it lets me just copy from the state object literal
export const persistantStateKeys = Object.keys({
  runTimer: true,
  hideBottom: false,
  hideLeft: false,
  hideLibrary: true,
  showHelp: false,
  showGeneralOptions: false,
  showMenuBar: false,
  exprComponent: 'expr' as 'text' | 'expr',
  tickTime: 0.1,
  freeMin: 1,
  freeMax: 10,
  showHiddenExpressions: false,
} as const) as (keyof typeof state)[];

const propStorageKey = (key: string) => getStorageKey() + ':state:' + key;
function saveStateProp(key: string, value: unknown) {
  localStorage.setItem(propStorageKey(key), JSON.stringify(value));
}

function loadStateProp(key: keyof typeof state) {
  const currentValue = state[key];
  const valueStr = localStorage.getItem(propStorageKey(key));
  if (!defined(valueStr)) {
    return;
  }

  const newValue: unknown = JSON.parse(valueStr);

  if (isString(currentValue)) {
    // @ts-expect-error ts not narrowing based type predicates here
    state[key] = newValue;
  }

  if (isBoolean(currentValue)) {
    // @ts-expect-error ts not narrowing based type predicates here
    state[key] = newValue;
  }

  if (isNumber(currentValue)) {
    // @ts-expect-error ts not narrowing based type predicates here
    state[key] = newValue;
  }
}

export function checkNewExpr() {
  const expr = state.newExpr.trim();
  if (!defined(expr) || expr.trim() === '') {
    state.error = undefined;
    state.parseResult = undefined;
    return;
  }
  const result = parseExpr(state.env, expr, '__tmp');
  on(result, {
    Left: (err) => {
      state.error = err.message;
    },
    Right: ([expr, ]) => {
      state.error = undefined;
      state.parseResult = expr;
      const datum = graph.options.data['__tmp'];
      datum.show = true;
      datum.color = currentColor();
      refreshTex(expr);
    },
  });
}

export function refreshTex(expr?: ValidExpr | undefined) {
  if (defined(expr)) {
    addTexElement('tex_' + expr.name, expr.node.toTex());
  }
  void nextTick(typeset);
}

export function addToEnv(s: string, showExpr = true) {
  const name = state.parseResult ? getNodeName(state.parseResult.node) : '';
  const oldExpr = state.env.get(name);
  const result = parseExpr(state.env, s, name);
  const oldDatum = graph.options.data[name];
  return on(result, {
    Left: (err) => {
      state.error = err.toString();
      state.parseResult = undefined;
      return undefined;
    },
    Right: ([newExpr, ]) => {
      newColor();
      graph.options.data[name] = {
        ...graph.options.data['__tmp'],
        show:
          graph.options.data['__tmp'].show &&
          showExpr &&
          isGraphable(state.env, newExpr),
      };
      state.error = undefined;
      state.env.delete('__tmp');
      state.parseResult = undefined;

      if (defined(oldExpr)) {
        state.newExpr = oldExpr.node.toString();
        graph.options.data['__tmp'] = { ...oldDatum };
      } else {
        state.newExpr = '';
      }
      checkNewExpr();
      state.modified = true;
      newExpr.showExpr = showExpr;
      return newExpr;
    },
  });
}

export function removeExpr(name: string) {
  if (name === '__tmp') {
    state.newExpr = '';
    checkNewExpr();
  } else {
    state.env.delete(name);
    state.modified = true;
  }
}

export function addNewExpr(name: string, newExpr: string) {
  const expr = newExpr;
  if (!defined(expr) || expr.trim() === '') {
    throw new Error('empty expression');
  }
  const result = parseExpr(state.env, expr, name);
  on(result, {
    Left: (err) => {
      throw err;
    },
    Right: ([expr, ]) => {
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

const importExpressions: Record<string, ValidExpr> = reactive({});
export function addImportExpression(expr: ValidExpr) {
  importExpressions[expr.name] = expr;
}
export function hasImportExpression(expr: ValidExpr): boolean {
  return defined(importExpressions[expr.name]);
}

export function refreshDatumEnvironments() {
  state.env.forEach((expr) => {
    const currentDatum = graph.options.data[expr.name];
    graph.options.data[expr.name] = ValidExpr.toDatum(
      expr,
      state.env,
      currentDatum?.show ?? false,
      currentDatum?.color ?? currentColor()
    );
  });
}

export const appTabs = shallowReactive({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  Calc: shallowRef(IgCalc),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  Help: shallowRef(HelpScreen),
});

export const exprComponents = shallowReactive({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  text: shallowRef(TextExpr),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  expr: shallowRef(GraphExpr),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  js: shallowRef(TextJsExpr),
} as const);

export function lookupExprComponent(name: 'text' | 'expr' | 'js') {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const component = exprComponents[name];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return component.value;
}

const appGameTabs = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  Editor: shallowRef(GameEditor),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  Game: shallowRef(GameDisplay),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  'Game Maker Tutorial': shallowRef(GameMakerTutorial),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  MetaData: shallowRef(GameMetaData),
};

export function enableGameTabs() {
  for (const name in appGameTabs) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //TODO:    appTabs[name] = appGameTabs[name];
  }
}

export function disableGameTabs() {
  for (const name in appGameTabs) {
    //TODO:    delete appTabs[name];
  }
}

export const onTicks: Record<string, (delta: number) => void> = {};
export let time = 0;
export function gameLoop(elapsedTime: number) {
  actionsTick(elapsedTime);
  const t = elapsedTime / 1000;
  const delta = t - time;
  if (delta >= state.tickTime) {
    time = t;
    if (state.runTimer) {
      state.env.constant.set('time', time);
      if (defined(graph)) {
        graph.drawLines();
      }
      Object.values(onTicks).forEach((x) => x(delta));
    }
  }
  window.requestAnimationFrame(gameLoop);
}

export const systemFnNames = ['time'];
