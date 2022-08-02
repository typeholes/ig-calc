<script setup lang="ts">
import ASelect from './qDefaulted/ASelect.vue';
import AToggle from './qDefaulted/AToggle.vue';
import DisplayWrapper from './expression/gui/DisplayWrapper.vue';
import NewExprBtn from './NewExprBtn.vue';

import { state } from './uiUtil';

import { defined } from 'src/js/util';
import { currentEnv } from './SaveWidget';

function getTypeTag(name: string) {
  return currentEnv.value.items.get(name)?.typeTag ?? 'constant';
}


</script>

<template>
  <div v-if="defined(currentEnv)">
    <div class="transparent">
      <div class="cols lastSmall">
        <div>
          <a-select
            id="exprComponent"
            label="Display expressions as"
            v-model="state.exprComponent"
            :options="[
              { value: 'expr', label: 'Expression' },
              { value: 'text', label: 'Plain Text' },
              { value: 'js', label: 'JavaScript (experimental)' },
            ]"
          />
        </div>
        <div>
          <a-toggle v-model="state.runTimer" label="Run Timer" />
        </div>
      </div>
      <q-scroll-area style="height:80vh" visible>
      <div class="expressions" :key="currentEnv.graphId + '-' + name" v-for="name in currentEnv.names">
        <display-wrapper :name="name" :type="getTypeTag(name)" />
      </div>
      </q-scroll-area>
      <div
        class="expressions"
        v-if="state.saveEditable && state.exprBarExpanded"
      >
        <new-expr-btn/>
      </div>
    </div>
  </div>
</template>
