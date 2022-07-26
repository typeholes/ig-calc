<script setup lang="ts">
   import { reactive } from 'vue';
   import { Interval } from '../js/function-plot/types';
   import { defined, isValidNumber } from '../js/function-plot/utils';
   import { graphOptions, graph, initGraph } from './uiUtil';

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
      //     initGraph(); // TODO: causes graph axis to change badly
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
      <span class="row3 col3"> x axis scaling </span>
      <select class="row3 col4" v-model="graphOptions.xAxis.type">
         <option value="'linear'">Linear</option>
         <option value="'log'">Logarithmic</option>
      </select>

      <span class="row4 col3">yCenter</span>
      <input class="row4 col4" type="number" v-model="state.y" />
      <span class="row5 col5">Samples</span>
      <input
         class="row5 col6"
         type="number"
         min="5"
         max="10000"
         v-model="state.numSamples"
      />
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
