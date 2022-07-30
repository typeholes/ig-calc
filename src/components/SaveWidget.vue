<script setup lang="ts">
import { onMounted } from 'vue';
import {
  writeSave,
  saveTypes,
  SaveId,
  DefaultSaveId,
  isSaveType,
  setStorageKey,
} from '../js/SaveManager';
import { defined } from '../js/util';
import { state as appState } from './uiUtil';
import SaveEntry from './SaveEntry.vue';

import { decompressFromEncodedURIComponent } from 'lz-string';

import { notBlank } from '../js/function-plot/utils';
import { getActions } from '../js/actions';

import AExpansion from './qDefaulted/AExpansion.vue';
import {
  saveList,
  baseUrl,
  load,
  selectSave,
  state,
  restoreAllDeletedSaves,
  purgeAllDeletedSaves,
  create,
  cancel,
} from './SaveWidget';

onMounted(() => {
  const search = window.location.search.slice(1);
  const params = new URLSearchParams(search);

  let storageKey = params.get('StorageKey') ?? '';
  if (params.has('actions')) {
    const actionsKey = params.get('actions');
    const actionCount = params.has('actionCnt')
      ? parseInt(params.get('actionCnt')!)
      : undefined;
    if (defined(actionsKey)) {
      getActions(actionsKey, actionCount);
    }
  }
  if (params.has('StorageKey')) {
    state.saveMetaData = setStorageKey(storageKey);
  }
  if (params.has('saveType') && params.has('saveName')) {
    const saveType = params.get('saveType');
    const saveName = params.get('saveName');
    if (isSaveType(saveType) && notBlank(saveName)) {
      const saveId = SaveId(saveType, saveName);
      load(saveId);
      return;
    }
  }
  if (params.has('shared')) {
    const shareStr = params.get('shared') ?? '';
    if (shareStr === '') {
      load(DefaultSaveId);
      return;
    }
    const uncompressed = decompressFromEncodedURIComponent(shareStr) ?? '';
    const saveObj = JSON.parse(uncompressed) as {
      name: string;
      description: string;
      save: string;
    };

    const newSaveId = SaveId('shared', saveObj.name);
    writeSave(state.saveMetaData, newSaveId, saveObj.description, saveObj.save);
    load(newSaveId);
    selectSave(newSaveId);
    appState.saveEditable = true;
    const keyParam = storageKey === '' ? '' : `&StorageKey=${storageKey}`;
    window.location.href =
      baseUrl() + `?saveType=shared&saveName=${saveObj.name}${keyParam}`;
  } else {
    load(DefaultSaveId);
    appState.saveEditable = true;
  }
});

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
        class="bg-secondary"
        :key="saveType"
        v-for="saveType in saveTypes"
      >
        <a-expansion :label="saveType">
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
