<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { pipeInto, deferP0 as ap } from "ts-functional-pipe";
import { Either, Errorable, isLeft } from "../js/Either";
import {
  emptySave,
  addSaveEntry,
  readSave,
  getSaveEntry,
  hasSaveEntry,
  readSaveMetadata,
  writeSaveMetadata,
  writeSave,
  SaveObject,
} from "../js/SaveManager";
import { ExprEnv, toSaveRep, SaveRep } from "./expressions";
import { getExpressionUiState, ExpressionUiState } from "./expressionUiState";
import { defined } from "../js/util";
import { graph } from "./uiUtil";
import SaveEntry from "./SaveEntry.vue";

import { Map as IMap } from "immutable";

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { Interval } from "../js/function-plot/types";
import Immutable from "immutable";
import { statement } from "@babel/template";

type SaveObjectRep = SaveObject & Record<"ExprEnvSaveRep", string>;

interface Props {
  env: ExprEnv;
  expressionUiState: ExpressionUiState;
  hasUnsaved: boolean;
}

const saveMetaData = reactive(
  Errorable.handle(readSaveMetadata(), (error) => emit("error", error), {})
);

const state = reactive({
  copying: undefined as string | undefined,
  newName: undefined as string | undefined,
  newDescr: undefined as string | undefined,
  deletedSaves: {} as Record<string, string>,
  currentSave: "Default",
  selectedSave: "Default",
  shareString: "",
  showDescriptions: false,
});

onMounted(() => {
  const search = window.location.search.slice(1);
  const params = new URLSearchParams(search);
  if (params.has("shared")) {
    const shareStr = params.get("shared") ?? "";
    if (shareStr === "") {
      load("Default", "restore");
      return;
    }
    const uncompressed = decompressFromEncodedURIComponent(shareStr) ?? "";
    console.log({ shareStr, uncompressed });
    const saveRep = JSON.parse(uncompressed) as SaveObjectRep;
    console.log(saveRep);

    const saveName = "shared/" + saveRep.saveName;
    state.currentSave = saveName;
    saveMetaData[saveName] = saveRep.saveDescription;
    writeSaveMetadata(saveMetaData);
    writeSave(saveName, saveRep.saveDescription, uncompressed);
    load(saveName, "restore");
  } else {
    console.log("not shared");
    load("Default", "restore");
  }
});

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "selectSave", value: { saveRep: SaveRep }): void;
  (e: "unselectSave", value: undefined): void;
  (e: "restore", value: { saveRep: SaveRep }): void;
  (e: "error", value: Error): void;
  (e: "saved", value: string): void;
}>();

function baseUrl(): string {
  return (
    window.location.protocol + window.location.host + window.location.pathname
  );
}

function mkSaveObject(name: string, description: string): SaveObjectRep {
  return pipeInto(
    emptySave(name, description),
    ap(addSaveEntry)(
      toSaveRep(props.env.filter((_, k) => k !== "__tmp")),
      SaveRep
    )
  );
}

function share(name: string): string {
  const description = saveMetaData[name] ?? "No Description";
  const save = Errorable.raise(readSave(name)).value;
  console.log(save);

  const compressed = compressToEncodedURIComponent(save);
  const uncompressed = decompressFromEncodedURIComponent(compressed);
  console.log({ uncompressed });
  state.shareString = baseUrl() + "?shared=" + compressed;
  navigator.clipboard.writeText(state.shareString);

  return compressed;
}

function save(name: string, description: string) {
  const save = mkSaveObject(name, description);

  saveMetaData[name] = description;
  writeSaveMetadata(saveMetaData);
  writeSave(name, description, JSON.stringify(save));

  emit("saved", state.currentSave);
}

function load(name: string, emitType: "restore" | "selectSave") {
  Either.on(readSave(name), {
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
        state.currentSave = name;
      }
      graph.options.title = name;
      graph.resetZoom(Interval(-10, 10), 0);
    },
  });
}

function saveList(type: "local" | "shared") {
  return IMap(saveMetaData)
    .filter(
      (_, k) =>
        k !== '__tmp' && k !== state.currentSave && k.startsWith("shared/") != (type === "local")
    )
    .sortBy((_, k) =>  ({Empty: "", Default: " " }[k] ?? k ))
//    .toObject();
}

