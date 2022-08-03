<script setup lang="ts">
import { environments } from './SaveWidget';
import { state as saveState, rickRoll } from './SaveWidget';
import { SaveId } from 'src/js/SaveManager.js';

const width = window.innerWidth;
const height = window.innerHeight;
</script>

<template>
  <div>
    <div class="rick" style="z-index: 1" v-if="rickRoll.show">
    <iframe :width="width" :height="height" src="https://www.youtube.com/embed/klfT41uZniI?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div
      class="fullScreen"
      style="z-index: 2"
      v-for="id in environments.mappedKeys()"
      :key="SaveId.toString(id)"
    >
      <div
        :id="environments.get(id)?.graphId"
        v-show="SaveId.eq(saveState.currentSave, id)"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.fullScreen {
  position: fixed;
  top: 0;
  left: 0;
}
.rick {
  position: fixed;
  top: 0;
  left: 400;
}
</style>
