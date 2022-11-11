<script setup lang="ts">
import { computed, reactive } from 'vue';

import ASelect from 'src/components/qDefaulted/ASelect.vue';
import { state as saveState, currentSaveIsLibrary } from '../../SaveWidget';
import { Parametric } from '../../../js/env/Parametric';

interface Props {
  name: string;
}

const props = defineProps<Props>();

const graphState = saveState.currentEnv.parametric.getState(props.name);

const options = computed(() =>
  saveState.currentEnv.order.filter((x: string) => x !== props.name)
);

const state = reactive({
  xName: graphState.value.xName,
  yName: graphState.value.yName,
});

function updateParametric() {
  graphState.xName = state.xName;
  graphState.yName = state.yName;

  saveState.currentEnv.parametric.set(
    props.name,
    Parametric(props.name, state.xName, state.yName)
  );
}
</script>

<template>
  <div class="cols lastSmall">
    <!-- v-if="appState.saveEditable"> -->
    <a-select
      v-model="state.xName"
      @update:model-value="updateParametric"
      :options="options"
      :disable="currentSaveIsLibrary"
    />
    <a-select
      v-model="state.yName"
      @update:model-value="updateParametric"
      :options="options"
      :disable="currentSaveIsLibrary"
    />
  </div>
</template>
