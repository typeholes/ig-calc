import { isObject } from '@vue/shared';
import { isArray, isNumber, sluDependencies } from 'mathjs';
import { assert, defined, hasProp, hasPropIs, isString } from './util';
import {
   addToEnv,
   checkNewExpr,
   state as appState,
} from '../components/uiUtil';
import { cursorState, goToElement } from '../components/FakeCursor';

interface ActionArgs {
   args: string[];
   delay: number;
}
type Action = [string, ActionArgs];

const actionHandlers: Record<string, (...x: string[]) => void> = {
   alert: alert,
   setNewExpr: (x) => {
      appState.newExpr = x;
      checkNewExpr();
   },
   addExpr: (x) => {
      appState.newExpr = x;
      checkNewExpr();
      addToEnv(x, true);
   },
   showCursor: () => {
      cursorState.show = true;
   },
   goto: goToElement,
};

export function runAction([name, { delay, args }]: Action) {
   if (name in actionHandlers) {
      const fn = actionHandlers[name];
      fn(...args);
   } else {
      alert(`unknown action ${name}`);
   }
}
export let actions: Action[] | undefined = undefined;

export function getActions(name: string, cnt: number | undefined) {
   const response = fetch(
      `${window.location.origin}/ig-calc/actions/${name}.json`
   );
   response.then((response) => {
      if (!response.ok) {
         throw new Error(response.statusText);
      }

      response.json().then((x) => (actions = parseActions(x, cnt)));
   });
}

function parseActions(json: unknown, cnt: number | undefined): Action[] {
   const actions: Action[] = [];
   assert(isArray(json), 'actions must be a valid json array');
   json.forEach((x) => {
      assert.is(x, isObject);
      Object.entries(x).forEach(([k, v]) => {
         if (hasPropIs(v, 'args', isArray)) {
            const delay = hasPropIs(v, 'delay', isNumber) ? v.delay : 1;
            actions.push([k, { args: v.args, delay }]);
         } else if (isString(v) && defined(v)) {
            actions.push([k, { args: [v], delay: 2 }]);
         }
      });
   });
   return actions.slice(0, cnt);
}

let time = 0;
let nextTime = 0.5;
export function tick(elapsedSeconds: number) {
   time += elapsedSeconds;
   if (nextTime > time) {
      return;
   }

   if (defined(actions) && actions.length > 0) {
      const action = actions.shift()!;
      runAction(action);
      nextTime += action[1].delay;
   }
}
