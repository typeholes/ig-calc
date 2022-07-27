<script setup lang="ts">
import { reactive, } from 'vue';
import { state as appState } from 'components/uiUtil';
import { defined } from '../../../js/util';
import { EnvExpr } from '../../../js/env/EnvExpr';
import AInput from 'src/components/qDefaulted/AInput.vue'

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();
let graphState = appState.env.expression.getState(props.name);



const state = reactive({
  error: defined(graphState.value.error),
});

function updateExpr(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    const expr = EnvExpr(event.target.value);
    appState.env.expression.set(props.name, expr);
    if (!defined(expr.error)) {
      state.error = false;
    }
    props.update();
  }
}

function syncGraphState() {
  graphState = appState.env.expression.getState(props.name);
  state.error = defined(graphState.value.error);
}
</script>

<template>
  <div>
    <a-input
      style="margin-left: 7px"
      v-model="graphState.value.expr"
      @input="updateExpr"
      @blur="syncGraphState"
    />
  </div>
</template>
