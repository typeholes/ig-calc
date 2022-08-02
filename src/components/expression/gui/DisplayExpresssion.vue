<script setup lang="ts">
import { reactive } from 'vue';
import { defined } from '../../../js/util';
import { EnvExpr } from '../../../js/env/EnvExpr';
import AInput from 'src/components/qDefaulted/AInput.vue';
import { currentEnv } from 'src/components/SaveWidget';

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();
const env = currentEnv;
let graphState = env.value.expression.getState(props.name);

const state = reactive({
  expr: graphState.value.expr,
  errorMsg: graphState.value.error,
});

function updateExpr(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    const expr = EnvExpr(event.target.value);
    env.value.expression.set(props.name, expr);
    props.update();
  }
}

function syncGraphState() {
  graphState = env.value.expression.getState(props.name);
  state.errorMsg = graphState.value.error;
  state.expr = graphState.value.expr;
}
</script>

<template>
  <div class="rows">
    <span class="text-red"> {{ state.errorMsg }} </span>
    <div class="cursor-pointer">
      <span class="tex" :id="'tex_' + props.name"> </span>
      <q-popup-edit
        v-model="state.expr"
        v-slot="scope"
        self="top start"
        anchor="top right"
        touch-position
        @hide="syncGraphState"
      >
        <a-input
          style="margin-left: 7px"
          v-model="scope.value"
          @input="updateExpr"
        />
      </q-popup-edit>
    </div>
  </div>
</template>
