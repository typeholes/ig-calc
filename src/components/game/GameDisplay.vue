<script setup lang="ts">
   import { addGameVars, game } from './game';
   import DisplayItem from './DisplayItem.vue';
   import { onMounted } from 'vue';
   import { initUI } from '../uiUtil';

   onMounted(() => {
      addGameVars();
      initUI();
   });
</script>

<template>
   <template v-for="item in game.items">
      <DisplayItem :item="item"></DisplayItem>
   </template>
</template>
