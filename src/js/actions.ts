import { defined, hasProp, tuple } from './util';
import {
  cursorState,
  goToElement,
  scrollToElement,
} from '../components/FakeCursor';

export const actionNames = [
  'wait',
  'alert',
  'showCursor',
  'select',
  'goto',
  'scrollTo',
  'gotoNoScroll',
  'click',
  'set',
  'append',
  'type',
] as const;
type ActionName = typeof actionNames[number];

interface ActionArgs {
  args: { elementId?: string | undefined; value?: string | undefined };
  delay: number;
}
type Action = [ActionName, ActionArgs];

export function isAction(x: unknown): x is Action {
  return (
    Array.isArray(x) &&
    x.length === 2 &&
    actionNames.includes(x[0]) &&
    hasProp(x[1], 'delay') &&
    hasProp(x[1], 'args')
  );
}

let selectedElement: undefined | [HTMLElement, DOMRect] = undefined;
type ActionHandler = ({ elementId, value }: ActionArgs['args']) => void;

const actionHandlers: Record<ActionName, ActionHandler> = {
  wait: () => {
    /* do nothing */
  },
  alert: alert,
  //  setNewExpr: (x) => {
  // appState.newExpr = x;
  // checkNewExpr();
  //  },
  //  addExpr: (expr, short) => {
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
  //  },
  showCursor: () => {
    cursorState.show = true;
  },
  select: ({ elementId }) => {
    if (defined(elementId)) {
      selectedElement = getVisibleElement(elementId) ?? undefined;
    }
  },
  scrollTo: ({ elementId }) => {
    actionHandlers.select({ elementId });
    scrollToElement(selectedElement);
  },
  gotoNoScroll: ({ elementId }) => {
    actionHandlers.select({ elementId });
    goToElement(selectedElement);
  },
  goto: ({ elementId }) => {
    prependAction('gotoNoScroll', { delay: 0.3, args: { elementId } });
    prependAction('scrollTo', { delay: 0, args: { elementId } });
  },
  click: ({ elementId }) => {
    actionHandlers.select({ elementId });
    if (!defined(selectedElement)) {
      return;
    }
    const [el] = selectedElement;
    el.classList.add('fakeActive');
    setTimeout(() => el.classList.remove('fakeActive'), 500);
    el.click();
  },
  set: ({ value, elementId }) => {
    actionHandlers.select({ elementId });
    if (selectedElement instanceof HTMLInputElement) {
      selectedElement.value = value ?? '';
      selectedElement.dispatchEvent(new Event('input', { bubbles: true }));
      selectedElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  append: ({ value, elementId }) => {
    actionHandlers.select({ elementId });
    if (
      defined(selectedElement) &&
      selectedElement[0] instanceof HTMLInputElement
    ) {
      const el = selectedElement[0];
      el.value += value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  type: ({ value, elementId }) => {
    actionHandlers.select({ elementId });
    if (
      defined(selectedElement) &&
      selectedElement[0] instanceof HTMLInputElement
    ) {
      actions?.unshift(
        ...(value ?? '')
          .split('')
          .map((char: string) =>
            mkAction('append', { delay: 0.2, args: { value: char, elementId } })
          )
      );
    }
  },
} as const;

export function mkAction(
  name: keyof typeof actionHandlers,
  { delay, args }: ActionArgs
): Action {
  return [name, { delay, args }];
}

export function addAction(
  name: keyof typeof actionHandlers,
  { delay, args }: ActionArgs
) {
  actions?.push([name, { delay, args }]);
}

export function sendActions<T extends { action: Action }>(
  channel: BroadcastChannel,
  actions: T[]
) {
  channel.postMessage(actions);
}

export function sendAction(
  channel: BroadcastChannel,
  name: keyof typeof actionHandlers,
  { delay, args }: ActionArgs
) {
  channel.postMessage({ action: [name, { delay, args }] });
}

export function prependAction(
  name: keyof typeof actionHandlers,
  { delay, args }: ActionArgs
) {
  actions?.unshift([name, { delay, args }]);
}

export function runAction([name, { args }]: [ActionName, ActionArgs]) {
  if (name in actionHandlers) {
    const fn = actionHandlers[name];
    fn(args);
  } else {
    alert(`unknown action ${name}`);
  }
}
export const actions: Action[] = [];

const bodyEl = document.getElementsByTagName('body')[0];
let previousElapsedTime = 0;
let nextTime = 0.01;
let holdPointerEvents: string | undefined = undefined;
export function tick(elapsedTime: number) {
  const deltaSeconds = (elapsedTime - previousElapsedTime) / 1000;
  if (deltaSeconds < nextTime) {
    return;
  }
  previousElapsedTime = elapsedTime;
  // if (defined(actions) && actions.length > 0) {
  //    console.log({
  //       deltaSeconds,
  //       time,
  //       nextTime,
  //       now: new Date().getSeconds(),
  //    });
  // }

  if (defined(actions) && actions.length > 0) {
    if (!defined(holdPointerEvents)) {
      holdPointerEvents = bodyEl.style.pointerEvents;
      bodyEl.style.pointerEvents = 'none';
      bodyEl.style.overflow = 'hidden';
    }
    if (actions.length > 0 && actions[0][1].delay > 0) {
      nextTime = actions[0][1].delay;
      actions[0][1].delay = 0;
      return;
    } else {
      nextTime = 0.5;
    }
    const action = actions.shift()!;
    // console.log('running action', {
    //   nextTime,
    //   action: action,
    // });
    runAction(action);
  } else if (defined(holdPointerEvents)) {
    bodyEl.style.pointerEvents = holdPointerEvents;
    holdPointerEvents = undefined;
    bodyEl.style.overflow = '';
  }
}

function getVisibleElement(id: string) {
  return Array.from(document.querySelectorAll('#' + id.replaceAll(':', '\\:')))
    .map((x) => tuple(x, x.getBoundingClientRect()))
    .filter(
      ([el, rect]) =>
        el instanceof HTMLElement &&
        rect.top != rect.bottom &&
        rect.left != rect.right
    )[0] as [HTMLElement, DOMRect];
}
