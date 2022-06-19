<script setup lang="ts">
import { addGameVars, game, gameLoop } from "./game";
import DisplayItem from "./DisplayItem.vue";
import { onMounted } from "vue";

onMounted(() => {
    addGameVars();
  window.requestAnimationFrame(gameLoop);
})
</script>

<template>
  <template v-for="item in game.items">
  <DisplayItem :item="item"></DisplayItem>
  </template>
</template>
