<script setup lang="ts">
import { computed } from 'vue';
import { addTexElement, typeset } from '../../../js/typeset';
import { reactive, onMounted, onUpdated, } from 'vue';
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
import { colors as qcolor } from 'quasar';

import {
  matColorLens,
  matMenu,
  matDelete,
  matFileCopy,
  matShare,
} from '@quasar/extras/material-icons';

import { saveList, load, state as saveState } from 'src/components/SaveWidget';
import { SaveId, saveTypes as allSaveTypes } from 'src/js/SaveManager';

interface Props {
  name: string;
}

const props = defineProps<Props>();
const type = saveState.currentEnv.getType(props.name);

const saveTypes = allSaveTypes.filter((x) => x !== 'library');

const show = computed(
  () =>
    appState.showHiddenExpressions || !saveState.currentEnv.items.get(props.name)?.hidden
);

const state = reactive({
  showMenu: false,
});

function remove() {
  saveState.currentEnv[type].delete(props.name);
}

function getTex() {
  const value = saveState.currentEnv[type].get(props.name);
  return defined(value)
    ? // @ts-expect-error U2I
      saveState.currentEnv[type].toTex(props.name, value)
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
  if (type === 'constant') {
    const value: number = saveState.currentEnv.constant.get(props.name)!;
    tgt.constant.set(props.name, value);
  } else if (type === 'animated') {
    const value: Animation = saveState.currentEnv.animated.get(props.name)!;
    tgt.animated.set(
      props.name,
      Animation(value.fnName, value.from, value.to, value.period)
    );
  } else if (type === 'expression') {
    const value: EnvExpr = saveState.currentEnv.expression.get(props.name)!;
    tgt.expression.set(props.name, EnvExpr(value.expr));
  }

  const tgtState = tgt[type].getState(props.name);
  if (defined(tgtState)) {
    tgtState.color = saveState.currentEnv[type].getState(props.name).color;
    tgtState.description = saveState.currentEnv[type].getState(props.name).description;
    tgtState.hidden = saveState.currentEnv[type].getState(props.name).hidden;
    tgtState.showGraph = saveState.currentEnv[type].getState(props.name).showGraph;
    tgtState.showValue = saveState.currentEnv[type].getState(props.name).showValue;
  }
}

function borderColor(color: string) {
  const lumens = qcolor.luminosity(color);
  if (lumens > .05) { return qcolor.lighten(color, -50) }

  const { h, v } = qcolor.rgbToHsv(qcolor.textToRgb(color));
  return qcolor.rgbToHex(qcolor.hsvToRgb({ h, s: 100, v: 100 }));

}

onMounted(refreshTex);
onUpdated(refreshTex);
</script>

<template>
  <div class="cols GraphExpr lastSmall" v-if="show">
    <div class="rows">
    <div class="q-mini-drawer-only">
        <a-toggle class="graphColored" v-model="saveState.currentEnv[type].getState(props.name).showGraph" :id="`show:${name}`" >
        <q-menu context-menu>
          <a-color no-header v-model="saveState.currentEnv[type].getState(props.name).color" :id="`color:${name}`" />
        </q-menu>
        </a-toggle>
        <span v-if="!props.name.startsWith('anon:') && props.name !== '__tmp'">
          {{ props.name }}
        </span>
    </div>
      <div class="cols wrap q-mini-drawer-hide">
        <span v-if="!props.name.startsWith('anon:') && props.name !== '__tmp'">
          {{ props.name }}
        </span>
        <a-toggle v-model="saveState.currentEnv[type].getState(props.name).showGraph" :id="`show:${name}`" />
        <a-btn-dropdown
          :dropdown-icon="matColorLens"
          label="&nbsp'&nbsp;&nbsp;"
          class="color"
        >
          <a-color no-header v-model="saveState.currentEnv[type].getState(props.name).color" :id="`color:${name}`" />
        </a-btn-dropdown>
      </div>
      <template v-if="appState.exprBarExpanded">
        <q-tab-panels :model-value="type" class="q-mini-drawer-hide">
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
        <div class="cols q-mini-drawer-hide" v-if="saveState.currentEnv[type].getState(props.name).description">
          <span class="fullRow">{{ saveState.currentEnv[type].getState(props.name).description }}</span>
        </div>
      </template>
    </div>
    <div class="rows q-mini-drawer-hide" v-if="appState.exprBarExpanded">
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
  background-color: v-bind('saveState.currentEnv[type].getState(props.name).color + "88"');
}
.color .q-icon {
  background-color: black !important;
  border-radius: 100px;
}

.graphColored .q-toggle__thumb {
  color: v-bind('saveState.currentEnv[type].getState(props.name).color');
  /* border: 1px solid v-bind('borderColor(saveState.currentEnv[type].getState(props.name).color)'); */
  border-radius: 100%;
  box-shadow: 1px 1px 1px 1px v-bind('borderColor(saveState.currentEnv[type].getState(props.name).color)')
}

.graphColored .q-toggle__track {
  color: v-bind('saveState.currentEnv[type].getState(props.name).color + "CC"');
  /* border: 1px solid v-bind('borderColor(saveState.currentEnv[type].getState(props.name).color)'); */
  box-shadow: 1px 1px 1px 1px v-bind('borderColor(saveState.currentEnv[type].getState(props.name).color)')
}

.q-toggle__thumb {
  border-radius: 100%;
  box-shadow: 1px 1px 1px 1px teal;
}

.q-toggle__track {
  box-shadow: 1px 1px 1px 1px teal;
}
</style>
