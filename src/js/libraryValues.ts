import { Map as IMap } from 'immutable';
import { SaveDescription, SaveName } from './SaveManager';
import { Animation } from 'js/env/Animation';
import { EnvExpr } from 'js/env/EnvExpr';
import { defaultEnvItem } from './env/exprEnv';
import { SaveRep, SaveRepValue } from './env/SaveRep';

interface Library {
   name: SaveName;
   description: SaveDescription;
   constant: Record<string, [number, string]>;
   animated: Record<string, [Animation, string]>;
   expression: Record<string, [EnvExpr, string]>;
}

// const Library = {
//   addSaveRep: (library: Library): Library & { saveRep: SaveRep } => ({
//     ...library,
//     saveRep: IMap(library.fns)
//       .map(([expr, description]) => ({
//         expr,
//         show: false,
//         color: "#FFFFFF",
//         description,
//         showValue: false,
//         showExpr: true,
//       }))
//       .toObject(),
//   }),
// };

const periodic: Library = {
   name: 'periodic',
   description: 'periodic functions, useful for animationing variables',
   expression: {
      sinal: [
         EnvExpr(
            'sinal(x, min, height, width) = min + height/2 * (1 + sin(2 pi x / width) )'
         ),
         'sin wave',
      ],
      zigZag: [
         EnvExpr(
            'zigZag(x, min, height, width) = min + height * (acos(0.999 sin(2 pi x / width)) / pi)'
         ),
         'linear',
      ],
   },
   constant: {
      min: [1, ''],
      height: [5, ''],
      width: [5, ''],
   },
   animated: {},
};

function libraryToSaveRep(library: Library) {
   const constant: IMap<string, SaveRepValue> = IMap(library.constant).map(
      ([value, description], name) => ({
         animated: undefined,
         expression: undefined,
         constant: value,
         ...defaultEnvItem('constant', name, description),
      })
   );

   const animated: IMap<string, SaveRepValue> = IMap(library.animated).map(
      ([value, description], name) => ({
         constant: undefined,
         expression: undefined,
         animated: value,
         ...defaultEnvItem('animated', name, description),
      })
   );

   const expression: IMap<string, SaveRepValue> = IMap(library.expression).map(
      ([value, description], name) => ({
         constant: undefined,
         animated: undefined,
         expression: value.expr,
         ...defaultEnvItem('expression', name, description),
      })
   );

   return expression.merge(animated, constant);
}

const libraryArr = [periodic];

export const libraries = IMap(
   libraryArr.map((library) => [library.name, library])
);

export const libraryDescriptions = IMap(
   libraryArr.map((library) => [library.name, library.description])
);

export const librarySaveReps = IMap<string, SaveRep>(
   libraries.map((library) => libraryToSaveRep(library))
);
