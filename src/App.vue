<template>
  <router-view id="app" />
</template>

<script setup lang="ts">
import { initSaveWidget, initUI } from './components/SaveWidget.js';
import { onBeforeMount } from 'vue';

onBeforeMount(() => {
  initSaveWidget();
  initUI();
});
</script>
