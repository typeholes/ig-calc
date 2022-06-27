<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { Either, Errorable, isLeft } from "../js/Either";
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
} from "../js/SaveManager";
import { ExprEnv, toSaveRep, SaveRep } from "./expressions";
import { ExpressionUiState } from "./expressionUiState";
import { assert, defined } from "../js/util";
import { graph } from "./uiUtil";
import SaveEntry from "./SaveEntry.vue";

import { Map as IMap } from "immutable";

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { Interval } from "../js/function-plot/types";
import { librarySaveMeta, librarySaveReps, libraryDescriptions } from "../js/libraryValues";

type SaveObjectRep = SaveId & { ExprEnvSaveRep: string, description: SaveDescription };

interface Props {
  env: ExprEnv;
  expressionUiState: ExpressionUiState;
  hasUnsaved: boolean;
}

const state = reactive({
  copying: undefined as SaveId | undefined,
  newName: undefined as string | undefined,
  newDescr: undefined as string | undefined,
  deletedSaves: emptySaveMetaData(),
  currentSave: SaveId('local', "Default"),
  selectedSave: SaveId('local', "Default"),
  selectedSaveIsDeleted: false,
  shareString: "",
  showDescriptions: false,
  showDeletedSaves: false,
  hasDeletedSaves: false,
  saveMetaData: Errorable.handle(readSaveMetadata(), (error) => emit("error", error), emptySaveMetaData() )
});

onMounted(() => {
  const search = window.location.search.slice(1);
  const params = new URLSearchParams(search);
  if (params.has("shared")) {
    const shareStr = params.get("shared") ?? "";
    if (shareStr === "") {
      load(DefaultSaveId, "restore");
      return;
    }
    const uncompressed = decompressFromEncodedURIComponent(shareStr) ?? "";
    const saveObj = JSON.parse(uncompressed) as { name: string, description: string, save: string };
    const saveRep = JSON.parse(saveObj.save) as SaveObjectRep;
    console.log(saveRep);

    const name = saveRep.name;
    state.currentSave = SaveId('shared', saveObj.name )
    writeSave(state.saveMetaData, state.currentSave, saveObj.description, saveObj.save  );
    load(state.currentSave, "restore");
    selectSave(state.currentSave, false);
  } else {
    console.log("not shared");
    load(DefaultSaveId, "restore");
  }
});

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "selectSave", value: { saveRep: SaveRep }): void;
  (e: "unselectSave", value: undefined): void;
  (e: "restore", value: { saveRep: SaveRep }): void;
  (e: "error", value: Error): void;
  (e: "saved", value: SaveId): void;
}>();

function baseUrl(): string {
  return (
    window.location.protocol + '//' + window.location.host + window.location.pathname
  );
}

function share(id: SaveId): string {
  const description = state.saveMetaData[id.type][id.name] ?? "No Description";
  const save = Errorable.raise(readSave(id)).value;
  const shareStr = JSON.stringify({ name: id.name, description, save})

  const compressed = compressToEncodedURIComponent(shareStr);
  const uncompressed = decompressFromEncodedURIComponent(compressed);
  console.log({ uncompressed });
  state.shareString = baseUrl() + "?shared=" + compressed;
  navigator.clipboard.writeText(state.shareString);

  return compressed;
}

function getSerializedSave(): SerializedSave {
  const saveRep = toSaveRep(props.env.filter((_, k) => k !== "__tmp"));
  const serialized = SaveRep.toSave(saveRep);
  const saveObj = { ExprEnvSaveRep: serialized };
  return JSON.stringify(saveObj);
}

function save(id: SaveId, description: SaveDescription) {
  writeSave(state.saveMetaData, id, description, getSerializedSave());

  emit("saved", state.currentSave);
}

