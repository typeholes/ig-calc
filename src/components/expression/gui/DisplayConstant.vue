<script setup lang="ts">
import { reactive, ref } from 'vue';
import SlotPicker from 'src/components/SlotPicker.vue';
import ASlider from 'src/components/qDefaulted/ASlider.vue';
import {
  state as saveState,
  currentSaveIsLibrary,
} from 'src/components/SaveWidget.js';
import { isValidNumber } from 'src/js/function-plot/utils';
import { defined, isNumber } from 'src/js/util';

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();

const state = reactive({
  value: saveState.currentEnv.constant.get(props.name) ?? 0,
});

function updateValueString(value: string | number | null) {
  if (!defined(value)) {
    return;
  }

  if (isNumber(value)) {
    updateValue(value);
    return;
  }

  const num = parseFloat(value);
  if (isValidNumber(num)) {
    updateValue(num);
  }
}

function updateValue(value: number) {
  if (state.value !== value) {
    state.value = value;
  }

  saveState.currentEnv.constant.set(props.name, value);
  props.update();
}

function increment() {
  state.value++;
  updateValue(state.value);
}

function decrement() {
  state.value--;
  updateValue(state.value);
}

const active = ref('a');
</script>

<template>
  <div class="fullRow" label="">
    <slot-picker v-model="active" :names="['a', 'b', 'c']" include-active>
      <template #a>
        <a-slider
          class="slider"
          @update:model-value="updateValue"
          v-model="state.value"
          :min="-10"
          :max="10"
          label-always
          :disable="currentSaveIsLibrary"
        />
      </template>
      <template #b>
        <q-input
          type="number"
          :model-value="state.value"
          :disable="currentSaveIsLibrary"
          @update:model-value="updateValueString"
        />
      </template>
      <template #c>
        <q-btn
          v-touch-repeat:0:100.mouse.enter.space="decrement"
          color="primary"
          push
          round
          class="q-mr-sm"
          icon="remove"
          :disable="currentSaveIsLibrary"
        />

        <q-btn
          v-touch-repeat:0:1000.mouse.enter.space="decrement"
          color="secondary"
          push
          round
          icon="remove"
          :disable="currentSaveIsLibrary"
        />

        <span class="q-mx-md">
          {{ state.value }}
        </span>

        <q-btn
          v-touch-repeat:0:1000.mouse.enter.space="increment"
          color="secondary"
          push
          round
          class="q-mr-sm"
          icon="add"
          :disable="currentSaveIsLibrary"
        />

        <q-btn
          v-touch-repeat:0:100.mouse.enter.space="increment"
          color="primary"
          push
          round
          icon="add"
          :disable="currentSaveIsLibrary"
        />
      </template>
    </slot-picker>
  </div>
</template>

<style scoped>
.slider {
  padding-top: 15px;
  padding-bottom: 2px;
}
</style>
