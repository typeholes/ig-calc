<script setup lang="ts">
import IgCalc from "./IgCalc.vue";
import HelpScreen from "./HelpScreen.vue";
import GameEditor from "./game/GameEditor.vue";
import GameDisplay from "./game/GameDisplay.vue";
import { globalTheme } from "../js/theme";
import { reactive, shallowRef } from "vue";
import GameMakerTutorial from "./game/GameMakerTutorial.vue";
import GameMetaData from "./game/GameMetaData.vue";

const theme = globalTheme ?? {};

const tabs = {
  Calc: shallowRef(IgCalc),
  Help: shallowRef(HelpScreen),
  Editor: shallowRef(GameEditor),
  Game: shallowRef(GameDisplay),
  'Game Maker Tutorial': shallowRef(GameMakerTutorial),
  MetaData: shallowRef(GameMetaData), 
} as const;

const numTabs = Object.keys(tabs).length;

const state = reactive({
  tab: tabs.Calc,
});

function setTab(tabName: keyof typeof tabs) {
  state.tab = tabs[tabName];
}
</script>

<template>
  <div class="main">
    <template v-for="(_, tabName, col) in tabs">
      <button :class="`tab col${col + 1}`" @click="setTab(tabName)">
        {{ tabName }}
      </button>
    </template>
    <div class="pane">
      <KeepAlive>
        <component :is="state.tab"></component>
      </KeepAlive>
    </div>
  </div>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

:deep(*) {
  background-color: v-bind("theme.backgroundColor");
  color: v-bind("theme.color");
  text-align: center;
}

.main {
  display: grid;
  grid-auto-columns: 1fr;
  row-gap: 5px;
}

.pane {
  grid-row: 2;
  grid-column-start: 1;
  grid-column-end: v-bind(numTabs + 1);
}

.tab {
  background-color: rgb(82, 87, 90);
}
</style>

<style>
html {
  background-color: black;
}

.row2 {
  grid-row: 2;
}
.row3 {
  grid-row: 3;
}
.row4 {
  grid-row: 4;
}
.col1 {
  grid-column: 1;
}
.col2 {
  grid-column: 2;
}
.col3 {
  grid-column: 3;
}
.col4 {
  grid-column: 4;
}
.col5 {
  grid-column: 5;
}
.col6 {
  grid-column: 6;
}
.col7 {
  grid-column: 7;
}
.col8 {
  grid-column: 8;
}
.col9 {
  grid-column: 9;
}
</style>
