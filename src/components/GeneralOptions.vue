<script setup lang="ts">
import { reactive } from "vue";
import { Interval } from "../js/function-plot/types";
import { defined, isValidNumber } from "../js/function-plot/utils";
import { graphOptions, enableGameTabs } from "./uiUtil";

const firstDatum = Object.entries(graphOptions.data)[0];

const state = reactive({
  tickRate: 100,  // milliseconds
  showGameTabs: false
});

function toggleGameTabs() {
  state.showGameTabs = !state.showGameTabs;
  if (state.showGameTabs) { 
    enableGameTabs();
  } else {

  }
}
</script>

<template>
  <div class="gridOptions">
    <span class="row2 col3"> Show Game Tabs </span>
    <input class="row2 col4" type="checkbox" :value="state.showGameTabs" @change="toggleGameTabs" />
  </div>
</template>

<style scoped>
.gridOptions {
  display: grid;
  grid-template-columns: repeat(9, auto);
  grid-template-rows: repeat(3, min-content);
  align-items: center;
  row-gap: 3px;
}

.updateGraph {
  grid-row: 1;
  grid-column: 5;
}

</style>
