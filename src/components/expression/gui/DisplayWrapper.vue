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

interface Props {
  name: string;
  type: EnvTypeTag;
}

const props = defineProps<Props>();

const env = appState.env[props.type];
const graphState = env.getState(props.name);

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
  <div class="cols GraphExpr lastSmall" v-if="name !== 'time'">
    <div class="rows">
      <div class="cols wrap">
        <span v-if="!props.name.startsWith('anon:') && props.name !== '__tmp'">
          {{ props.name }}
        </span>
        <a-toggle v-model="graphState.showGraph" :id="`show:${name}`" />
        <input
          class="colorPicker"
          type="color"
          v-model="graphState.color"
          :id="`color:${name}`"
        />
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

<style scoped>
.GraphExpr {
  border: 1px solid bisque;
  border-radius: 4px;
}

.menuButton {
  background-color: rgb(89, 92, 96);
  padding: 0 1px 0;
}

.menuButton:disabled {
  background-color: rgb(109, 92, 96);
}

:deep(mjx-container) {
  background: none;
  top: 1px;
}

.tex {
  overflow: auto;
  align-self: center;
  width: 100%;
  background-color: rgb(11, 37, 37);
}

.gridCheck {
  width: 15px;
  align-self: center;
}

.imported {
  background-color: rgb(43, 51, 36);
}

button:disabled {
  background-color: rgb(59, 20, 20);
}

fullRow {
  flex: 99 0 auto;
}

.rightward {
  margin-left: auto;
}

.sliderCap {
  /* text-decoration: underline #445e00; */
  width: max-content;
  margin-top: 5px;
  padding: 0px 4px;
  border: 1px solid #595958;
  border-radius: 10px;
}

.sliderCap.left {
  left: 90%;
  /* top: -15px; */
  position: absolute;
}

.sliderCap.right {
  right: 90%;
  /* top: -15px; */
  position: absolute;
}

input:invalid {
  background-color: #550000;
}
</style>
