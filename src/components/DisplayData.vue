<script setup lang="ts">
import { reactive } from "vue";
import { graph } from "./uiUtil";

const props = defineProps<{ names: string[] }>();

function names() {
  return props.names ?? [];
}

function nums() {
  return 10;
}

function formatName(name: string) {
  if (name === "__tmp") {
    return "temp";
  }
  return name.replace(/^anon: /, "");
}

function formatNumber(n: number) {
  return n; // TODO
}

function runFn(name: string, n: number) {
  const fn = graph.options.data[name].evalFn;
  if (typeof fn !== "function") {
    return "";
  }
  return formatNumber(fn(n));
}
</script>

//TODO: make colors stay in sync

<template>
  <div>
    <div
      class="dataGrid"
      :style="{
        gridTemplateColumns: `repeat( ${names().length + 2}, auto)`,
      }"
    >
      <div style="gridcolumn: 1">free</div>
      <template v-for="(name, idx) of names()">
        <div
          :style="{
            gridColumn: idx + 2,
            border: `1px solid ${graph.options.data[name].color ?? 'white'}`,
          }"
        >
          {{ formatName(name) }}
        </div>
      </template>
      <template v-for="num in nums()">
        <div :style="{gridColumn: 1, gridRow: num+1}">{{ num }}</div>
        <template v-for="(name, idx) of names()">
          <div
            :style="{
              gridColumn: idx+2,
              border: `1px solid ${graph.options.data[name].color ?? 'white'}`,
            }"
          >
            {{ runFn(name, num) }}
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
  overflow: auto auto;
  max-width: 60vw;
}
</style>
