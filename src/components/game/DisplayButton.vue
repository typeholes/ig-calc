<script setup lang="ts">
import { GameButton, getValue, buy } from "./game";

const props = defineProps<{ item: GameButton }>();
</script>

<template>
  <button @click="buy(item.cntFn)">buy: {{ Math.floor(getValue(item.costFn) as number) }}</button>
  <div>cnt: {{ getValue(item.cntFn) }}</div>
</template>

<style scoped>

button {
  background-color: rgb(95, 129, 129);
}

</style>
