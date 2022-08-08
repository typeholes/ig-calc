import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import { Either, Errorable, isLeft } from 'src/js/Either';
import { ExprEnv, mkExprEnv } from 'src/js/env/exprEnv';
import { fromSaveRep, SaveRep, toSaveRep } from 'src/js/env/SaveRep';
import { libraryDescriptions, librarySaveReps } from 'src/js/libraryValues';
import {
  DefaultSaveId,
  emptySaveMetaData,
  getSaveEntry,
  hasSaveEntry,
  isSaveType,
  readSave,
  readSaveMetadata,
  removeSave,
  SaveDescription,
  SaveId,
  SaveMetaData,
  SaveType,
  SerializedSave,
  setStorageKey,
  writeSave,
  writeSaveMetadata,
} from 'src/js/SaveManager';
import { assert, defined, notBlank } from 'src/js/util';
import { computed, nextTick, reactive } from 'vue';

import { Map as IMap } from 'immutable';
import { MMap } from './MMap';
import { Interval } from 'src/js/function-plot/types';
import { tick as actionsTick, getActions } from '../js/actions';

interface State {
  currentSave: SaveId;
  currentEnv: ExprEnv;
  copying: SaveId | undefined;
  newName: string | undefined;
  newDescr: string | undefined;
  deletedSaves: SaveMetaData;
  shareString: string;
  showDescriptions: boolean;
  showDeletedSaves: boolean;
  hasDeletedSaves: boolean;
  error: string;
  saveMetaData: SaveMetaData;
  tickTime: number;
  runTimer: boolean;
}

export const state: State = reactive({
  currentSave: DefaultSaveId,
  currentEnv: mkExprEnv(),
  copying: undefined as SaveId | undefined,
  newName: undefined as string | undefined,
  newDescr: undefined as string | undefined,
  deletedSaves: emptySaveMetaData(),
  shareString: '',
  showDescriptions: false,
  showDeletedSaves: false,
  hasDeletedSaves: false,
  error: '',
  saveMetaData: Errorable.handle(
    readSaveMetadata(),
    (error) => (state.error = error.message),
    emptySaveMetaData()
  ),
  tickTime: 0.1,
  runTimer: true,
});

export const rickRoll = reactive({ show: false, word: '' });

export const environments = MMap(SaveId.toKey, SaveId.fromKey).of<ExprEnv>();

export function purgeDeletedSave(id: SaveId): void {
  delete state.deletedSaves[id.type][id.name];
  checkForDeletedSaves();
}

export function baseUrl(): string {
  return (
    window.location.protocol +
    '//' +
    window.location.host +
    window.location.pathname
  );
}

export function share(id: SaveId): string {
  const description = state.saveMetaData[id.type][id.name] ?? 'No Description';
  const save = Errorable.raise(readSave(id)).value;
  const shareStr = JSON.stringify({ name: id.name, description, save });

  const compressed = compressToEncodedURIComponent(shareStr);
  const uncompressed = decompressFromEncodedURIComponent(compressed);
  console.log({ uncompressed });
  state.shareString = baseUrl() + '?shared=' + compressed;
  void navigator.clipboard.writeText(state.shareString);

  return compressed;
}

export function getSerializedSave(env: ExprEnv): SerializedSave {
  const saveRep = toSaveRep(env);
  const serialized = SaveRep.savable.toSave(saveRep);
  const saveObj = { [SaveRep.savable.saveKey]: serialized };
  return JSON.stringify(saveObj);
}

export function save(id: SaveId, description: SaveDescription) {
  writeSave(
    state.saveMetaData,
    id,
    description ?? '',
    getSerializedSave(environments.get(id)!)
  );
  environments.get(id)!.dirty = false;
}

export function load(id: SaveId) {
  if (!environments.has(id)) {
    const loaded = loadSave(id);
    assert.defined(loaded);
    environments.set(id, loaded);
    loaded.dirty = false;
  }
  return environments.get(id)!;
}
export function open(id: SaveId) {
  const env = load(id);
  env.constant.set('time', 0);
  assert.defined(env);

  state.currentEnv = env;
  state.currentSave = id;
}

export function loadSave(id: SaveId): ExprEnv | undefined {
  if (id.type === 'library') {
    const saveRep = librarySaveReps.get(id.name);
    assert(defined(saveRep), 'Missing SaveRep for library: ' + id.name);
    const env = fromSaveRep(saveRep);
    environments.set(id, env);
    return env;
  } else {
    return Either.on(readSave(id), {
      Left: (x) => {
        state.error = x.message;
        return undefined;
      },
      Right: (x) => {
        const obj: unknown = JSON.parse(x);
        const saveRep = getSaveEntry(
          hasSaveEntry(obj, SaveRep.savable),
          SaveRep.savable
        );
        if (isLeft(saveRep)) {
          // old save.  delete it and reload
          // debugger;
          removeSave(id);
          window.location.reload();
          return undefined;
        }

        const env = fromSaveRep(saveRep.value);
        environments.set(id, env);
        return env;
      },
    });
  }
}

