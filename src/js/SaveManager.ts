import { errorable, Errorable, raise } from "./Either";
import { defined, hasPropIs, isString } from "./util";

const StorageKey = "ig-calc-saves";

interface Savable<K extends string, V> {
  saveKey: K;
  toSave: (t: V) => string;
  fromSave: (s: string) => Errorable<V>;
}

export const emptySave = (name: string, description: string): SaveObject => ({
  saveName: name,
  saveDescription: description,
});

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

export interface SaveObject {
  saveName: string;
  saveDescription: string;
}

export function parseSave(s: string): Errorable<SaveObject> {
  return errorable(() => {
    const obj = JSON.parse(s);
    if (
      !(
        hasPropIs(obj, "saveName", isString) &&
        hasPropIs(obj, "saveDescription", isString)
      )
    ) {
      throw new Error("save missing name or description");
    }
    return obj;
  });
}

export type SaveMetadata = Record<string, string>;

const defaultSaveMetadata: SaveMetadata = {
  Empty: "Load this for a fresh start",
  Default: "Loaded on page refresh",
};

export function readSaveMetadata() {
  return errorable(() => {
    const str = window.localStorage.getItem(StorageKey);
    if (!str) {
      writeSaveMetadata(defaultSaveMetadata);
      return defaultSaveMetadata;
    }
    const obj = JSON.parse(str);

    // TODO validate obj
    return { ...defaultSaveMetadata, ...obj } as SaveMetadata;
  });
}

export function writeSaveMetadata(metadata: SaveMetadata) {
  // TODO handle QuotaExceeded error
  window.localStorage.setItem(StorageKey, JSON.stringify(metadata));
}

export function writeSave(name: string, description: string, saveStr: string) {
  const oldMeta = raise(readSaveMetadata()).value;
  const meta = { ...oldMeta, [name]: description };
  writeSaveMetadata(meta);

  // TODO handle quota exception
  window.localStorage.setItem(StorageKey + "/" + name, saveStr);
}

export function readSave(name: string): Errorable<string> {
  return errorable(() => {
    if (name === "Empty") {
      return '{"saveName":"Default","saveDescription":"Loaded on page refresh","ExprEnvSaveRep":"{}","ExpressionUiState":"{}"}';
    }

    const saveStr = window.localStorage.getItem(StorageKey + "/" + name);
    if (!defined(saveStr)) {
      if (name === "Default") {
        return '{"saveName":"Default","saveDescription":"Loaded on page refresh","ExprEnvSaveRep":"{}","ExpressionUiState":"{}"}';
      }
      throw new Error("Save " + name + " not found");
    }
    return saveStr;
  });
}
