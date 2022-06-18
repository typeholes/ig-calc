<script setup lang="ts">
import { GameVar, getFnNames } from "./game";

const props = defineProps<{ item: GameVar }>();
</script>

<template>
  <div>valueFn: 
    <select v-model="item.valueFn">
    <option v-for="name in getFnNames()" :value="name"> {{ name }}</option>
    </select>
  </div>
</template>