function copy(name: string) {
  state.copying = name;
  if (name === "Empty" || name === "Default") {
    state.newName = "name";
    state.newDescr = "";
  } else {
    state.newName = "Copy of " + name;
    state.newDescr = saveMetaData[name];
  }
}

function create() {
  if (!defined(state.newName)) {
    throw new Error("save name is empty");
  }

  if (state.newName in saveMetaData) {
    throw new Error("save already exists: " + state.newName);
  }

  const descr = state.newDescr ?? "No Description";

  if (defined(state.copying)) {
    saveMetaData[state.newName] = descr;
    writeSaveMetadata(saveMetaData);
    const fromSave = Errorable.raise(readSave(state.copying)).value;
    writeSave(state.newName, descr, fromSave);
    selectSave(state.newName);
  } else {
    save(state.newName, descr);
  }

  delete state.deletedSaves[state.newName];
  cancel();
}

function hasDeletedSaves(): boolean {
  return Object.keys(state.deletedSaves).length > 0;
}

function purgeDeletedSaves(): void {
  state.deletedSaves = {};
}

function cancel() {
  state.copying = undefined;
  state.newName = undefined;
  state.newDescr = undefined;
}

function deleteSave(name: string) {
  state.deletedSaves[name] = saveMetaData[name];
  delete saveMetaData[name];
  writeSaveMetadata(saveMetaData);
}

function restore(name: string, descr: string) {
  saveMetaData[name] = descr;
  writeSaveMetadata(saveMetaData);

  delete state.deletedSaves[name];
}

function selectSave(name: string) {
  state.selectedSave = name;
  save('__tmp', 'temporary save')
  load(name, "selectSave");
}

function unselectSave() {
  state.selectedSave = state.currentSave;
  load('__tmp', 'restore');
  state.currentSave = state.selectedSave;
  emit("unselectSave", undefined);
}
</script>

<template>
  <div class="outer">
    <div class="saveWidget">
      <div class="saveColumn">
        <div>Current Save</div>
        <div v-if="props.hasUnsaved">(Unsaved Changes)</div>
        <SaveEntry
          :name="state.currentSave"
          :description="saveMetaData[state.currentSave]"
          :show-description="true"
        ></SaveEntry>
      </div>
      <div class="saveColumn">
        <div>Your Saves</div>
        <div v-for="[name, description] of saveList('local')">
          <SaveEntry
            :name="name"
            :description="description"
            :show-description="state.showDescriptions"
            @click="selectSave(name)"
          ></SaveEntry>
        </div>
      </div>
      <div class="saveColumn">
        <div>Shared Saves</div>
        <div v-for="[name, description] of saveList('shared')">
          <SaveEntry
            :name="name"
            :description="description"
            :show-description="state.showDescriptions"
            @click="selectSave(name)"
          ></SaveEntry>
        </div>
      </div>

      <div class="saveColumn" v-if="state.selectedSave !== state.currentSave">
        <div>{{ state.selectedSave }}</div>
        <button
          v-if="state.currentSave !== 'Empty'"
          class="save"
          @click="save(state.currentSave, saveMetaData[state.currentSave])"
        >
          save
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
            state.selectedSave !== 'Empty' && state.selectedSave !== 'Default'
          "
          class="delete"
          @click="deleteSave(state.selectedSave)"
        >
          delete
        </button>
        <button @click="unselectSave">Cancel</button>
      </div>
    </div>
    <template v-if="defined(state.copying)">
      <span style="grid-column: 1/8"> <hr /></span>
      <span class="name"><input v-model="state.newName" /></span>
      <span class="descr"><input v-model="state.newDescr" /></span>
      <button class="copy" @click="create()">create</button>
      <button class="share" @click="cancel()">cancel</button>
    </template>

    <template v-if="hasDeletedSaves()">
      <span style="grid-column: 1/8">
        Deleted Saves <button @click="purgeDeletedSaves()">Purge</button>
      </span>
    </template>
    <template v-for="(description, name) of state.deletedSaves">
      <span class="name">{{ name }}:</span>
      <span class="descr">{{ description }}</span>
      <button class="save" @click="restore(name, description)">restore</button>
    </template>
  </div>
  <div style="grid-row: 4">
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
