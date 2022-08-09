<script setup lang="ts">
import { rickRoll, state as saveState } from './SaveWidget';
import { onMounted } from 'vue';

const width = window.innerWidth;
const height = window.innerHeight;

onMounted(saveState.currentEnv.activate);
</script>

<template>
  <div>
    <div class="rick" style="z-index: 1" v-if="rickRoll.show">
      <iframe
        :width="width"
        :height="height"
        src="https://www.youtube.com/embed/klfT41uZniI?autoplay=1"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
    <div class="fullScreen" style="z-index: 2">
      <div id="graph"></div>
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
