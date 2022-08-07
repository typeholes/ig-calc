<script setup lang="ts">
import { state as appState } from './uiUtil';

import AToggle from './qDefaulted/AToggle.vue';
</script>

<template>
  <q-dialog v-model="appState.showGeneralOptions" position="bottom" seamless full-width>
    <q-card>
      <q-card-actions align="right">
        <a-toggle
          v-model="appState.showHiddenExpressions"
          label="Show Hidden Expressions"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
