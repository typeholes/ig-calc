<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated class="bg-transparent text-primary" height-hint="98">
      <q-toolbar class="bg-transparent">
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="bg-transparent">
          <q-tabs align="center" v-model="panel">
            <q-tab name="graph" label="Graph" />
            <q-tab name="grid" label="Grid" />
            <q-tab name="help" label="Help" />
          </q-tabs>
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      :mini="leftDrawerMini"
      side="left"
      elevated
      overlay
      :width="width"
      :mini-width="120"
    >
      <ExpressionPane :order="saveState.currentEnv.order" />
    </q-drawer>

    <q-drawer
      show-if-above
      v-model="rightDrawerOpen"
      side="right"
      elevated
      overlay
    >
    <div class="column">
      <SaveWidget />
            <q-btn
              @click="toggleOptions();"
              class="q-ml-auto"
              :icon="matSettings"
            />
        <general-options />
        </div>
    </q-drawer>

    <q-page-container>
      <q-page>
        <!-- <new-expr-btn /> -->
        <q-tab-panels keep-alive v-model="panel">
          <q-tab-panel name="graph">
            <DisplayGraph :saveId="saveState.currentSave" />
          </q-tab-panel>
          <q-tab-panel name="grid">
            <DisplayData />
          </q-tab-panel>
          <q-tab-panel name="help">
            <div>help here</div>
          </q-tab-panel>
        </q-tab-panels>
      </q-page>
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <!-- <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          <div>Title</div>
        </q-toolbar-title>
      </q-toolbar> -->
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import DisplayGraph from 'src/components/DisplayGraph.vue';
import DisplayData from 'src/components/DisplayData.vue';
import ExpressionPane from 'src/components/ExpressionPane.vue';
import SaveWidget from 'src/components/SaveWidget.vue';
import { state as saveState } from 'src/components/SaveWidget';
import ABtn from 'src/components/qDefaulted/ABtn.vue';
import { state as appState } from 'src/components/uiUtil';
import GeneralOptions from 'src/components/GeneralOptions.vue';
import { matSettings } from '@quasar/extras/material-icons';

const leftDrawerOpen = ref(false);
const leftDrawerMini = ref(false);
const rightDrawerOpen = ref(false);
const panel = ref('graph');

const width = Math.max(window.innerWidth * 0.25, 300);

function toggleLeftDrawer() {
  // leftDrawerOpen.value = !leftDrawerOpen.value;
  leftDrawerOpen.value = true;
  leftDrawerMini.value = !leftDrawerMini.value;
}

function toggleOptions() {
  appState.showGeneralOptions = !appState.showGeneralOptions;
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}
</script>