type SaveListItem = {
  description: string;
  deleted: boolean;
};
export function saveList(type: SaveType): IMap<SaveId, SaveListItem> {
  if (type === 'library') {
    return libraryDescriptions.mapEntries(([name, description]) => [
      SaveId('library', name),
      {
        description,
        deleted: false,
      },
    ]);
  }
  const saveMap = IMap(state.saveMetaData[type]).map(
    (v) => [v, false] as const
  );
  const map = state.showDeletedSaves
    ? IMap(state.deletedSaves[type])
        .map((v) => [v, true] as const)
        .concat(saveMap)
    : saveMap;

  const ret = map
    .sortBy((_, k) => ({ Empty: '', Default: ' ' }[k] ?? k))
    .mapEntries(([k, [description, deleted]]) => [
      SaveId(type, k),
      {
        description,
        deleted,
      },
    ]);
  //    .toObject();

  return ret;
}

export function copy(id: SaveId) {
  state.copying = id;
  if (id.name === 'Empty' || id.name === 'Default') {
    state.newName = 'name';
    state.newDescr = '';
  } else {
    state.newName = 'Copy of ' + id.name;
    state.newDescr = state.saveMetaData[id.type][id.name] ?? '';
  }
}

export function create() {
  if (!defined(state.newName)) {
    throw new Error('save name is empty');
  }

  if (state.newName in state.saveMetaData['local']) {
    throw new Error('save already exists: ' + state.newName);
  }

  const descr = state.newDescr ?? 'No Description';

  const id = SaveId('local', state.newName);
  if (defined(state.copying)) {
    const fromSave = Errorable.raise(readSave(state.copying)).value;
    writeSave(state.saveMetaData, id, descr, fromSave);
    state.saveMetaData['local'][state.newName] = descr;
    selectSave(id);
  } else {
    save(id, descr);
  }

  cancel();
}

export function purgeAllDeletedSaves(): void {
  // if ( ? ) { unselectSave(); }
  state.deletedSaves = emptySaveMetaData();
  state.hasDeletedSaves = false;
}

export function cancel() {
  state.copying = undefined;
  state.newName = undefined;
  state.newDescr = undefined;
}

export function deleteSave(id: SaveId) {
  state.deletedSaves[id.type][id.name] =
    state.saveMetaData[id.type][id.name] ?? '';
  delete state.saveMetaData[id.type][id.name];
  writeSaveMetadata(state.saveMetaData);
  state.hasDeletedSaves = true;
  unselectSave();
}

export function restoreAllDeletedSaves() {
  for (const type in state.deletedSaves) {
    for (const name in state.deletedSaves[type as SaveType]) {
      restoreDeletedSave(SaveId(type as SaveType, name));
    }
  }
  state.hasDeletedSaves = false;
}

export function checkForDeletedSaves() {
  state.hasDeletedSaves = IMap(state.deletedSaves)
    .map((x) => IMap(x).size)
    .some((x) => x > 0);
}

export function restoreDeletedSave(id: SaveId) {
  state.saveMetaData[id.type][id.name] = state.deletedSaves[id.type][id.name];
  writeSaveMetadata(state.saveMetaData);

  delete state.deletedSaves[id.type][id.name];

  checkForDeletedSaves();
}

export function selectSave(id: SaveId) {
  open(id);
}

export function unselectSave() {
  // TODO:
}

export function initSaveWidget() {
  const search = window.location.search.slice(1);
  const params = new URLSearchParams(search);

  const storageKey = params.get('StorageKey') ?? '';
  if (params.has('actions')) {
    const actionsKey = params.get('actions');
    const actionCount = params.has('actionCnt')
      ? parseInt(params.get('actionCnt')!)
      : undefined;
    if (defined(actionsKey)) {
      getActions(actionsKey, actionCount);
    }
  }
  if (params.has('StorageKey')) {
    state.saveMetaData = setStorageKey(storageKey);
  }
  if (params.has('saveType') && params.has('saveName')) {
    const saveType = params.get('saveType');
    const saveName = params.get('saveName');
    if (isSaveType(saveType) && notBlank(saveName)) {
      const saveId = SaveId(saveType, saveName);
      open(saveId);
      return;
    }
  }
  if (params.has('shared')) {
    const shareStr = params.get('shared') ?? '';
    if (shareStr === '') {
      open(DefaultSaveId);
      return;
    }
    const uncompressed = decompressFromEncodedURIComponent(shareStr) ?? '';
    const saveObj = JSON.parse(uncompressed) as {
      name: string;
      description: string;
      save: string;
    };

    const newSaveId = SaveId('shared', saveObj.name);
    writeSave(state.saveMetaData, newSaveId, saveObj.description, saveObj.save);
    open(newSaveId);
    selectSave(newSaveId);
    const keyParam = storageKey === '' ? '' : `&StorageKey=${storageKey}`;
    window.location.href =
      baseUrl() + `?saveType=shared&saveName=${saveObj.name}${keyParam}`;
  } else {
    open(DefaultSaveId);
  }
}

export const onTicks: Record<string, (delta: number) => void> = {};
export let time = 0;
export function gameLoop(elapsedTime: number) {
  actionsTick(elapsedTime);
  const t = elapsedTime / 1000;
  const delta = t - time;
  if (delta >= state.tickTime) {
    time = t;
    if (state.runTimer) {
      state.currentEnv.constant.set('time', time, { hidden: true });
      Object.values(onTicks).forEach((x) => x(delta));
    }
    if (defined(state.currentEnv.graph)) {
      state.currentEnv.graph.drawLines();
    }
  }
  window.requestAnimationFrame(gameLoop);
}

let gameLoopRunning = false;
export function initUI() {
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    window.requestAnimationFrame(gameLoop);
  }
}

export const currentSaveIsLibrary = computed( () => state.currentSave.type === 'library')
