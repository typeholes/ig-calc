import { defined, hasProp, tuple } from './util';
import { cursorState, goToElement } from '../components/FakeCursor';

export const actionNames = [
  'wait',
  'alert',
  'showCursor',
  'select',
  'goto',
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
  goto: ({ elementId }) => {
    actionHandlers.select({ elementId });
    goToElement(selectedElement);
  },
  click: ({ elementId }) => {
    actionHandlers.select({ elementId });
    if (!defined(selectedElement)) { return; }
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
    if (selectedElement instanceof HTMLInputElement) {
      selectedElement.value += value;
      selectedElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  type: ({ value, elementId }) => {
    actionHandlers.select({ elementId });
    if (selectedElement instanceof HTMLInputElement) {
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
      prependAction('wait', { delay: action[1].delay, args: {} });
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
