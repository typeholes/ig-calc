<script setup lang="ts">
import { reactive } from "vue";
import { Interval } from "../js/function-plot/types";
import { defined, isValidNumber } from "../js/function-plot/utils";
import { graphOptions, graph } from "./uiUtil";

const state = reactive({
  xDomain: { ...graphOptions.xDomain },
  y: Interval.midpoint(graphOptions.yDomain),
});

function updateGraph() {
  console.log({ state });
  graph.resetZoom(state.xDomain, state.y);
}
</script>

<template>
  <div>
    <button @click="updateGraph">Update Graph</button>
    xMin<input type="number" v-model="state.xDomain.lo" /> xMax<input
      type="number"
      v-model="state.xDomain.hi"
    />
    yCenter<input type="number" v-model="state.y" />
  </div>
</template>
