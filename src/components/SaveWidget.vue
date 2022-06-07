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
import { Graph } from "../js/function-plot/d3util";
import { graph } from "./uiUtil";

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { Interval } from "../js/function-plot/types";

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
  shareString: "",
});

onMounted(() => {
  const search = window.location.search.slice(1);
  const params = new URLSearchParams(search);
  if (params.has("shared")) {
    const shareStr = params.get("shared") ?? "";
    if (shareStr === "") {
      load("Default");
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
    load(saveName);
  } else {
    console.log("not shared");
    load("Default");
  }
});

const props = defineProps<Props>();

const emit = defineEmits<{
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

function load(name: string) {
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

      emit("restore", {
        saveRep: saveRep.value,
      });

      state.currentSave = name;
      graph.options.title = name;
      graph.resetZoom(Interval(-10, 10), 0);
    },
  });
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
</script>

<template>
  <div class="outer">
    <div class="saveWidget">
      <span style="grid-column: 1"> <b>Name</b> </span>
      <span style="grid-column: 2"> <b>Description</b> </span>
      <span style="grid-column: 3/8"></span>
      <template v-for="(description, name) of saveMetaData">
        <span class="name">{{ name }}</span>
        <span class="descr">{{ description }}</span>
        <button
          v-if="name !== 'Empty'"
          class="save"
          @click="save(name, description)"
        >
          save
        </button>
        <button class="load" @click="load(name)">load</button>
        <button v-if="!defined(state.copying)" class="copy" @click="copy(name)">
          copy
        </button>
        <button class="share" @click="share(name)">share</button>
        <button
          v-if="name !== 'Empty' && name !== 'Default'"
          class="delete"
          @click="deleteSave(name)"
        >
          delete
        </button>
      </template>
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
        <button class="save" @click="restore(name, description)">
          restore
        </button>
      </template>
    </div>
    <div class="saveInfo">
      <span>Current Save: {{ state.currentSave }} </span>
      <span v-if="props.hasUnsaved"> (Unsaved Changes) </span>
    </div>
    <div style="grid-row: 4">
      {{ baseUrl() + "?shared=" + state.shareString }}
    </div>
  </div>
</template>

<style>
.outer {
  display: grid;
  grid-template-rows: 1fr 1fr 4fr 1fr;
}

input {
  margin: 5px 5px 5px 0px;
  width: 95%;
}

.saveInfo {
  grid-row: 2;
}

.saveWidget {
  border: 1px solid white;
  grid-row: 3;
  display: grid;
  grid-template-columns: 4fr 16fr repeat(5, 1fr);
  row-gap: 3px;
  justify-content: center;
}

.name {
  grid-column: 1;
  border: 1px solid white;
}

.descr {
  grid-column: 2;
  border: 1px solid white;
}

.save {
  grid-column: 3;
  border: 1px solid white;
}

.load {
  grid-column: 4;
  border: 1px solid white;
}

.copy {
  grid-column: 5;
  border: 1px solid white;
}

.share {
  grid-column: 6;
  border: 1px solid white;
}

.delete {
  grid-column: 7;
  border: 1px solid white;
}
</style>
