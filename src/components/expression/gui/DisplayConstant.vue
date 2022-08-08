<script setup lang="ts">
import { reactive, } from 'vue';
import ASlider from 'src/components/qDefaulted/ASlider.vue';
import { state as saveState, currentSaveIsLibrary } from 'src/components/SaveWidget.js';

var x = 1;
console.log(x);

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();

const state = reactive({
  value: saveState.currentEnv.constant.get(props.name)  ?? 0
});

function updateValue(value: number) {
  saveState.currentEnv.constant.set(props.name, value);
  props.update();
}
</script>

<template>
  <div class="fullRow" label="">
    <a-slider
      class="slider"
      @update:model-value="updateValue"
      v-model="state.value"
      :min="-10"
      :max="10"
      label-always
      :disabled="currentSaveIsLibrary"
    />
  </div>
</template>

<style scoped>
.slider {
  padding-top: 15px;
  padding-bottom: 2px;
}
</style>
