import { errorable, Errorable, Left } from './Either';
import { assert, defined, hasPropIs, isString } from './util';

// eslint-disable-next-line vue/prefer-import-from-vue
import { isObject } from '@vue/shared';

let StorageKey = 'ig-calc-saves';
export function setStorageKey(key: string): SaveMetaData {
  StorageKey = `ig-calc-saves[${key}]`;
  return Errorable.handle(
    readSaveMetadata(),
    (error) => {
      throw error;
    },
    emptySaveMetaData()
  );
}
export function getStorageKey(): string {
  return StorageKey + '';
}

export type SaveName = string;
export type SaveDescription = string;
export type SaveId = { type: SaveType; name: SaveName };
export type SaveType = 'local' | 'shared' | 'library';
export const saveTypes: SaveType[] = ['local', 'shared', 'library'];
export type SerializedSave = string;
export type SaveDetail = {
  description: SaveDescription;
  serialized: SerializedSave;
};
export type Saves = Record<SaveType, Record<SaveName, SaveDetail>>;

export const SaveId = (type: SaveType, name: SaveName): SaveId => ({
  type,
  name,
});

SaveId.eq = (a: SaveId, b: SaveId): boolean =>
  a.name === b.name && a.type === b.type;

SaveId.toKey = (a: SaveId): string => a.type + '\{01}' + a.name;

export type SaveMetaData = Record<SaveType, Record<SaveName, SaveDescription>>;

export const DefaultSaveId = SaveId('local', 'Default');
export const EmptySaveId = SaveId('local', 'Empty');

const defaultSaveMetadata: SaveMetaData = {
  local: {
    Empty: 'A fresh start',
    Default: 'Loaded on page refresh',
  },
  shared: {},
  library: {},
};

export function isSaveType(x: unknown): x is SaveType {
  return isString(x) && ['local', 'shared', 'library'].includes(x);
}
export interface Savable<K extends string, V> {
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
  save: S | undefined,
  saveable: Savable<K, V>
) {
  if (!defined(save)) {
    return Left(new Error('corrupt save for entry ' + saveable.saveKey));
  }
  return saveable.fromSave(save[saveable.saveKey]);
}

export function hasSaveEntry<K extends string, V>(
  save: unknown,
  savable: Savable<K, V>
) {
  if (!hasPropIs(save, savable.saveKey, isString)) {
    return undefined;
  }
  return save;
}

export function parseSaveMetaData(s: string): Errorable<SaveMetaData> {
  return errorable(() => {
    const obj: unknown = JSON.parse(s);
    assert.propIs(
      obj,
      'local',
      (x: unknown): x is Record<string, string> => typeof x === 'object'
    );
    assert.propIs(
      obj,
      'shared',
      (x: unknown): x is Record<string, string> => typeof x === 'object'
    );
    assert.propIs(
      obj,
      'library',
      (x: unknown): x is Record<string, string> => typeof x === 'object'
    );

    for (const type in obj) {
      const t: unknown = obj[type];
      assert.is(t, isObject);
      for (const name in t) {
        assert.is(t[name], isString);
      }
    }
    return obj;
  });
}

export const emptySaveMetaData = (): SaveMetaData => ({
  local: {},
  library: {},
  shared: {},
});

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

export function writeSave(
  meta: SaveMetaData,
  id: SaveId,
  description: SaveDescription,
  saveStr: string
) {
  meta[id.type][id.name] = description;
  writeSaveMetadata(meta);

  // TODO handle quota exception
  window.localStorage.setItem(
    StorageKey + '/' + id.type + '/' + id.name,
    saveStr
  );
}

export function removeSave(id: SaveId) {
  window.localStorage.removeItem(StorageKey + '/' + id.type + '/' + id.name);
}

export function readSave(id: SaveId): Errorable<string> {
  return errorable(() => {
    if (id.name === 'Empty') {
      return '{"saveName":"Default","saveDescription":"Loaded on page refresh","ExprEnv":"{}","ExpressionUiState":"{}"}';
    }

    const saveStr = window.localStorage.getItem(
      StorageKey + '/' + id.type + '/' + id.name
    );
    if (!defined(saveStr)) {
      if (id.name === 'Default') {
        return '{"saveName":"Default","saveDescription":"Loaded on page refresh","ExprEnv":"{}","ExpressionUiState":"{}"}';
      }
      throw new Error('Save ' + id.name + ' not found');
    }
    return saveStr;
  });
}
