import {
   isArray,
   isNumber,
} from 'mathjs';
import { assert, defined, hasPropIs, isString } from './util';
import { cursorState, goToElement } from '../components/FakeCursor';

// eslint-disable-next-line vue/prefer-import-from-vue
import { isObject } from '@vue/shared';

interface ActionArgs {
   args: string[];
   delay: number;
}
type Action = [string, ActionArgs];

let selectedElement: HTMLElement | undefined = undefined;

const actionHandlers: Record<string, (...x: string[]) => void> = {
   wait: () => { /* do nothing */ },
   alert: alert,
   setNewExpr: (x) => {
      // appState.newExpr = x;
      // checkNewExpr();
   },
   addExpr: (expr, short) => {
      // if (short === 'short') {
      //    appState.newExpr = expr;
      //    checkNewExpr();
      //    addToEnv(expr, true);
      // } else {
      //    // TODO: function to append multiple actions so we don't have to do them in reverse order
      //    prependAction('wait', 2);
      //    prependAction('click', 0.5);
      //    prependAction('wait', 2);
      //    prependAction('goto', 2.5, 'addExpr');
      //    prependAction('wait', 2);
      //    prependAction('type', 1, expr);
      //    prependAction('wait', 2);
      //    prependAction('click', 0.5);
      //    prependAction('wait', 2);
      //    prependAction('goto', 2.5, 'newExpr');
      //    prependAction('wait', 2);
      // }
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
      selectedElement?.classList.add('fakeActive');
      setTimeout(() => selectedElement?.classList.remove('fakeActive'), 500);
      selectedElement?.click();
   },
   set: (value, elementId) => {
      actionHandlers.select(elementId);
      if (selectedElement instanceof HTMLInputElement) {
         selectedElement.value = value;
         selectedElement.dispatchEvent(new Event('input', { bubbles: true }));
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

export function runAction([name, { args }]: Action) {
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
   void response.then((response) => {
      if (!response.ok) {
         throw new Error(response.statusText);
      }

      void response.json().then((x) => (actions = parseActions(x, cnt)));
   });
}

function parseActions(json: unknown, cnt: number | undefined): Action[] {
   const actions: Action[] = [];
   assert(isArray(json), 'actions must be a valid json array');
   json.forEach((x: unknown) => {
      assert.is(x, isObject);
      Object.entries(x).forEach(([k, v]) => {
         if (hasPropIs(v, 'args', isArray)) {
            const delay = hasPropIs(v, 'delay', isNumber) ? v.delay : 1;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            actions.push([k, { args: v.args, delay }]);
         } else if (isString(v) && defined(v)) {
            actions.push([k, { args: [v], delay: 2 }]);
         }
      });
   });
   return actions.slice(0, cnt);
}

const bodyEl = document.getElementsByTagName('body')[0];
let previousElapsedTime = 0;
let time = 0;
let nextTime = 0.5;
let holdPointerEvents: string | undefined = undefined;
export function tick(elapsedTime: number) {
   const deltaSeconds = (elapsedTime - previousElapsedTime) / 1000;
   previousElapsedTime = elapsedTime;
   time += deltaSeconds;
   // if (defined(actions) && actions.length > 0) {
   //    console.log({
   //       deltaSeconds,
   //       time,
   //       nextTime,
   //       now: new Date().getSeconds(),
   //    });
   // }
   if (nextTime > time) {
      return;
   }

   if (defined(actions) && actions.length > 0) {
      if (!defined(holdPointerEvents)) {
         holdPointerEvents = bodyEl.style.pointerEvents;
         bodyEl.style.pointerEvents = 'none';
         bodyEl.style.overflow = 'hidden';
      }
      const action = actions.shift()!;
      const name = action[0];
      if (name === 'wait') {
         nextTime += action[1].delay;
      } else {
         prependAction('wait', action[1].delay);
         nextTime += 0.1;
      }
      // console.log('running action', {
      //    time,
      //    nextTime,
      //    name: name,
      //    ...action[1],
      //    selected: selectedElement?.id,
      // });
      runAction(action);
   } else if (defined(holdPointerEvents)) {
      bodyEl.style.pointerEvents = holdPointerEvents;
      holdPointerEvents = undefined;
      bodyEl.style.overflow = '';
   }
}
