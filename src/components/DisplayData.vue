<script setup lang="ts">
import { graph } from "./uiUtil";
import CanError from "./CanError.vue";
import { errorable, Errorable } from "../js/Either";

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
  return errorable(() => {
    const fn = graph.options.data[name].evalFn;
    if (!(fn instanceof Function)) {
      return "";
    }
    return formatNumber(fn(n));
  });
}
</script>

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
            <CanError :value="runFn(name, num)"></CanError>
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
