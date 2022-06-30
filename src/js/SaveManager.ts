import { errorable, Errorable, raise } from "./Either";
import { assert, defined, hasPropIs, isString } from "./util";

const StorageKey = "ig-calc-saves";

export type SaveName = string;
export type SaveDescription = string;
export type SaveId = { type: SaveType, name: SaveName}
export type SaveType = "local" | "shared" | "library";
export const saveTypes : SaveType[]  = ['local', 'shared', 'library']
export type SerializedSave = string;
export type SaveDetail = { description: SaveDescription, serialized: SerializedSave };
export type Saves = Record<SaveType, Record<SaveName, SaveDetail >>;

export const SaveId = ( type: SaveType, name: SaveName ) : SaveId => ({ type, name })
SaveId.eq = (a: SaveId, b: SaveId) : boolean => a.name === b.name && a.type === b.type


export type SaveMetaData = Record<SaveType, Record<SaveName, SaveDescription >>;

export const DefaultSaveId = SaveId('local', 'Default');
export const EmptySaveId = SaveId('local', 'Empty');

const defaultSaveMetadata : SaveMetaData = {
  local: {
    Empty:  'A fresh start', 
    Default: 'Loaded on page refresh', 
  },
  shared: {},
  library: {},
}

const saves: Saves = {
  local: {
    Empty: { description: 'A fresh start', serialized: '' },
    Default: { description: 'Loaded on page refresh', serialized: '' },
  },
  shared: {},
  library: {},
};

export function isSaveType(x: unknown): x is SaveType {
  return isString(x) && ["local", "shared", "library"].includes(x);
}
interface Savable<K extends string, V> {
  saveKey: K;
  toSave: (t: V) => string;
  fromSave: (s: string) => Errorable<V>;
}

export function addSaveEntry<S, K extends string, V>(
  s: S,
  t: V,
  savable: Savable<K, V>
): S & Record<K, string> {
  const entry = { [savable.saveKey]: savable.toSave(t) } as Record<K, string>;
  return { ...s, ...entry };
}

export function getSaveEntry<S extends Record<K, string>, K extends string, V>(
  save: S,
  saveable: Savable<K, V>
) {
  return saveable.fromSave(save[saveable.saveKey]);
}

export function hasSaveEntry<K extends string, V>(
  save: unknown,
  savable: Savable<K, V>
) {
  if (!hasPropIs(save, savable.saveKey, isString)) {
    throw new Error("save does not contain entry for " + savable.saveKey);
  }
  return save;
}

export function parseSaveMetaData(s: string) : Errorable<SaveMetaData> {
  return errorable(() => {
    const obj = JSON.parse(s);
    assert.propIs(obj, 'local', (x: unknown): x is Record<string,string> => typeof x === 'object');
    assert.propIs(obj, 'shared', (x: unknown): x is Record<string,string> => typeof x === 'object');
    assert.propIs(obj, 'library', (x: unknown): x is Record<string,string> => typeof x === 'object');

    for (const type in obj) {
      for (const name in obj[type]) {
        assert.is(obj[type][name], isString);
      }
    }
    return obj;
  });
}

export const emptySaveMetaData = () : SaveMetaData => ({ local: {}, library: {}, shared: {} });

export function readSaveMetadata() {
  return errorable(() => {
    const str = window.localStorage.getItem(StorageKey);

    if (!str) {
      writeSaveMetadata(defaultSaveMetadata);
      return defaultSaveMetadata;
    }
    
    return Errorable.raise(parseSaveMetaData(str)).value;

  });
}

export function writeSaveMetadata(metadata: SaveMetaData) {
  // TODO handle QuotaExceeded error
  window.localStorage.setItem(StorageKey, JSON.stringify(metadata));
}

export function writeSave(meta: SaveMetaData, id: SaveId, description: SaveDescription, saveStr: string) {
  meta[id.type][id.name] = description;
  writeSaveMetadata(meta);

  // TODO handle quota exception
  window.localStorage.setItem(StorageKey + "/" + id.type + "/" + id.name, saveStr);
}

export function readSave(id: SaveId): Errorable<string> {
  return errorable(() => {
    if (id.name === "Empty") {
      return '{"saveName":"Default","saveDescription":"Loaded on page refresh","ExprEnvSaveRep":"{}","ExpressionUiState":"{}"}';
    }

    const saveStr = window.localStorage.getItem(StorageKey + "/" + id.type + "/" + id.name);
    if (!defined(saveStr)) {
      if (id.name === "Default") {
        return '{"saveName":"Default","saveDescription":"Loaded on page refresh","ExprEnvSaveRep":"{}","ExpressionUiState":"{}"}';
      }
      throw new Error("Save " + id.name + " not found");
    }
    return saveStr;
  });
}
