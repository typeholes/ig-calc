<script setup lang="ts">
import { reactive } from "vue";
import { Interval } from "../js/function-plot/types";
import { defined, isValidNumber } from "../js/function-plot/utils";
import { graphOptions, graph } from "./uiUtil";

const firstDatum = Object.entries(graphOptions.data)[0];

const state = reactive({
  xDomain: { ...graphOptions.xDomain },
  y: Interval.midpoint(graphOptions.yDomain),
  numSamples: defined(firstDatum) ? firstDatum[1].nSamples : 1000,
});

const sampleRange = Interval(5, 10000);

function updateGraph() {
  console.log({ state });

  state.numSamples = Interval.clampNumber(sampleRange, state.numSamples);

  for (const name in graphOptions.data) {
    graphOptions.data[name].nSamples = state.numSamples;
  }
  graph.resetZoom(state.xDomain, state.y);
}
</script>

<template>
  <div class="gridOptions">
    <button class="updateGraph" @click="updateGraph">Update Graph</button>
    <span class="row2 col3"> xMin </span>
    <input class="row2 col4" type="number" v-model="state.xDomain.lo" />
    <span class="row2 col5"> xMax </span>
    <input class="row2 col6" type="number" v-model="state.xDomain.hi" />
    <span class="row3 col3">yCenter</span>
    <input class="row3 col4" type="number" v-model="state.y" />
    <span class="row4 col3">Samples</span>
    <input
      class="row4 col4"
      type="number"
      min="5"
      max="10000"
      v-model="state.numSamples"
    />
  </div>
</template>

<style>
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
