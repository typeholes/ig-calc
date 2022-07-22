<script setup lang="ts">
   import { watch, computed, onMounted, reactive } from 'vue';
   import { Either, Errorable, isLeft } from '../js/Either';
   import {
      readSave,
      getSaveEntry,
      hasSaveEntry,
      readSaveMetadata,
      writeSaveMetadata,
      writeSave,
      SaveType,
      emptySaveMetaData,
      SaveId,
      DefaultSaveId,
      EmptySaveId,
      SaveDescription,
      SerializedSave,
      isSaveType,
      setStorageKey,
      removeSave,
   } from '../js/SaveManager';
   import { ExprEnv } from 'js/env/exprEnv';
   import { assert, defined } from '../js/util';
   import { graph, initUI, state as appState } from './uiUtil';
   import SaveEntry from './SaveEntry.vue';
   import { fromSaveRep, SaveRep, toSaveRep } from 'js/env/SaveRep';

   import { Map as IMap } from 'immutable';

   import {
      compressToEncodedURIComponent,
      decompressFromEncodedURIComponent,
   } from 'lz-string';
   import { librarySaveReps, libraryDescriptions } from '../js/libraryValues';
   import { notBlank } from '../js/function-plot/utils';
   import { getActions } from '../js/actions';

   const state = reactive({
      currentSave: DefaultSaveId,
      selectedSave: DefaultSaveId,
      copying: undefined as SaveId | undefined,
      newName: undefined as string | undefined,
      newDescr: undefined as string | undefined,
      deletedSaves: emptySaveMetaData(),
      shareString: '',
      showDescriptions: false,
      showDeletedSaves: false,
      hasDeletedSaves: false,
      saveMetaData: Errorable.handle(
         readSaveMetadata(),
         (error) => (appState.error = error.message),
         emptySaveMetaData()
      ),
   });

   const environments = new Map<SaveId, ExprEnv>();

   onMounted(() => {
      const search = window.location.search.slice(1);
      const params = new URLSearchParams(search);

      let storageKey = params.get('StorageKey') ?? '';
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
            load(saveId, 'restore');
            return;
         }
      }
      if (params.has('shared')) {
         const shareStr = params.get('shared') ?? '';
         if (shareStr === '') {
            load(DefaultSaveId, 'restore');
            return;
         }
         const uncompressed = decompressFromEncodedURIComponent(shareStr) ?? '';
         const saveObj = JSON.parse(uncompressed) as {
            name: string;
            description: string;
            save: string;
         };

         const newSaveId = SaveId('shared', saveObj.name);
         writeSave(
            state.saveMetaData,
            newSaveId,
            saveObj.description,
            saveObj.save
         );
         load(newSaveId, 'restore');
         selectSave(newSaveId);
         const keyParam = storageKey === '' ? '' : `&StorageKey=${storageKey}`;
         window.location.href =
            baseUrl() + `?saveType=shared&saveName=${saveObj.name}${keyParam}`;
      } else {
         load(DefaultSaveId, 'restore');
      }
   });

   function baseUrl(): string {
      return (
         window.location.protocol +
         '//' +
         window.location.host +
         window.location.pathname
      );
   }

   function share(id: SaveId): string {
      const description =
         state.saveMetaData[id.type][id.name] ?? 'No Description';
      const save = Errorable.raise(readSave(id)).value;
      const shareStr = JSON.stringify({ name: id.name, description, save });

      const compressed = compressToEncodedURIComponent(shareStr);
      const uncompressed = decompressFromEncodedURIComponent(compressed);
      console.log({ uncompressed });
      state.shareString = baseUrl() + '?shared=' + compressed;
      void navigator.clipboard.writeText(state.shareString);

      return compressed;
   }

   function getSerializedSave(): SerializedSave {
      const saveRep = toSaveRep(appState.env);
      const serialized = SaveRep.savable.toSave(saveRep);
      const saveObj = { [SaveRep.savable.saveKey]: serialized };
      return JSON.stringify(saveObj);
   }

   function save(id: SaveId, description: SaveDescription) {
      writeSave(state.saveMetaData, id, description, getSerializedSave());
      appState.modified = false;
   }

   function load(id: SaveId, loadAction: 'restore' | 'preview') {
      initUI();
      if (defined(graph)) {
         graph.options.data = {};
      }

      const env = environments.get(id) ?? loadSave(id);
      if (!defined(env)) {
         return;
      }

      state.selectedSave = id;
      if (loadAction === 'restore') {
         state.currentSave = id;
      }
      appState.env = env;
      initUI();
   }

   function loadSave(id: SaveId): ExprEnv | undefined {
      if (id.type === 'library') {
         const saveRep = librarySaveReps.get(id.name);
         assert(defined(saveRep), 'Missing SaveRep for library: ' + id.name);
         const env = fromSaveRep(saveRep);
         environments.set(id, env);
         return env;
      } else {
         return Either.on(readSave(id), {
            Left: (x) => {
               appState.error = x.message;
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
                  debugger;
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

   function saveList(
      type: SaveType
   ): IMap<SaveId, readonly [SaveDescription, boolean]> {
      if (type === 'library') {
         return libraryDescriptions.mapEntries(([name, description]) => [
            SaveId('library', name),
            [description, false],
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
         .filter(
            (v, k) => k !== '__tmp' && true
            //        (appState.currentSave.type !== type || k !== appState.currentSave.name)
         )
         .sortBy((_, k) => ({ Empty: '', Default: ' ' }[k] ?? k))
         .mapKeys((k) => SaveId(type, k));
      //    .toObject();

      return ret;
   }

   function copy(id: SaveId) {
      state.copying = id;
      if (id.name === 'Empty' || id.name === 'Default') {
         state.newName = 'name';
         state.newDescr = '';
      } else {
         state.newName = 'Copy of ' + id.name;
         state.newDescr = state.saveMetaData[id.type][id.name];
      }
   }

   function create() {
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
         selectSave(id);
      } else {
         save(id, descr);
      }

      cancel();
   }

   function purgeDeletedSave(id: SaveId): void {
      delete state.deletedSaves[id.type][id.name];
      checkForDeletedSaves();
   }

   function purgeAllDeletedSaves(): void {
      if (selectedSaveIsDeleted.value) {
         unselectSave();
      }
      state.deletedSaves = emptySaveMetaData();
      state.hasDeletedSaves = false;
   }

   function cancel() {
      state.copying = undefined;
      state.newName = undefined;
      state.newDescr = undefined;
   }

   function deleteSave(id: SaveId) {
      state.deletedSaves[id.type][id.name] =
         state.saveMetaData[id.type][id.name];
      delete state.saveMetaData[id.type][id.name];
      writeSaveMetadata(state.saveMetaData);
      state.hasDeletedSaves = true;
      unselectSave();
   }

   function restoreAllDeletedSaves() {
      for (const type in state.deletedSaves) {
         for (const name in state.deletedSaves[type]) {
            restoreDeletedSave(SaveId(type as SaveType, name));
         }
      }
      state.hasDeletedSaves = false;
   }

   function checkForDeletedSaves() {
      state.hasDeletedSaves = IMap(state.deletedSaves)
         .map((x) => IMap(x).size)
         .some((x) => x > 0);
   }

   function restoreDeletedSave(id: SaveId) {
      state.saveMetaData[id.type][id.name] =
         state.deletedSaves[id.type][id.name];
      writeSaveMetadata(state.saveMetaData);

      delete state.deletedSaves[id.type][id.name];

      checkForDeletedSaves();
   }

   function selectSave(id: SaveId) {
      load(id, 'preview');
   }

   function unselectSave() {
      if (!previewing.value) {
         return;
      }
      load(state.currentSave, 'preview');
   }

   const previewing = computed(
      () => !SaveId.eq(state.currentSave, state.selectedSave)
   );

   watch(previewing, (x) => {
      appState.saveEditable = !x;
   });

   const selectedSaveIsDeleted = computed(
      () =>
         state.selectedSave.name in state.deletedSaves[state.selectedSave.type]
   );
</script>

<template>
   <div class="outer">
      <div class="saveWidget">
         <div class="saveColumn" v-if="!previewing">
            <div>Current Save</div>
            <button
               class="save"
               v-if="
                  appState.modified &&
                  !SaveId.eq(state.currentSave, EmptySaveId)
               "
               @click="
                  save(
                     state.currentSave,
                     state.saveMetaData[state.currentSave.type][
                        state.currentSave.name
                     ]
                  )
               "
            >
               save
            </button>
            <SaveEntry
               :id="state.currentSave"
               :description="
                  state.saveMetaData[state.currentSave.type][
                     state.currentSave.name
                  ]
               "
               :show-description="true"
               :deleted="false"
            ></SaveEntry>
            <button
               v-if="!defined(state.copying) && !previewing"
               class="copy"
               @click="copy(state.currentSave)"
            >
               copy
            </button>
            <button
               class="share"
               v-if="!previewing"
               @click="share(state.currentSave)"
            >
               share
            </button>
         </div>
         <div class="saveColumn" v-if="!previewing">
            <div>Your Saves</div>
            <div
               :key="id.name + '/' + id.name"
               v-for="[id, [description, deleted]] of saveList('local')"
            >
               <SaveEntry
                  :id="id"
                  :description="description"
                  :show-description="state.showDescriptions"
                  :deleted="deleted"
                  @click="selectSave(id)"
               ></SaveEntry>
            </div>
         </div>

         <div class="saveColumn" v-if="!previewing">
            <div>Shared Saves</div>
            <div
               :key="id.name + '/' + id.name"
               v-for="[id, [description, deleted]] of saveList('shared')"
            >
               <SaveEntry
                  :id="id"
                  :description="description"
                  :show-description="state.showDescriptions"
                  :deleted="deleted"
                  @click="selectSave(id)"
               ></SaveEntry>
            </div>
         </div>

         <div
            class="saveColumn"
            v-if="
               previewing &&
               state.selectedSave.type !== 'library' &&
               !selectedSaveIsDeleted
            "
         >
            <div class="previewHeader">
               Preview of
               {{ state.selectedSave.type }} save
               {{ state.selectedSave.name }}
            </div>
            <!-- <button
               v-if="!SaveId.eq(appState.currentSave, EmptySaveId)"
               class="save"
               @click="
                  save(
                     appState.currentSave,
                     state.saveMetaData[appState.currentSave.type][
                        appState.currentSave.name
                     ]
                  )
               "
            >
               Overwrite with current save
            </button> -->
            <button class="load" @click="load(state.selectedSave, 'restore')">
               load
            </button>
            <button
               v-if="!defined(state.copying)"
               class="copy"
               @click="copy(state.selectedSave)"
            >
               copy
            </button>
            <button class="share" @click="share(state.selectedSave)">
               share
            </button>
            <button
               v-if="
                  !SaveId.eq(state.selectedSave, EmptySaveId) &&
                  !SaveId.eq(state.selectedSave, DefaultSaveId)
               "
               class="delete"
               @click="deleteSave(state.selectedSave)"
            >
               delete
            </button>
            <button @click="unselectSave">Close</button>
         </div>

         <div
            class="saveColumn"
            v-if="
               previewing &&
               state.selectedSave.type !== 'library' &&
               selectedSaveIsDeleted
            "
         >
            <div>
               {{ state.selectedSave.type }}:
               {{ state.selectedSave.name }}
            </div>

            <button @click="restoreDeletedSave(state.selectedSave)">
               restore
            </button>
            <button
               @click="
                  purgeDeletedSave(state.selectedSave);
                  unselectSave();
               "
            >
               purge
            </button>
            <button @click="unselectSave">Close</button>
         </div>

         <div class="saveColumn" v-if="!previewing">
            <div>Library</div>
            <div
               :key="id.name + '/' + id.name"
               v-for="[id, [description, deleted]] of saveList('library')"
            >
               <SaveEntry
                  :id="id"
                  :description="description"
                  :show-description="state.showDescriptions"
                  :deleted="deleted"
                  @click="selectSave(id)"
               ></SaveEntry>
            </div>
         </div>
         <div
            class="saveColumn"
            v-if="
               previewing &&
               state.selectedSave.type == 'library' &&
               !selectedSaveIsDeleted
            "
         >
            <div class="previewHeader">{{ state.selectedSave.name }}</div>
            <div>{{ libraryDescriptions.get(state.selectedSave.name) }}</div>
            <button @click="unselectSave">Close</button>
         </div>
         <div
            class="saveColumn"
            style="margin-left: auto"
            v-if="state.hasDeletedSaves"
         >
            <span>Deleted Save Options</span>
            <button @click="restoreAllDeletedSaves()">Restore All</button>
            <button @click="purgeAllDeletedSaves()">Purge All</button>
            <div style="display: flex">
               <span>Show</span
               ><input type="checkbox" v-model="state.showDeletedSaves" />
            </div>
         </div>
      </div>
      <template v-if="defined(state.copying)">
         <span style="grid-column: 1/8"> <hr /></span>
         <span class="name"><input v-model="state.newName" /></span>
         <span class="descr"><input v-model="state.newDescr" /></span>
         <button class="copy" @click="create()">create</button>
         <button class="share" @click="cancel()">cancel</button>
      </template>
   </div>
   <div style="grid-row: 5">
      {{ state.shareString }}
   </div>
</template>

<style scoped>
   input {
      margin: 5px 5px 5px 0px;
      width: 95%;
   }

   .saveInfo {
      grid-row: 2;
   }

   .saveWidget {
      display: flex;
      flex-direction: row;
      gap: 7px;
   }

   .saveColumn {
      display: flex;
      flex-direction: column;
      gap: 3px;
   }

   .saveColumn > :first-child {
      background-color: rgb(82, 94, 90);
   }

   .saveColumn > .previewHeader {
      background-color: rgb(50, 85, 50);
   }

   .saveWidget :first-child :nth-child(2) {
      flex: auto;
   }
</style>
