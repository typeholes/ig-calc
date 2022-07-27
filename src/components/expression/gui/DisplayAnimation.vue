<script setup lang="ts">
import { reactive } from 'vue';
import { state as appState } from 'components/uiUtil';
import { defined, assert } from '../../../js/util';
import { libraries } from '../../../js/libraryValues';
import { isValidNumber } from 'src/js/function-plot/utils';
import AInput from 'src/components/qDefaulted/AInput.vue';
import ASelect from 'src/components/qDefaulted/ASelect.vue';
import { Animation } from 'src/js/env/Animation';

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();

const graphState = appState.env.animated.getState(props.name);


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
  const fnName = state.fnName;
  const from = parseFloat(state.from);
  const to = parseFloat(state.to);
  const period = parseFloat(state.period);
  graphState.value.from = isValidNumber(from) ? from : 0;
  graphState.value.to = isValidNumber(to) ? to : 1;
  graphState.value.period = isValidNumber(period) ? period : 1;
  graphState.value.fnName = state.fnName;

  if (!defined(appState.env.expression.get(fnName))) {
    const fn = libraries.get('periodic')?.expression[fnName][0];
    assert(defined(fn), 'missing periodic function: ' + fnName);
    appState.env.expression.set(fnName, fn, { hidden: true });
  }
  appState.env.animated.set(props.name, graphState.value );
  props.update()
}
</script>

<template>
  <div class="cols lastSmall" v-if="appState.saveEditable">
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
