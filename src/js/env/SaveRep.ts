import { EnvItem, ExprEnv, mkExprEnv } from './exprEnv';
import { Animation } from './Animation';
import { EnvExpr } from './EnvExpr';
import { Map as IMap } from 'immutable';
import {
   defined,
   assert,
   isString,
   isNumber,
   hasPropIs,
   isBoolean,
} from '../util';
import { Savable } from '../SaveManager';
import { errorable } from '../Either';
// eslint-disable-next-line vue/prefer-import-from-vue
import { isObject } from '@vue/shared';
import { EnvTypeTag } from './EnvType';

export const SaveRep: { savable: Savable<'ExprEnv', SaveRep> } = {
   savable: {
      toSave: (rep) => JSON.stringify(rep.toJSON()),
      fromSave: (rep) =>
         errorable(() => parse(rep)),
      saveKey: 'ExprEnv',
   },
};

export type SaveRep = IMap<string, SaveRepValue>;
export type SaveRepValue = EnvItem & {
   constant: undefined | number;
   animated: undefined | Animation;
   expression: undefined | string;
};

export function toSaveRep(env: ExprEnv): SaveRep {
   const saveRep: SaveRep = IMap(env.items).map((item, name) => ({
      ...item,
      constant: env.constant.get(name),
      animated: env.animated.get(name),
      expression: env.expression.get(name)?.expr,
   }));
   return saveRep;
}

export function fromSaveRep(saveRep: SaveRep): ExprEnv {
   const env = mkExprEnv();
   saveRep.forEach((item, name) => {
      if (defined(item.constant)) {
         env.constant.set(name, item.constant);
         env.constant.colorGraph(name, item.color);
         env.constant.showGraph(name, item.showGraph);
      }

      if (defined(item.animated)) {
         env.animated.set(name, item.animated);
         env.animated.colorGraph(name, item.color);
         env.animated.showGraph(name, item.showGraph);
      }
      if (defined(item.expression)) {
         env.expression.set(name, EnvExpr(item.expression));
         env.expression.colorGraph(name, item.color);
         env.expression.showGraph(name, item.showGraph);
      }
   });

   return env;
}

function parse(s: string): SaveRep {
   const obj: unknown = JSON.parse(s);
   assert.is(obj, isObject);
   const unknownMap = IMap<string, unknown>(obj);
   const map: SaveRep = unknownMap.map((value) => {
      assert.propMayBe(value, 'constant', isNumber);
      assert.propMayBe(value, 'animated', isAnimation);
      assert.propMayBe(value, 'expression', isString);
       assert.is(value, isEnvItem);

      return value;
   });

   return map;
}

const isAnimation = (x: unknown): x is Animation => {
   if (
      defined(x) &&
      isObject(x) &&
      hasPropIs(x, 'from', isNumber) &&
      hasPropIs(x, 'to', isNumber) &&
      hasPropIs(x, 'period', isNumber) &&
      hasPropIs(x, 'fnName', isString)
   ) {
      const _check: Animation = x;
      return true;
   }

   return false;
};

const isEnvItem = (x: unknown): x is EnvItem => {
assert.is(x, isObject);
   x['description'] ||= '';
   if (
      hasPropIs(x, 'name', isString) &&
      hasPropIs(x, 'color', isColor) &&
      hasPropIs(x, 'hidden', isBoolean) &&
      hasPropIs(x, 'showGraph', isBoolean) &&
      hasPropIs(x, 'showValue', isBoolean) &&
      hasPropIs(x, 'description', isString ) &&
      hasPropIs(x, 'typeTag', isEnvTypeTag)
   ) {
      const _check: EnvItem = x;
      return true;
   }
   return false;
};

const isColor = (x: unknown): x is `#${string}` =>
   isString(x) && x.startsWith('#');

const isEnvTypeTag = (x: unknown): x is EnvTypeTag =>
   isString(x) && (x === 'constant' || x === 'animated' || x === 'expression');
