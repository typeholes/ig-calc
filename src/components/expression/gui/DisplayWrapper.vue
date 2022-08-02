<script setup lang="ts">
import { addTexElement, typeset } from '../../../js/typeset';
import { reactive, onMounted, onUpdated, TriggerOpTypes } from 'vue';
import { state as appState } from 'components/uiUtil';
import { defined } from '../../../js/util';
import AToggle from 'src/components/qDefaulted/AToggle.vue';
import { EnvTypeTag } from 'src/js/env/EnvType';
import DisplayAnimation from './DisplayAnimation.vue';
import DisplayConstant from './DisplayConstant.vue';
import DisplayExpression from './DisplayExpresssion.vue';
import AColor from 'src/components/qDefaulted/AColor.vue';
import ABtnDropdown from 'src/components/qDefaulted/ABtnDropdown.vue';
import ABtn from 'src/components/qDefaulted/ABtn.vue';
import { Animation } from 'src/js/env/Animation';
import { EnvExpr } from 'src/js/env/EnvExpr';

import {
  matColorLens,
  matMenu,
  matDelete,
  matFileCopy,
  matShare,
} from '@quasar/extras/material-icons';

import { saveList, load, currentEnv } from 'src/components/SaveWidget';
import { SaveId, saveTypes as allSaveTypes } from 'src/js/SaveManager';
import { computed } from 'vue';
import { E } from 'app/dist/spa/assets/index.31cf09eb';
import { INSPECT_MAX_BYTES } from 'buffer';

interface Props {
  name: string;
  type: EnvTypeTag;
}

const props = defineProps<Props>();

const saveTypes = allSaveTypes.filter((x) => x !== 'library');

const env = currentEnv;
const envItem = env.value[props.type];
const graphState = envItem.getState(props.name);

const show = computed(
  () =>
    appState.showHiddenExpressions || !env.value.items.get(props.name)?.hidden
);

const state = reactive({
  showMenu: false,
});

function remove() {
  envItem.delete(props.name);
}

function getTex() {
  const value = envItem.get(props.name);
  return defined(value)
    ? // @ts-expect-error U2I
      envItem.toTex(props.name, value)
    : `${props.name} not found`;
}

function refreshTex() {
  addTexElement('tex_' + props.name, getTex());
  typeset();
}

function update() {
  refreshTex();
}
function copyToSave(id: SaveId) {
  const tgt = load(id);
  if (props.type === 'constant') {
    const value: number = env.value.constant.get(props.name)!;
    tgt.constant.set(props.name, value);
  } else if (props.type === 'animated') {
    const value: Animation = env.value.animated.get(props.name)!;
    tgt.animated.set(
      props.name,
      Animation(value.fnName, value.from, value.to, value.period)
    );
  } else if (props.type === 'expression') {
    const value: EnvExpr = env.value.expression.get(props.name)!;
    tgt.expression.set(props.name, EnvExpr(value.expr));
  }

  const tgtState = tgt[props.type].getState(props.name);
  if (defined(tgtState)) {
    tgtState.color = graphState.color;
    tgtState.description = graphState.description;
    tgtState.hidden = graphState.hidden;
    tgtState.showGraph = graphState.showGraph;
    tgtState.showValue = graphState.showValue;
  }
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
      <a-btn
        :icon="matMenu"
        text-color="primary"
        @click="state.showMenu = !state.showMenu"
      >
        <q-menu>
          <q-list>
            <q-item>
              <a-btn-dropdown
                :icon="matFileCopy"
                text-color="primary"
                menu-self="top start"
                menu-anchor="top right"
              >
                <q-list
                  separator
                  padding
                  class="bg-secondary"
                  :key="saveType"
                  v-for="saveType in saveTypes"
                >
                  <template
                    :key="id.name + '/' + id.name"
                    v-for="[id] of saveList(saveType)"
                  >
                    <q-item
                      ><a-btn
                        @click="copyToSave(id)"
                        :icon="saveType === 'shared' ? matShare : ''"
                        :label="id.name"
                        text-color="primary"
                    /></q-item>
                  </template>
                </q-list>
              </a-btn-dropdown>
            </q-item>
            <q-item>
              <a-btn
                :icon="matDelete"
                v-if="appState.saveEditable"
                @click="remove()"
                text-color="primary"
              />
            </q-item>
            <!-- <button class="menuButton" @click="sonify()">Sonify</button> -->
          </q-list>
        </q-menu>
      </a-btn>
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
