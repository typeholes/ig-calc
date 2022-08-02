<script setup lang="ts">
import { environments } from './SaveWidget';
import { state as saveState } from './SaveWidget';
import { SaveId } from 'src/js/SaveManager.js';
</script>

<template>
  <div class="fullScreen" v-for="id in environments.mappedKeys()" :key="SaveId.toString(id)">
    <div
      :id="environments.get(id)?.graphId"
      v-show="SaveId.eq(saveState.currentSave, id)"
    ></div>
  </div>
</template>

<style scoped>
.fullScreen {
  position:fixed;
  top: 0;
  left: 0;

}

</style>
