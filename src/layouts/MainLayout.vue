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

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" elevated overlay>
      <ExpressionPane />
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" elevated overlay>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <q-tab-panels keep-alive v-model="panel">
        <q-tab-panel name="graph">
          <DisplayGraph />
        </q-tab-panel>
        <q-tab-panel name="grid">
          <DisplayData />
        </q-tab-panel>
        <q-tab-panel name="help">
          <div>help here</div>
        </q-tab-panel>
      </q-tab-panels>
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
import { onMounted, ref } from 'vue';
import DisplayGraph from 'src/components/DisplayGraph.vue';
import DisplayData from 'src/components/DisplayData.vue';
import { initUI, loadPersistantOptions } from 'src/components/uiUtil';
import ExpressionPane from 'src/components/ExpressionPane.vue';

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const panel = ref('graph');

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}
onMounted(() => {
  initUI();
  loadPersistantOptions();
});
</script>
