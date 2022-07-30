<script setup lang="ts">
import { addTexElement, typeset } from '../../../js/typeset';
import { reactive, onMounted, onUpdated } from 'vue';
import { state as appState } from 'components/uiUtil';
import { notBlank, defined } from '../../../js/util';
import AToggle from 'src/components/qDefaulted/AToggle.vue';
import { EnvTypeTag } from 'src/js/env/EnvType';
import DisplayAnimation from './DisplayAnimation.vue';
import DisplayConstant from './DisplayConstant.vue';
import DisplayExpression from './DisplayExpresssion.vue';
import AColor from 'src/components/qDefaulted/AColor.vue';
import ABtnDropdown from 'src/components/qDefaulted/ABtnDropdown.vue';

import { matColorLens } from '@quasar/extras/material-icons';

interface Props {
  name: string;
  type: EnvTypeTag;
}

const props = defineProps<Props>();

const env = appState.env[props.type];
const graphState = env.getState(props.name);

const show =
  appState.showHiddenExpressions || !appState.env.items.get(props.name)?.hidden;

const state = reactive({
  showMenu: false,
});

function remove() {
  env.delete(props.name);
}

function getTex() {
  const value = env.get(props.name);
  return defined(value)
    ? // @ts-expect-error U2I
      env.toTex(props.name, value)
    : `${props.name} not found`;
}

function refreshTex() {
  addTexElement('tex_' + props.name, getTex());
  typeset();
}

function update() {
  refreshTex();
}
function copyToCurrent() {
  //         addImportExpression(props.state);
}

onMounted(refreshTex);
onUpdated(refreshTex);
</script>

<template>
  <div class="cols GraphExpr lastSmall" v-if="show">
    <div class="rows">
      <div class="cols wrap">
        <span v-if="!props.name.startsWith('anon:') && props.name !== '__tmp'">
          {{ props.name }}
        </span>
        <a-toggle v-model="graphState.showGraph" :id="`show:${name}`" />
        <a-btn-dropdown
          :dropdown-icon="matColorLens"
          label="&nbsp'&nbsp;&nbsp;"
          class="color"
        >
          <a-color no-header v-model="graphState.color" :id="`color:${name}`" />
        </a-btn-dropdown>
      </div>
      <template v-if="appState.exprBarExpanded">
        <q-tab-panels :model-value="props.type">
          <q-tab-panel name="constant">
            <display-constant :name="props.name" :update="update" />
          </q-tab-panel>
          <q-tab-panel name="expression">
            <display-expression :name="props.name" :update="update" />
          </q-tab-panel>
          <q-tab-panel name="animated">
            <display-animation :name="props.name" :update="update" />
          </q-tab-panel>
        </q-tab-panels>
        <div class="cols">
          <span class="tex" :id="'tex_' + props.name"> </span>
        </div>
        <div class="cols" v-if="graphState.description">
          <span class="fullRow">{{ graphState.description }}</span>
        </div>
      </template>
    </div>
    <div class="rows" v-if="appState.exprBarExpanded">
      <button class="menuButton" @click="state.showMenu = !state.showMenu">
        &#9776;
      </button>
      <template v-if="state.showMenu && appState.saveEditable">
        <button
          class="menuButton"
          :disabled="notBlank(appState.newExpr) && props.name !== '__tmp'"
          @click="remove()"
        >
          Remove
        </button>
        <button class="menuButton" @click="copyToCurrent()">
          <!-- :disabled="isImported" -->
          Copy to current save
        </button>
        <!-- <button class="menuButton" @click="sonify()">Sonify</button> -->
      </template>
    </div>
  </div>
</template>

<style>
.color {
  background-color: v-bind('graphState.color + "88"');
}
.color .q-icon {
  background-color: black !important;
  border-radius: 100px;
}
</style>
