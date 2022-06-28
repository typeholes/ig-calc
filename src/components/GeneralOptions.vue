<script setup lang="ts">
import { reactive } from "vue";
import { graphOptions, enableGameTabs, disableGameTabs, state as appState } from "./uiUtil";
import GraphOptions from "./GraphOptions.vue";

const firstDatum = Object.entries(graphOptions.data)[0];

const state = reactive({
  showGameTabs: false
});

function toggleGameTabs() {
  state.showGameTabs = !state.showGameTabs;
  if (state.showGameTabs) { 
    enableGameTabs();
  } else {
    disableGameTabs();
  }
}
</script>

<template>
  <div class="gridOptions">
  <GraphOptions></GraphOptions>
  <!-- <GridOptions></GridOptions> -->
    <span class="row2 col3"> Tick time in seconds </span>
    <input class="row2 col4" v-model="appState.tickTime"/>
    <span class="row3 col3"> Show Game Tabs ( Exprimental and often broken feature )</span>
    <input class="row3 col4" type="checkbox" :value="state.showGameTabs" @change="toggleGameTabs" />
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
