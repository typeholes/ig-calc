<script setup lang="ts">
import {
  saveTypes,
  SaveId,
} from '../js/SaveManager';
import { defined } from '../js/util';
import SaveEntry from './SaveEntry.vue';



import AExpansion from './qDefaulted/AExpansion.vue';
import {
  saveList,
  state,
  restoreAllDeletedSaves,
  purgeAllDeletedSaves,
  create,
  cancel,
} from './SaveWidget';

// onMounted( () => initSaveWidget() )
/*
function leftIcon(id: SaveId) {
  if (appState.modified) {
    if (SaveId.eq(id, state.currentSave)) {
      return {
        icon: matSave,
        color: 'primary',
        click: () =>
          save(
            state.currentSave,
            state.saveMetaData[state.currentSave.type][state.currentSave.name]
          ),
      };
    }
    return undefined;
  }

  if (SaveId.eq(id, state.selectedSave)) {
    return {
      icon: matCancel,
      color: 'primary',
      click: unselectSave
    };
  }

    return {
      icon: matPreview,
      color: 'primary',
      click: () => selectSave(id),
    };
}
*/
 </script>

<template>
  <!-- eslint-disable vue/no-unused-vars -->
  <!-- eslint-disable vue/no-template-shadow -->
  <!-- o-collapse component trigger slot causes too many type erors-->
  <div class="outer">
    <div class="saveWidget">
      <q-list
        separator
        padding
        class="bg-secondary "
        :key="saveType"
        v-for="saveType in saveTypes"
      >
        <a-expansion header-class="col" :label="saveType" >
          <template
            :key="id.name + '/' + id.name"
            v-for="[id, { description, deleted }] of saveList(saveType)"
          >
            <save-entry
              :id="id"
              :description="description"
              :is-current="SaveId.eq(id, state.currentSave)"
            />
          </template>
        </a-expansion>

        <a-expansion
          style="margin-left: auto"
          v-if="state.hasDeletedSaves"
          label="Deleted Save Options"
        >
          <button @click="restoreAllDeletedSaves()">Restore All</button>
          <button @click="purgeAllDeletedSaves()">Purge All</button>
          <div style="display: flex">
            <span>Show</span
            ><input type="checkbox" v-model="state.showDeletedSaves" />
          </div>
        </a-expansion>
      </q-list>
    </div>
    <template v-if="defined(state.copying)">
      <span style="grid-column: 1/8"> <hr /></span>
      <span class="name"><input v-model="state.newName" /></span>
      <span class="descr"><input v-model="state.newDescr" /></span>
      <button class="copy" @click="create()">create</button>
      <button class="share" @click="cancel()">cancel</button>
    </template>
  </div>
  <div style="grid-row: 5">
    {{ state.shareString }}
  </div>
</template>

<style></style>
