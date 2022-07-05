import { defined } from '../js/util';
import { Map as IMap } from 'immutable';
import { Graph, mkGraph } from '../js/function-plot/d3util';
import { reactive, shallowReactive, shallowRef, nextTick, computed } from 'vue';
import { FunctionPlotOptions } from '../js/function-plot/FunctionPlotOptions';
import { Interval } from '../js/function-plot/types';
import { addTexElement, typeset } from '../js/typeset';
import {
   ValidExpr,
   getNodeName,
   parseExpr,
   ExprEnv,
   SaveRep,
   adjustExpr,
   isGraphable,
} from './expressions';
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

export let graph: Graph;

export const graphOptions: FunctionPlotOptions = {
   target: '#graph',
   //  title: "Default",
   data: {}, //  reactive({}),  can't make this reactive without recursive vue updates
   width: 800,
   height: 600,
   xDomain: reactive(Interval(0, 1)),
   yDomain: reactive(Interval(0, 1)),
};

let gameLoopRunning = false;
export function init() {
   if (!defined(graph)) {
      initGraph();
   }
   const timeFn = state.env.get('time');
   if (!defined(timeFn)) {
      addNewExpr('time', 'time = 0');
   }
   if (!gameLoopRunning) {
      gameLoopRunning = true;
      window.requestAnimationFrame(gameLoop);
   }
}

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
      Right: ([env, _]) => {
         state.error = undefined;
         state.env = env;
         const expr = env.get('__tmp')!;
         state.parseResult = expr;
         graph.options.data['__tmp'] = ValidExpr.toDatum(
            expr,
            state.env,
            true,
            currentColor()
         );
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
   return on(result, {
      Left: (err) => {
         state.error = err.toString();
         state.parseResult = undefined;
         return undefined;
      },
      Right: ([env, newExpr, _]) => {
         newColor();
         const oldDatum = graph.options.data[name];
         graph.options.data[name] = {
            ...graph.options.data['__tmp'],
            show:
               graph.options.data['__tmp'].show &&
               showExpr &&
               isGraphable(env, newExpr),
         };
         state.error = undefined;
         state.env = env.delete('__tmp');
         state.parseResult = undefined;

         if (defined(oldExpr)) {
            state.newExpr = oldExpr.node.toString();
            graph.options.data['__tmp'] = { ...oldDatum };
         } else {
            state.newExpr = '';
            delete graph.options.data['__tmp'];
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
      state.env = state.env.remove(name);
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

const importExpressions: Record<string, ValidExpr> = reactive({});
export function addImportExpression(expr: ValidExpr) {
   importExpressions[expr.name] = expr;
}
export function hasImportExpression(expr: ValidExpr): boolean {
   return defined(importExpressions[expr.name]);
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
   state.newExpr = '';
   checkNewExpr();

   for (const name in args.saveRep) {
      const rep = args.saveRep[name];
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
   for (const expr of state.env.values()) {
      const currentDatum = graph.options.data[expr.name];
      graph.options.data[expr.name] = ValidExpr.toDatum(
         expr,
         state.env,
         currentDatum?.show ?? false,
         currentDatum?.color ?? currentColor()
      );
   }
}

export const appTabs = shallowReactive({
   Calc: shallowRef(IgCalc),
   Help: shallowRef(HelpScreen),
});

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
      const timeFn = state.env.get('time');
      if (defined(timeFn)) {
         adjustExpr(timeFn, `${time}`);
      }
   }
   window.requestAnimationFrame(gameLoop);
}

export const systemFnNames = ['time'];
