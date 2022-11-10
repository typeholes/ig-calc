<script setup lang="ts">
import { defineProps } from 'vue';
import { SaveId } from '../js/SaveManager';

import AExpansion from 'src/components/qDefaulted/AExpansion.vue';
import ABtn from './qDefaulted/ABtn.vue';

import {
  matShare as iShare,
  matContentCopy as iCopy,
  matSave as iSave,
  matFolderOpen as iOpen,
  matDelete as iDelete,
} from '@quasar/extras/material-icons';

// import {
//   ionFolderOpen as iOpen,
//   ionSave as iSave,
//   ionShare as iShare,
//   ionCopy as iCopy,
// } from '@quasar/extras/ionicons-v6'

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
  deleteSave,
} from './SaveWidget';
import { defined } from 'src/js/util';

interface Props {
  id: SaveId;
  isCurrent: boolean;
  description: string;
}

const deleted = () => defined(state.deletedSaves[props.id.type][props.id.name]);

// const dirty = computed(() => {
//   const dirty = environments.get(props.id)?.dirty;
//   return dirty;
// });

const props = defineProps<Props>();

</script>

<template>
  <q-item :active="isCurrent" active-class="bg-primary text-white">
    <q-item-section thumbnail top >
      <a-btn
        :icon="iSave"
        color="warning"
        v-if="id.type !== 'library' && environments.get(props.id)?.dirty"
        @click="save(id, state.saveMetaData[id.type][id.name])"
      />
    </q-item-section>

    <a-expansion
      :header-style="{
        backgroundColor: deleted() ? '#C1001588' : 'transparent',
      }"
        class="col"
    >
      <template #header>
        <q-item-section>{{ id.name }} </q-item-section>
        <q-item-section side>
          <div>
            <a-btn
              :icon="iOpen"
              color="primary"
              v-if="!isCurrent"
              @click="(e: Event) => {
  e.stopPropagation(); selectSave(id)
}"
            />
          </div>
        </q-item-section>
      </template>
      <template #default>
      <div class="rows">
        <div class="cols" :class="{ lastSmall: !deleted() }">
          <template v-if="deleted()">
            <a-btn
              color="primary"
              @click="restoreDeletedSave(id)"
              label="Restore"
            />
            <a-btn
              color="negative"
              @click="
                {
                  purgeDeletedSave(id);
                  unselectSave();
                }
              "
              label="Purge"
            />
          </template>
          <template v-else>
            <a-btn color="primary" :icon="iCopy" @click="copy(id)" />
            <a-btn color="primary" @click="share(id)" :icon="iShare" />
            <a-btn color="negative" @click="deleteSave(id)" :icon="iDelete" />
          </template>
        </div>
        <div class="fullRow">
          {{ description }}
        </div>
      </div>
      </template>
    </a-expansion>
  </q-item>
</template>
