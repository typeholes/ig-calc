<script setup lang="ts">
import { computed, nextTick } from "vue";
import HelpScreen from "./HelpScreen.vue";
import GraphOptions from "./GraphOptions.vue";
import Vsplitter from "./Vsplitter.vue";
import Hsplitter from "./Hsplitter.vue";


import { Map as IMap } from "immutable";
import { onMounted } from "vue";
import GraphExpr from "./GraphExpr.vue";
import {
ExprEnv,
  getNodeName, SaveRep,
} from "./expressions";
import { defined } from "../js/util";
import {
  getExpressionUiState,
} from "./expressionUiState";
import SaveWidget from "./SaveWidget.vue";
import { globalTheme } from "../js/theme";

import { knownSymbols } from "../js/math/symbols";

import { FunctionPlotData } from "../js/function-plot/FunctionPlotDatum";

import { graph, initGraph, state, displayComponents, checkNewExpr, addToEnv, removeExpr, loadEnv, init, systemFnNames, } from "./uiUtil";
import GeneralOptions from "./GeneralOptions.vue";
import { SaveId } from "../js/SaveManager";

onMounted(() => {
  init();
});

const theme = globalTheme ?? {};

function showError(e: Error) {
  state.error = e.message + " " + e.stack;
}

function onSave() {
  state.modified = false;
}


function help() {
  state.showGraphOptions = false;
  state.showHelp = !state.showHelp;
}

function graphOptions() {
  state.showHelp = false;
  state.showGraphOptions = !state.showGraphOptions;
  state.displayComponent = 'DisplayGraph'
}

function dataOptions() {
  state.showHelp = false;
  state.showGraphOptions = !state.showGraphOptions;
  state.displayComponent = 'DisplayData'
}


function generalOptions() {
  state.showHelp = false;
  state.showGeneralOptions = !state.showGeneralOptions;
}

function showMenu() {
  state.showMenuBar = !state.showMenuBar;
}

function exprNames() {
  const names = Array.from(state.env.keys());
  return names.filter( (name) => graph.options.data[name]?.show)
}

const previewingSave = computed(() => !SaveId.eq(state.currentSave, state.selectedSave));

function selectSave(args: { saveRep: SaveRep }) {
  refresh(args);
}

function unselectSave() {
}

function refresh(args: { saveRep: SaveRep }) {
  state.loading = true;
  const holdGraphOptions = state.showGraphOptions;
  state.showGraphOptions = false;
  loadEnv(args);
  init();
  state.loading = false;
  nextTick(function () {
    state.showGraphOptions = holdGraphOptions
  });
}

function importExpression(name: string) {
  alert('not implemented');
}

function editExpression(name: string) {
  state.newExpr = state.env.get(name)?.node.toString() ?? "";
  checkNewExpr();
  if (name.startsWith('anon:')) {
    state.env = state.env.delete(name); // TODO: should we delete anonymous expressions on edit?
  }
}


</script>

