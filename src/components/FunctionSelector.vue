<script setup lang="ts">
import { reactive } from "vue";
import { libraryDescriptions, libraryFns } from "../js/libraryValues";
import { defined } from "../js/util";
import { addToEnv, checkNewExpr, state as appState } from "./uiUtil";

const state = reactive({
  selecting: false,
  libraryName: undefined as string | undefined,
});

function selectLibrary(name: string) {
  state.libraryName = name;
}

function selectFunction(name: string, expr: string) {
  appState.newExpr = expr;
  checkNewExpr();
  addToEnv(appState.newExpr, false);

  if (expr.includes("=")) {
    const lhs = expr.replace(/=.*$/, "");
    appState.newExpr += lhs;
  } else {
    appState.newExpr += name;
  }
  checkNewExpr();
}
</script>

<template>
  <div class="selector">
    Enter an expression above or
    <button @click="state.selecting = true">Select from Library</button>
    <div class="cols" v-if="state.selecting">
      <div class="rows" v-for="[name, description] of libraryDescriptions">
        <div class="rows nameDescription" @click="selectLibrary(name)">
          <span>{{ name }}</span
          ><span> {{ description }}</span>
        </div>
      </div>
      <div style="flex-shrink: 2"></div>
      <template v-if="defined(state.libraryName)">
        <div class="rows">
          <div
            v-for="([expr, description], name) of libraryFns.get(
              state.libraryName
            )"
          >
            <div
              class="rows nameDescription"
              @click="selectFunction(name, expr)"
            >
              <span>{{ name }}</span
              ><span> {{ description }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.selector {
  border: 1px solid white;
  width: 100%;
  text-align: center;
  border-radius: 3px;
}

.nameDescription {
  text-align: left;
  border: 1px solid white;
  gap: 0;
}

.nameDescription > :first-child {
  background-color: rgb(50, 85, 50);
}

.nameDescription > :nth-child(2) {
  background-color: rgb(73, 72, 72);
  text-indent: 2ch;
}

.cols > div {
  flex: 1 1 content;
}
</style>
