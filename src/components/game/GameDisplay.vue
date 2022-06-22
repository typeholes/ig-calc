<script setup lang="ts">
import { addGameVars, game } from "./game";
import DisplayItem from "./DisplayItem.vue";
import { onMounted } from "vue";
import { init } from "../uiUtil";

onMounted(() => {
  addGameVars();
  init();
});
</script>

<template>
  <template v-for="item in game.items">
    <DisplayItem :item="item"></DisplayItem>
  </template>
</template>
