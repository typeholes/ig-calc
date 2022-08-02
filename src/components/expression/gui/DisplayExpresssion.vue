<script setup lang="ts">
import { reactive, } from 'vue';
import { defined } from '../../../js/util';
import { EnvExpr } from '../../../js/env/EnvExpr';
import AInput from 'src/components/qDefaulted/AInput.vue'
import { currentEnv } from 'src/components/SaveWidget';

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();
const env = currentEnv;
let graphState = env.value.expression.getState(props.name);



const state = reactive({
  error: defined(graphState.value.error),
});

function updateExpr(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    const expr = EnvExpr(event.target.value);
    env.value.expression.set(props.name, expr);
    if (!defined(expr.error)) {
      state.error = false;
    }
    props.update();
  }
}

function syncGraphState() {
  graphState = env.value.expression.getState(props.name);
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
