<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated class="bg-transparent text-primary" height-hint="98">
      <q-toolbar class="bg-transparent">
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="bg-transparent" title="Docs"> </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      :mini="leftDrawerMini"
      side="left"
      elevated
      :width="width"
      :mini-width="120"
      behavior="desktop"
    >
    </q-drawer>

    <q-page-container>
      <q-page> <doc-view /> </q-page>
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

<script setup lang="ts">
import { ref } from 'vue';
import DocView from 'src/components/docs/DocView.vue';

const leftDrawerOpen = ref(false);
const leftDrawerMini = ref(false);

const width = Math.max(window.innerWidth * 0.25, 300);

function toggleLeftDrawer() {
  // leftDrawerOpen.value = !leftDrawerOpen.value;
  leftDrawerOpen.value = true;
  leftDrawerMini.value = !leftDrawerMini.value;
}

</script>
