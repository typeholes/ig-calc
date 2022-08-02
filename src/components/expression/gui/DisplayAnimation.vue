<script setup lang="ts">
import { reactive } from 'vue';
import { isValidNumber } from 'src/js/function-plot/utils';
import AInput from 'src/components/qDefaulted/AInput.vue';
import ASelect from 'src/components/qDefaulted/ASelect.vue';
import { currentEnv } from 'src/components/SaveWidget';

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();

const env = currentEnv;
const graphState = env.value.animated.getState(props.name);


const state = reactive({
  from: graphState.value.from.toString(),
  to: graphState.value.to.toString(),
  period: graphState.value.period.toString(),
  fnName: graphState.value.fnName,
});

function validateNumber(s: string) {
  return isValidNumber(parseFloat(s)) || 'Invalid number';
}

function updateAnimation() {
  const from = parseFloat(state.from);
  const to = parseFloat(state.to);
  const period = parseFloat(state.period);
  graphState.value.from = isValidNumber(from) ? from : 0;
  graphState.value.to = isValidNumber(to) ? to : 1;
  graphState.value.period = isValidNumber(period) ? period : 1;
  graphState.value.fnName = state.fnName;

  env.value.animated.set(props.name, graphState.value );
  props.update()
}
</script>

<template>
  <div class="cols lastSmall">
    <!-- v-if="appState.saveEditable"> -->
    <a-input
      label="From"
      type="number"
      v-model="state.from"
      @change="updateAnimation"
      :rules="[validateNumber]"
      dense
    />
    <a-input
      label="to"
      type="number"
      v-model="state.to"
      @change="updateAnimation"
      :rules="[validateNumber]"
    />
    <a-input
      label="Period"
      type="number"
      v-model="state.period"
      @change="updateAnimation"
      :rules="[validateNumber]"
    />
    <!-- TODO drive this from the periodic library -->
    <a-select
      v-model="state.fnName"
      @update:model-value="updateAnimation"
      :options="['sinal', 'zigZag']"
    />
  </div>
</template>
