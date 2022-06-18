<script setup lang="ts">
import { game, addGameVars } from "./game";
import EditItem from "./EditItem.vue";
import { onMounted } from "vue";

onMounted(() => {
    addGameVars();
})
</script>

<template>
  <template v-for="item in game.items">
  <EditItem :item="item"></EditItem>
  </template>
</template>
