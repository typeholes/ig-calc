<script setup lang="ts">
import { reactive } from "vue";
import { graph } from "./uiUtil";

function names() {
  return Object.keys(graph.options.data);
}

function nums() {
  return [1, 2, 3, 4, 5]; //TODO
}
</script>

//TODO: make colors stay in sync

<template>
  <div style="overflow:scroll">
  <div
    class="dataGrid"
    :style="{
      gridTemplateColumns: `repeat( ${names().length + 2}, auto)`,
    }"
  >
    <template v-for="(name, idx) of names()">
      <div
        :style="{
          gridColumn: idx + 2,
          border: `1px solid ${graph.options.data[name].color ?? 'white'}`,
        }"
      >
        {{ name.replace(/^anon: /, "") }}
      </div>
    </template>
    <template v-for="num in nums()">
      <div style="gridColumn: 1"> {{ num }} </div>
      <template v-for="(name, idx) of names()"> 
        <div
          :style="{
            gridColumn: idx + 2,
            border: `1px solid ${graph.options.data[name].color ?? 'white'}`,
          }"
        >
          {{ graph.options.data[name].evalFn(num) }}
        </div>
      </template>
    </template>
  </div>
  </div>
</template>

<style>
.dataGrid {
  display: grid;
  border: 1px solid whitesmoke;
  column-gap: 2px;
  overflow: scroll;
}
</style>
