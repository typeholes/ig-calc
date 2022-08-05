import { defined, isBoolean, isNumber } from '../js/util';
import { Map as IMap } from 'immutable';
import { reactive, watch } from 'vue';

import { getStorageKey } from '../js/SaveManager';
import { isString } from 'mathjs';

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


export function loadPersistantOptions() {
  persistantStateKeys.forEach(loadStateProp);

  persistantStateKeys.forEach((key) =>
    watch(
      () => state[key],
      (value: unknown) => saveStateProp(key, value)
    )
  );
}



export const state = reactive({
  hideBottom: false,
  hideLeft: false,
  hideLibrary: true,
  src: 'x',
  error: undefined as undefined | string,
  info: '',
  showHelp: false,
  modified: false,
  showGeneralOptions: false,
  showMenuBar: false,
  exprComponent: 'expr' as 'text' | 'expr',
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

// export function refreshTex(expr?: ValidExpr | undefined) {
//   if (defined(expr)) {
//     addTexElement('tex_' + expr.name, expr.node.toTex());
//   }
//   void nextTick(typeset);
// }


export const systemFnNames = ['time'];