function load(id: SaveId, emitType: "restore" | "selectSave") {
  if (id.type === 'library') {
    const fns = librarySaveReps.get(id.name)?.fns;
    assert.defined(fns);
    const saveRep : SaveRep = IMap(fns).map( (expr) => ({ expr, show: false, color: "#FFFF00" })).toObject()
    console.log({ saveRep })
        emit(emitType as keyof typeof emit, { saveRep });

        if (emitType === "restore") {
          state.currentSave = id;
        }
        graph.options.title = id.name;
        graph.resetZoom(Interval(-10, 10), 0);

  }
  else {
    Either.on(readSave(id), {
      Left: (x) => {
        emit("error", x);
        return;
      },
      Right: (x) => {
        const obj = JSON.parse(x);
        const saveRep = getSaveEntry(hasSaveEntry(obj, SaveRep), SaveRep);
        if (isLeft(saveRep)) {
          emit("error", saveRep.value);
          return;
        }

        emit(emitType as keyof typeof emit, {
          saveRep: saveRep.value,
        });

        if (emitType === "restore") {
          state.currentSave = id;
        }
        graph.options.title = id.name;
        graph.resetZoom(Interval(-10, 10), 0);
      },
    });
  }
}


function saveList(type: SaveType): IMap<SaveId, readonly [SaveDescription,boolean]> {
  if (type === 'library') { return librarySaveMeta.map( (v) => [v,false] as const) }
  const saveMap = IMap(state.saveMetaData[type]).map((v) => [v, false] as const);
  const map = state.showDeletedSaves ? IMap(state.deletedSaves[type]).map((v) => [v, true] as const).concat(saveMap)  : saveMap

  const ret =  map.filter(
      (v, k) =>
        k !== "__tmp" && true
//        (state.currentSave.type !== type || k !== state.currentSave.name)
    )
    .sortBy((_, k) => ({ Empty: "", Default: " " }[k] ?? k))
    .mapKeys((k) => SaveId(type,k));
  //    .toObject();

  return ret;
}

function copy(id: SaveId) {
  state.copying = id;
  if (id.name === "Empty" || id.name === "Default") {
    state.newName = "name";
    state.newDescr = "";
  } else {
    state.newName = "Copy of " + id.name;
    state.newDescr = state.saveMetaData[id.type][id.name];
  }
}

function create() {
  if (!defined(state.newName)) {
    throw new Error("save name is empty");
  }

  if (state.newName in state.saveMetaData['local']) {
    throw new Error("save already exists: " + state.newName);
  }

  const descr = state.newDescr ?? "No Description";

  const id = SaveId('local', state.newName);
  if (defined(state.copying) ) {
    const fromSave = Errorable.raise(readSave(state.copying)).value;
    writeSave(state.saveMetaData, id, descr, fromSave);
    selectSave(id, false);
  } else {
    save(id, descr);
  }

  cancel();
}

function purgeDeletedSave(id: SaveId): void {
  delete state.deletedSaves[id.type][id.name]
  checkForDeletedSaves();
}

function purgeAllDeletedSaves(): void {
  state.deletedSaves = emptySaveMetaData();
  state.hasDeletedSaves = false;
}

function cancel() {
  state.copying = undefined;
  state.newName = undefined;
  state.newDescr = undefined;
}

function deleteSave(id: SaveId) {
  state.deletedSaves[id.type][id.name] = state.saveMetaData[id.type][id.name];
  delete state.saveMetaData[id.type][id.name];
  writeSaveMetadata(state.saveMetaData);
  state.hasDeletedSaves = true;
  state.selectedSaveIsDeleted = true;
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
  state.hasDeletedSaves=IMap(state.deletedSaves).map( (x)=> IMap(x).size).some( (x) => x > 0)
}

function restoreDeletedSave(id: SaveId) {
  state.saveMetaData[id.type][id.name] = state.deletedSaves[id.type][id.name];
  writeSaveMetadata(state.saveMetaData);

  delete state.deletedSaves[id.type][id.name];

  checkForDeletedSaves();
}

const tmpSaveId = SaveId('local', "__tmp");

function selectSave(id: SaveId, deleted: boolean) {
  state.selectedSave = id;
  state.selectedSaveIsDeleted = deleted;
  if (id.type === 'library') {
    save(tmpSaveId, id.name);
  } else {
    save(tmpSaveId, state.saveMetaData[id.type][id.name] );
  }
    load(id, "selectSave");
}

function unselectSave() {
  state.selectedSave = state.currentSave;
  load(tmpSaveId, "restore");
  state.currentSave = state.selectedSave;
  emit("unselectSave", undefined);
}
</script>

