<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';
import { EnvExpr } from '../../../js/env/EnvExpr';
import AInput from 'src/components/qDefaulted/AInput.vue';
import SlotPicker from 'src/components/SlotPicker.vue';
import {
  state as saveState,
  currentSaveIsLibrary,
} from 'src/components/SaveWidget';
import { defined } from 'src/js/util';
import ExpressionDetail from './ExpressionDetail.vue';

interface Props {
  name: string;
  update: () => void;
}

const props = defineProps<Props>();
let graphState = saveState.currentEnv.expression.getState(props.name);

const state = reactive({
  expr: graphState.value.expr,
  errorMsg: graphState.value.error,
  vars: graphState.value.vars,
  showDetail: false,
});

function updateExpr(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    const expr = EnvExpr(event.target.value);
    if (defined(expr.node)) {
      state.vars = expr.vars;
      saveState.currentEnv.expression.set(props.name, expr);
      props.update();
    }
  }
}

function syncGraphState() {
  graphState = saveState.currentEnv.expression.getState(props.name);
  state.errorMsg = graphState.value.error;
  state.expr = graphState.value.expr;
  state.vars = graphState.value.vars;
}

const active = ref('a');

function showDetail() {
  state.showDetail = !state.showDetail;
}

watch(
  () => state.showDetail,
  () => nextTick(props.update)
);
</script>

<template>
  <div class="col">
    <q-dialog v-model="state.showDetail">
      <expression-detail :name="props.name" :update="props.update" />
    </q-dialog>

    <span class="text-red"> {{ state.errorMsg }} </span>
    <q-btn
      icon="info"
      dense
      style="position: absolute; top: -3px; z-index: 11111"
      @click="showDetail"
    />
    <slot-picker v-model="active" :names="['a', 'b']" static>
      <template #a>
        <q-scroll-area style="height: 8vh; width: 100%" visible>
          <span class="tex" :id="'tex_' + props.name"> </span>
        </q-scroll-area>
      </template>
      <template #b>
        <div style="width: 50vw">
          <a-input
            v-model="state.expr"
            @input="updateExpr"
            @change="syncGraphState"
            class="bg-transparent-dark"
            borderless
            input-class="q-pl-sm"
            v-if="!currentSaveIsLibrary"
          />
        </div>
      </template>
    </slot-picker>
  </div>
</template>
