<script setup lang="ts">
import { nextTick } from "vue";
import HelpScreen from "./HelpScreen.vue";
import GraphOptions from "./GraphOptions.vue";
import Vsplitter from "./Vsplitter.vue";
import Hsplitter from "./Hsplitter.vue";


import { onMounted } from "vue";
import GraphExpr from "./GraphExpr.vue";
import {
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

import { graph, initGraph, state, displayComponents, checkNewExpr, addToEnv, removeExpr, loadEnv } from "./uiUtil";

onMounted(() => {
  if (!defined(graph)) {
    initGraph();
  }
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

function showMenu() {
  state.showMenuBar = !state.showMenuBar;
}

function exprNames() {
  const names = Array.from(state.env.keys());
  return names.filter( (name) => graph.options.data[name]?.show)
}

function refresh(args: { saveRep: SaveRep }) {
  state.loading = true;
  const holdGraphOptions = state.showGraphOptions;
  state.showGraphOptions = false;
  loadEnv(args);
  state.loading = false;
  nextTick(function () {
    state.showGraphOptions = holdGraphOptions
  });
  state.modified = false;
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
            <div
              v-if="!(state.showGraphOptions || state.showHelp) || state.loading"
              v-for="expr in state.env
                .valueSeq()
                .filter((x) => x.name !== '__tmp')"
              :key="expr.name"
            >
              <GraphExpr
                :env="state.env"
                :expr="expr"
                v-on:new:expr="
                  (x) => {
                    state.newExpr = x;
                    checkNewExpr();
                  }
                "
                v-on:remove:expr="(x) => removeExpr(x)"
                v-on:error="showError"
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
              type="text"
              size="80"
              v-model="state.newExpr"
              @input="checkNewExpr()"
              @change="checkNewExpr()"
            />
            <pre color="red" v-if="defined(state.error)">
              {{ state.error }}
            </pre>
            <div v-if="state.parseResult">
              <GraphExpr
                v-if="!state.loading"
                :env="state.env"
                :expr="state.env.get('__tmp')!"
                :tex="state.env.get('__tmp')?.node?.toTex()"
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
            <div>
              <!-- {{ state.parseResult }} -->
              <SaveWidget
                :env="state.env"
                :expressionUiState="getExpressionUiState()"
                :hasUnsaved="state.modified"
                v-on:restore="refresh"
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
</style>