<template>
  <div class="outer">
    <div class="saveWidget">
      <div class="saveColumn">
        <div>Current Save</div>
        <button
          class="save"
          v-if="props.hasUnsaved"
          @click="save(state.currentSave, state.saveMetaData[state.currentSave.type][state.currentSave.name])"
        >
          save
        </button>
        <SaveEntry
          :id="state.currentSave"
          :description="state.saveMetaData[state.currentSave.type][state.currentSave.name]"
          :show-description="true"
          :deleted="false"
        ></SaveEntry>
        <button
          v-if="!defined(state.copying) && SaveId.eq(state.currentSave,state.selectedSave)"
          class="copy"
          @click="copy(state.currentSave)"
        >
          copy
        </button>
        <button class="share" 
          v-if="SaveId.eq(state.currentSave,state.selectedSave)"
        @click="share(state.currentSave)">share</button>
      </div>
      <div class="saveColumn">
        <div>Your Saves</div>
        <div v-for="[id, [description, deleted] ] of saveList('local')">
          <SaveEntry
            :id="id"
            :description="description"
            :show-description="state.showDescriptions"
            :deleted="deleted"
            @click="selectSave(id, deleted)"
          ></SaveEntry>
        </div>
      </div>

      <div class="saveColumn">
        <div>Shared Saves</div>
        <div v-for="[id, [description, deleted] ] of saveList('shared')">
          <SaveEntry
            :id="id"
            :description="description"
            :show-description="state.showDescriptions"
            :deleted="deleted"
            @click="selectSave(id, deleted)"
          ></SaveEntry>
        </div>
      </div>

      <div
        class="saveColumn"
        v-if="
          !SaveId.eq(state.selectedSave,state.currentSave) &&
          state.selectedSave.type !== 'library' &&
          !state.selectedSaveIsDeleted
        "
      >
        <div>{{ state.selectedSave.type }}: {{ state.selectedSave.name }}</div>
        <button
          v-if="!SaveId.eq(state.currentSave, EmptySaveId)"
          class="save"
          @click="save(state.currentSave, state.saveMetaData[state.currentSave.type][state.currentSave.name])"
        >
           Overwrite with current save
        </button>
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
        <button class="share" @click="share(state.selectedSave)">share</button>
        <button
          v-if="
            !SaveId.eq(state.selectedSave, EmptySaveId) && !SaveId.eq(state.selectedSave, DefaultSaveId)
          "
          class="delete"
          @click="deleteSave(state.selectedSave)"
        >
          delete
        </button>
        <button @click="unselectSave">Cancel</button>
      </div>

      <div
        class="saveColumn"
        v-if="
          !SaveId.eq(state.selectedSave,state.currentSave) &&
          state.selectedSave.type !== 'library' &&
          state.selectedSaveIsDeleted
        "
      >
        <div>{{ state.selectedSave.type }}: {{ state.selectedSave.name }}</div>
        
        <button @click="restoreDeletedSave(state.selectedSave)"> restore </button>
        <button @click="purgeDeletedSave(state.selectedSave)"> purge </button>
      </div>

      <div class="saveColumn">
        <div>Library</div>
        <div v-for="[id, [description,deleted]] of saveList('library')">
          <SaveEntry
            :id="id"
            :description="description"
            :show-description="state.showDescriptions"
            :deleted="deleted"
            @click="selectSave(id, deleted)"
          ></SaveEntry>
        </div>
      </div>
      <div
        class="saveColumn"
        v-if="
          !SaveId.eq(state.selectedSave,state.currentSave) &&
          state.selectedSave.type == 'library' &&
          !state.selectedSaveIsDeleted
        "
      >
        <div> {{ state.selectedSave.name }} </div>
        <div> {{ libraryDescriptions.get(state.selectedSave.name) }} </div>
        <button @click="unselectSave">Cancel</button>
      </div>
    <div class="saveColumn" style="margin-left: auto" v-if="state.hasDeletedSaves">
      <span>Deleted Save Options</span>
      <button @click="restoreAllDeletedSaves()">Restore All</button>
      <button @click="purgeAllDeletedSaves()">Purge All</button>
      <div style="display:flex"> <span>Show</span><input type="checkbox" v-model="state.showDeletedSaves"/> 
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
    {{ baseUrl() + "?shared=" + state.shareString }}
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

.saveWidget :first-child :nth-child(2) {
  flex: auto;
}
</style>
