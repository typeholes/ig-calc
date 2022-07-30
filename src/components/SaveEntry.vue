<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { SaveId } from '../js/SaveManager';

import AExpansion from 'src/components/qDefaulted/AExpansion.vue';
import ABtn from './qDefaulted/ABtn.vue';

import {
  matShare,
  matContentCopy,
  matSave,
  matPreview,
} from '@quasar/extras/material-icons';
import {
  state,
  selectSave,
  environments,
  save,
  restoreDeletedSave,
  purgeDeletedSave,
  unselectSave,
  copy,
  share,
} from './SaveWidget';
import { defined } from 'src/js/util';

interface Props {
  id: SaveId;
  isCurrent: boolean;
  description: string;
}

const deleted = computed(() =>
  defined(state.deletedSaves[props.id.type][props.id.name])
);

// const dirty = computed(() => {
//   const dirty = environments.get(props.id)?.dirty;
//   return dirty;
// });

const props = defineProps<Props>();
</script>

<template>
  <q-item :active="isCurrent" active-class="bg-primary text-white">
    <q-item-section side>
      <a-btn
        :icon="matPreview"
        color="primary"
        v-if="!isCurrent"
        @click="selectSave(id)"
      />
      <a-btn
        :icon="matSave"
        color="warning"
        v-if="id.type !== 'library' && environments.get(props.id)?.dirty"
        @click="save(id, state.saveMetaData[id.type][id.name])"
      />
    </q-item-section>

    <q-item-section>
      <a-expansion :label="id.name">
        {{ description }}
      </a-expansion>
    </q-item-section>

    <q-item-section side class="cols inline" v-if="id.type !== 'library'">
      <template v-if="deleted">
        <a-btn
          color="primary"
          @click="restoreDeletedSave(id)"
          label="Restore"
        />
        <a-btn
          color="primary"
          @click="
            purgeDeletedSave(id);
            unselectSave();
          "
          label="Purge"
        />
      </template>
      <template v-else>
        <a-btn color="primary" @click="copy(id)" :icon="matContentCopy" />
        <a-btn color="primary" @click="share(id)" :icon="matShare" />
      </template>
    </q-item-section>
  </q-item>
</template>
