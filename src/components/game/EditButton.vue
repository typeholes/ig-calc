<script setup lang="ts">
import { GameButton, getFnNames } from "./game";

const props = defineProps<{ item: GameButton }>();
</script>

<template>
  <div>
    costFn:
    <select v-model="item.costFn">
      <option v-for="name in getFnNames()" :value="name">{{ name }}</option>
    </select>
  </div>
  <div>
    cntFn:
    <select v-model="item.cntFn">
      <option v-for="name in getFnNames()" :value="name">{{ name }}</option>
    </select>
  </div>
</template>
