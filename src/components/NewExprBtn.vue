<script setup lang="ts">
import { nextTick, ref } from 'vue';
import NewExpression from './NewExpression.vue';
import { currentSaveIsLibrary } from './SaveWidget';

const fabPos = ref([300, 5]);
const draggingFab = ref(false);

function focusExpr() {
  nextTick(() => {
    const el = document.getElementById('newExprInput');
    el?.focus();
  });
}

//@ts-expect-error unknown type for quasar drag event
function moveFab(ev) {
  draggingFab.value = ev.isFirst !== true && ev.isFinal !== true;

  fabPos.value = [fabPos.value[0] + ev.delta.x, fabPos.value[1] - ev.delta.y];
}
</script>

<template>
  <q-page-sticky position="bottom-left" :offset="fabPos" v-if="!currentSaveIsLibrary">
    <q-fab
      icon="add"
      color="accent"
      :disable="draggingFab"
      v-touch-pan.prevent.mouse="moveFab"
      label-class="newExprBtn"
      glassy
      direction="up"
      @show="focusExpr"
    >
      <q-fab-action
      @click="(e: Event) => e.stopPropagation()"
      >
        <template #default>
          <new-expression />
        </template>
      </q-fab-action>
    </q-fab>
  </q-page-sticky>
</template>
