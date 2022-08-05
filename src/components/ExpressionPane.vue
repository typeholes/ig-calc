<script setup lang="ts">
import ASelect from './qDefaulted/ASelect.vue';
import AToggle from './qDefaulted/AToggle.vue';
import DisplayWrapper from './expression/gui/DisplayWrapper.vue';
import NewExprBtn from './NewExprBtn.vue';
import draggable from 'vuedraggable';

import { state as appState } from './uiUtil';

import { defined } from 'src/js/util';
import { computed, onUpdated } from 'vue';
import { state as saveState } from 'src/components/SaveWidget'

interface Props {
  order: string[];
}

onUpdated(() => console.log(props.order));

const order = computed( ()=> saveState.currentEnv.order)

const props = defineProps<Props>();
const currentEnv = saveState.currentEnv;

</script>

<template>
  <div v-if="defined(currentEnv)">
    <div class="transparent">
      <div class="cols lastSmall q-mini-drawer-hide">
        <div>
          <a-select
            id="exprComponent"
            label="Display expressions as"
            v-model="appState.exprComponent"
            :options="[
              { value: 'expr', label: 'Expression' },
              { value: 'text', label: 'Plain Text' },
              { value: 'js', label: 'JavaScript (experimental)' },
            ]"
          />
        </div>
        <div>
          <a-toggle v-model="saveState.runTimer" label="Run Timer" />
        </div>
      </div>
      <q-scroll-area style="height: 80vh" visible>
        <draggable
          :list="order"
          item-key="id"
          @change="saveState.currentEnv.dirty = true"
        >
          <template #item="{ element }">
            <display-wrapper :name="element"/>
          </template>
        </draggable>

        <!-- <div class="expressions" :key="currentEnv.graphId + '-' + name" v-for="name in ISet(currentEnv.names).sortBy( (name) => currentEnv.order.get(name))">
        <display-wrapper :name="name" :type="getTypeTag(name)" />
      </div> -->
      </q-scroll-area>
      <div
        class="expressions"
        v-if="appState.saveEditable && appState.exprBarExpanded"
      >
        <new-expr-btn />
      </div>
    </div>
  </div>
</template>
