<script setup lang="ts">
import { state as saveState, rickRoll } from './SaveWidget';
import { SaveId } from 'src/js/SaveManager.js';
import { onMounted, onBeforeUpdate } from 'vue';
import { Interval } from 'src/js/function-plot/types';

const width = window.innerWidth;
const height = window.innerHeight;

interface Props {
  saveId: SaveId;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<Props>();

function drawGraph() {
  const graph = saveState.currentEnv.graph;
  graph.injectIntoTarget();
  graph.resetZoom(Interval(-10, 10), 0);
}

onMounted(drawGraph);
onBeforeUpdate(drawGraph);
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