<template>
  <div class="ig-calc">
    <div class="menuBar">
    <button class="menuButton" @click="showMenu">&#9776</button>
    <div v-if="state.showMenuBar"><br>
    <div><button class="menuButton" @click="help">?</button></div>
    <div><br><button class="menuButton" @click="graphOptions">&#128200</button></div>
    <div><br><button class="menuButton" @click="dataOptions">&#8862</button></div>
    <div><br><button class="menuButton" @click="generalOptions">&#9881</button></div>
    </div>
    </div>
    <Hsplitter
      top-col-spec="1fr"
      bottom-col-spec="1fr"
      v-model:collapsed="state.hideBottom"
    >
      <template #top>
        <Vsplitter
          left-col-spec="1fr"
          right-col-spec="1fr"
          v-model:collapsed="state.hideLeft"
        >
          <template #left>
            <HelpScreen
              class="LeftPopover"
              v-if="state.showHelp"
            ></HelpScreen>
            <GraphOptions
              class="LeftPopover"
              v-if="state.showGraphOptions"
            ></GraphOptions>
            <GeneralOptions
              class="LeftPopover"
              v-if="state.showGeneralOptions"
            ></GeneralOptions>
            <div class="expressions"
              v-if="!(state.showGraphOptions || state.showHelp || state.loading)"
              v-for="expr in state.env
                .valueSeq()
                .filter((x) => x.name !== '__tmp' && !systemFnNames.includes(x.name))"
              :key="expr.name"
            >
              <GraphExpr
                :env="state.env"
                :expr="expr"
                :allow-copy="previewingSave"
                :allow-edit="state.newExpr === ''"
                v-on:new:expr="
                  (x) => {
                    state.newExpr = x;
                    checkNewExpr();
                  }
                "
                v-on:remove:expr="(x) => removeExpr(x)"
                v-on:error="showError"
                v-on:edit="editExpression"
                v-on:import="importExpression"
              ></GraphExpr>
              
            </div>
          </template>
          <template #right> 
          <KeepAlive>
            <component :is="displayComponents[state.displayComponent]" :names="exprNames()" ></component>
          </KeepAlive>
          </template>
        </Vsplitter>
      </template>
      <template #bottom>
        <Vsplitter
          collapse-direction="right"
          left-col-spec="1fr"
          right-col-spec="1fr"
          v-model:collapsed="state.hideLibrary"
        >
          <template #right>
            TODO: format this <br />
            {{ knownSymbols }}
          </template>
          <template #left>
            <input
              class="newExpr"
              type="text"
              placeholder="Enter an expression"
              v-model="state.newExpr"
              autofocus
              @input="checkNewExpr()"
              @change="checkNewExpr()"
            />
            <pre color="red" v-if="defined(state.error)">
              {{ state.error }}
            </pre>
            <div class="inputPlaceholder" v-if="!state.parseResult">
            &nbsp;<br><br><br>
            
            </div>
            <div v-if="state.parseResult">
              <GraphExpr
                v-if="!state.loading"
                :env="state.env"
                :expr="state.env.get('__tmp')!"
                :tex="state.env.get('__tmp')?.node?.toTex()"
                :allow-copy="false"
                :allow-edit="false"
                v-on:new:expr="
                  (x) => {
                    state.newExpr = x;
                    checkNewExpr();
                  }
                "
                v-on:remove:expr="(x) => removeExpr(x)"
                v-on:error="showError"
              >
              </GraphExpr>
              <button
                v-if="!defined(state.error) && !state.loading"
                :disabled="state.newExpr === ''"
                @click="addToEnv(state.newExpr)"
              >
                {{
                  state.env.has(getNodeName(state.parseResult.node))
                    ? "Replace"
                    : "Add"
                }}
              </button>
              <br />
            </div>
            <div class="saveWidget">
              <!-- {{ state.parseResult }} -->
              <SaveWidget
                :env="state.env"
                :expressionUiState="getExpressionUiState()"
                :hasUnsaved="state.modified"
                v-on:restore="refresh"
                v-on:select-save="selectSave"
                v-on:unselect-save="unselectSave"
                v-on:saved="onSave"
              ></SaveWidget>
            </div>
          </template>
        </Vsplitter>
      </template>
    </Hsplitter>
    <!-- 
    <pre>
        {{ JSON.stringify(getExpressionUiState(), null, "\t") }}
        {{ JSON.stringify(state, null, "\t") }}
     </pre>
    <hr />
    <div>{{ state.info }}</div> -->
  </div>
</template>

<style scoped>
.menuBar {
  z-index: 2;
  position: absolute;
  left: 96vw;
}

.menuButton {
  background-color: aquamarine;
  border-radius: 50%;
  transform: scale(1.5);
  color: rgb(76, 96, 45);
}

.help {
  height: 95vh;
  width: 100vw;
  z-index: 1;
  left: 0;
  top: 50;
  overflow: auto;
  position: fixed;
}

.LeftPopover {
  height: 100%;
  width: 100%;
  z-index: 1;
  left: 0;
  top: 0;
  overflow: auto;
  position: relative;
}

.expressions {
  display: flex;
  flex-direction: column;
  margin-top: 3px;
}

.inputPlaceholder {
  border: 1px solid white;
  width: 100%;
  text-align: center;
  border-radius: 3px;
}

.saveWidget {
  margin-top: 10px;
}

.newExpr {
  width: 99.7%;
}
</style>
