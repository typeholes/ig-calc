<script setup lang="ts">
import NewExpression from './NewExpression.vue';
import ASelect from './qDefaulted/ASelect.vue';
import AToggle from './qDefaulted/AToggle.vue';
import DisplayWrapper from './expression/gui/DisplayWrapper.vue';

import { state } from './uiUtil';

function getTypeTag(name: string) {
  return state.env.items.get(name)?.typeTag ?? 'constant';
}


</script>

<template>
  <div class="ig-calc">
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
      <div class="expressions" :key="name" v-for="name in state.env.names">
        <display-wrapper :name="name" :type="getTypeTag(name)" />
      </div>
      </q-scroll-area>
      <div
        class="expressions"
        v-if="state.saveEditable && state.exprBarExpanded"
      >
        <NewExpression></NewExpression>
      </div>
    </div>
  </div>
</template>
