<script setup lang="ts">
import AToggle from './qDefaulted/AToggle.vue';
import DisplayWrapper from './expression/gui/DisplayWrapper.vue';
import NewExpression from './NewExpression.vue';

import draggable from 'vuedraggable';

import { state as appState } from './uiUtil';

import { defined } from 'src/js/util';
import { computed } from 'vue';
import { state as saveState } from 'src/components/SaveWidget';


const order = computed(() => saveState.currentEnv.order);

const currentEnv = saveState.currentEnv;
</script>

<template>
  <div v-if="defined(currentEnv)">
      <div class="transparent ">
    <div class="col q-gutter-sm">
        <div class="row q-mini-drawer-hide">
          <q-btn
            icon="add"
            color="primary"
            glassy
            direction="up"
            id="NewExprBtn"
            dense
          >
            <q-popup-proxy>
              <new-expression />
            </q-popup-proxy>
          </q-btn>
          <q-space />
          <div style="width: 10em">
            <q-select
              dense
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
          <q-space />

          <div>
            <a-toggle v-model="saveState.runTimer" label="Run Timer" />
          </div>
        </div>
        <div class="col">
          <q-scroll-area style="height: 80vh" visible>
            <draggable
              :list="order"
              item-key="id"
              @change="saveState.currentEnv.dirty = true"
              class="col"
            >
              <template #item="{ element }">
                <display-wrapper :name="element" />
              </template>
            </draggable>

            <!-- <div class="expressions" :key="currentEnv.graphId + '-' + name" v-for="name in ISet(currentEnv.names).sortBy( (name) => currentEnv.order.get(name))">
        <display-wrapper :name="name" :type="getTypeTag(name)" />
      </div> -->
          </q-scroll-area>
        </div>
      </div>
    </div>
  </div>
</template>
