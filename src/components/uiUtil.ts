import { defined } from '../js/util';
import { Map as IMap } from 'immutable';
import { Graph, mkGraph } from '../js/function-plot/d3util';
import { reactive, shallowReactive, shallowRef, nextTick, computed } from 'vue';
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
   SaveRep,
   adjustExpr,
   isGraphable,
} from '../js/expressions';
import DisplayData from './DisplayData.vue';
import DisplayGraph from './DisplayGraph.vue';
import { on } from '../js/Either';

import IgCalc from './IgCalc.vue';
import HelpScreen from './HelpScreen.vue';
import GameEditor from './game/GameEditor.vue';
import GameDisplay from './game/GameDisplay.vue';
import GameMakerTutorial from './game/GameMakerTutorial.vue';
import GameMetaData from './game/GameMetaData.vue';
import { FunctionPlotData } from '../js/function-plot/FunctionPlotDatum';
import { SaveId } from '../js/SaveManager';
import { arrayRange } from '../js/function-plot/utils';
import { actions, runAction, tick as actionsTick } from '../js/actions';
import GraphExpr from './GraphExpr.vue';
import TextExpr from './TextExpr.vue';
import TextJsExpr from './TextJsExpr.vue';
import { mkExprEnv } from '../js/exprEnv';

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
   width: Math.max(window.innerWidth / 2, 400),
   height: Math.max(window.innerHeight / 2, 400),
   xDomain: reactive(Interval(0, 1)),
   xAxis: { ...defaultFunctionPlotOptionsAxis(), type: 'linear' },
   yDomain: reactive(Interval(0, 1)),
};

let gameLoopRunning = false;
export function init() {
   if (!defined(graph)) {
      initGraph();
   }
   state.env.setConstant('time', 0);
   if (!gameLoopRunning) {
      gameLoopRunning = true;
      window.requestAnimationFrame(gameLoop);
   }
}

export function initGraph() {
   graph = mkGraph({ ...graphOptions });
   graph.resetZoom(Interval(-10, 10), 0);
   return graph;
}

export const displayComponents = { DisplayData, DisplayGraph };
export const state = reactive({
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
   loading: false,
   modified: false,
   showGeneralOptions: false,
   showMenuBar: false,
   displayComponent: 'DisplayGraph' as keyof typeof displayComponents,
   exprComponent: 'expr' as 'text' | 'expr',
   currentSave: SaveId('local', 'Default'),
   selectedSave: SaveId('local', 'Default'),
   selectedSaveIsDeleted: false,
   tickTime: 0.1,
   freeMin: 1,
   freeMax: 10,
   showHiddenExpressions: false,
});

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
      Right: ([expr, _]) => {
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
   nextTick(typeset);
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
      Right: ([newExpr, _]) => {
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
      Right: ([expr, _]) => {
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

export function loadEnv(args: { saveRep: SaveRep }) {
   if (!defined(graph)) {
      initGraph();
   }
   state.env.clear();
   state.parseResult = undefined;
   state.newExpr = '';
   checkNewExpr();

   for (const name in args.saveRep) {
      const rep = args.saveRep[name];
      if (rep.expr.startsWith('time =')) {
         break;
      } // TODO save and load envExpr constants
      state.newExpr = rep.expr;
      checkNewExpr();
      const newExpr = addToEnv(rep.expr, rep.showExpr);
      if (defined(newExpr)) {
         newExpr.showValue = rep.showValue;
         newExpr.description = rep.description;
         newExpr.showExpr = rep.showExpr;
      }

      if (defined(graph.options.data[name])) {
         graph.options.data[name].color = rep.color;
      }
   }

   state.modified = Object.entries(importExpressions).length === 0;
   for (const name in importExpressions) {
      const expr = importExpressions[name];
      state.newExpr = expr.node.toString();
      checkNewExpr();
      addToEnv(state.newExpr);
      delete importExpressions[name];
   }

   // set show after all expressions are added so we don't try to show one that has unloaded dependencies
   for (const name in args.saveRep) {
      if (defined(graph.options.data[name])) {
         const rep = args.saveRep[name];
         graph.options.data[name].show = rep.show && rep.showExpr;
      }
   }

   state.newExpr = '';
   checkNewExpr();
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
   Calc: shallowRef(IgCalc),
   Help: shallowRef(HelpScreen),
});

export const exprComponents = shallowReactive({
   text: shallowRef(TextExpr),
   expr: shallowRef(GraphExpr),
   js: shallowRef(TextJsExpr),
});

export function lookupExprComponent(name: 'text' | 'expr' | 'js') {
   const component = exprComponents[name];
   return component.value;
}

const appGameTabs = {
   Editor: shallowRef(GameEditor),
   Game: shallowRef(GameDisplay),
   'Game Maker Tutorial': shallowRef(GameMakerTutorial),
   MetaData: shallowRef(GameMetaData),
};

export function enableGameTabs() {
   for (const name in appGameTabs) {
      appTabs[name] = appGameTabs[name];
   }
}

export function disableGameTabs() {
   for (const name in appGameTabs) {
      delete appTabs[name];
   }
}

export let time = 0;
export function gameLoop(elapsedTime) {
   actionsTick(elapsedTime);
   const t = elapsedTime / 1000;
   const delta = t - time;
   if (delta >= state.tickTime) {
      time = t;
      state.env.setConstant('time', time);
   }
   window.requestAnimationFrame(gameLoop);
}

export const systemFnNames = ['time'];
