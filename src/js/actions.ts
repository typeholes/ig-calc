import { isObject } from '@vue/shared';
import { isArray, isNumber, sluDependencies } from 'mathjs';
import { assert, defined, hasProp, hasPropIs, isString } from './util';
import {
   addToEnv,
   checkNewExpr,
   state as appState,
} from '../components/uiUtil';
import { cursorState, goToElement } from '../components/FakeCursor';
import { nextTick } from 'vue';

interface ActionArgs {
   args: string[];
   delay: number;
}
type Action = [string, ActionArgs];

let selectedElement: HTMLElement | undefined = undefined;

const actionHandlers: Record<string, (...x: string[]) => void> = {
   wait: () => {},
   alert: alert,
   setNewExpr: (x) => {
      appState.newExpr = x;
      checkNewExpr();
   },
   addExpr: (expr, short) => {
      if (short === 'short') {
         appState.newExpr = expr;
         checkNewExpr();
         addToEnv(expr, true);
      } else {
         // TODO: function to append multiple actions so we don't have to do them in reverse order
         prependAction('wait', 2);
         prependAction('click', 0.5);
         prependAction('wait', 2);
         prependAction('goto', 2.5, 'addExpr');
         prependAction('wait', 2);
         prependAction('type', 1, expr);
         prependAction('wait', 2);
         prependAction('click', 0.5);
         prependAction('wait', 2);
         prependAction('goto', 2.5, 'newExpr');
         prependAction('wait', 2);
      }
   },
   showCursor: () => {
      cursorState.show = true;
   },
   select: (x) => {
      if (defined(x)) {
         selectedElement = document.getElementById(x) ?? undefined;
      }
   },
   goto: (x) => {
      actionHandlers.select(x);
      goToElement(selectedElement);
   },
   click: (x) => {
      actionHandlers.select(x);
      selectedElement?.click();
   },
   set: (value, elementId) => {
      actionHandlers.select(elementId);
      if (selectedElement instanceof HTMLInputElement) {
         selectedElement.value = value;
         selectedElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
   },
   append: (value, elementId) => {
      actionHandlers.select(elementId);
      if (selectedElement instanceof HTMLInputElement) {
         selectedElement.value += value;
         selectedElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
   },
   type: (value, elementId) => {
      actionHandlers.select(elementId);
      if (selectedElement instanceof HTMLInputElement) {
         actions?.unshift(
            ...value.split('').map((char) => mkAction('append', 0.2, [char]))
         );
      }
   },
};

function mkAction(
   name: keyof typeof actionHandlers,
   delay: number,
   args: string[]
): Action {
   return [name, { delay, args }];
}

function prependAction(
   name: keyof typeof actionHandlers,
   delay: number,
   ...args: string[]
) {
   actions?.unshift([name, { delay, args }]);
}

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
      nextTime += action[1].delay;
      console.log('running action', {
         time,
         nextTime,
         name: action[0],
         ...action[1],
         selected: selectedElement?.id,
      });
      runAction(action);
   }
}
