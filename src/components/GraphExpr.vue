<script setup lang="ts">
import {
  ExprEnv,
  ValidExpr,
  isGraphable,
  getDependencies,
  envToMathEnv,
  getGraphFnStr,
} from "./expressions";
import { addTexElement, typeset } from "../js/typeset";
import { onUpdated, onMounted, reactive } from "vue";
import { MathNode, simplify } from "mathjs";
import { derive as _derive } from "../js/math/derivatives";
import { integrate as _integrate } from "../js/math/integrals";
import { inline } from "../js/math/mathUtil";
import { Errorable, errorable } from "../js/Either";
import { getFunctionBody, getBody as getDeclarationBody } from "./expressions";
import {
  addImportExpression,
  checkNewExpr,
  graph,
  hasImportExpression,
  state as appState,
} from "./uiUtil";
import { computed } from "@vue/reactivity";
import { defined, notBlank } from "../js/util";
import { play } from "../js/sonify";

interface Props {
  expr: ValidExpr;
  env: ExprEnv;
  tex?: string;
  allowCopy: boolean;
  allowEdit: boolean;
}

const props = defineProps<Props>();

const state = reactive({
  showMenu: false,
});

const isImported = computed(() => hasImportExpression(props.expr));

const getBody = (x: MathNode) => getDeclarationBody(getFunctionBody(x));

const emit = defineEmits<{
  (e: "new:expr", value: string): void;
  (e: "remove:expr", value: string): void;
  (e: "error", value: Error): void;
  (e: "edit", value: string): void;
}>();

function getColor() {
  return graph.options.data[props.expr.name].color;
}

function updateColor(event) {
  const id = props.expr.name;
  const color = event.target.value;
  graph.options.data[id].color = color;
  drawLines();
}

function getShow() {
  return graph.options.data[props.expr.name].show;
}

function updateShow(event) {
  const id = props.expr.name;
  const checked = event.target.checked;
  graph.options.data[id].show = checked;
  drawLines();
}

function derive(by: string) {
  const result = errorable(() => {
    const inlined = inline(getBody(props.expr.node), envToMathEnv(props.env));
    const dx = _derive(inlined, by);
    emit("new:expr", simplify(dx).toString());
  });

  Errorable.catch(result, (e) => {
    emit("error", e);
  });
}
function integrate(by: string) {
  const result = errorable(() => {
    const inlined = inline(getBody(props.expr.node), envToMathEnv(props.env));
    const dx = _integrate(inlined, by);
    emit("new:expr", simplify(dx).toString());
  });

  Errorable.catch(result, (e) => {
    emit("error", e);
  });
}

function remove() {
  delete graph.options.data[props.expr.name];
  appState.newExpr = props.expr.node.toString();
  checkNewExpr();
  emit("remove:expr", props.expr.name);
}

function edit() {
  if (props.expr.name.startsWith("anon: ")) {
    remove();
  } else {
    emit("edit", props.expr.name);
  }
}

function graphFn(x) {
  return getGraphFnStr(props.env, x);
}

function sonify() {
  const datum = graph.options.data[props.expr.name];
  if (defined(datum)) {
    const samples = graph
      .runSampler(props.expr.name, 1000)
      .flat()
      .map(([_, y]) => y);
    play(samples);
  }
}

// function refreshTex() {
//   addTexElement("tex_" + props.expr.name, props.tex ?? props.expr.node.toTex());
//   typeset();
// }

function drawGraph() {
  addTexElement("tex_" + props.expr.name, props.tex ?? props.expr.node.toTex());
  drawLines();
}

function drawLines() {
  Errorable.catch(errorable(graph.drawLines), (error) => {
    //    emit("error", error);
    // TODO: verify we don't have situations where we need to display errors in the graph evaluation
  });
}

function copyToCurrent() {
  addImportExpression(props.expr);
}

onUpdated(drawGraph);
onMounted(drawGraph);
</script>

<template>
  <div class="cols GraphExpr lastSmall" :class="{ imported: isImported }">
    <div class="rows">
      <div class="cols">
        <span
          v-if="
            !props.expr.name.startsWith('anon:') && props.expr.name !== '__tmp'
          "
        >
          {{ props.expr.name }}
        </span>
        <template v-if="isGraphable(env, expr)">
          <input
            class="gridCheck"
            type="checkbox"
            :checked="getShow()"
            :value="getShow()"
            v-on:change="updateShow"
          />
          <input
            class="colorPicker"
            type="color"
            :value="getColor()"
            v-on:input="updateColor"
          />
        </template>
      </div>
      <div class="cols" v-if="expr.showValue">
        <span class="fullRow">{{ graphFn(expr) }}</span>
      </div>
      <div class="cols">
        <span class="tex" :id="'tex_' + expr.name">{{ expr.toString() }} </span>
      </div>
      <div class="cols">
        <div class="rows">
          <template v-for="free in getDependencies(env, expr, 'free')">
            <span class="free">
              {{ free }}
              <button class="dx" @click="derive(free)">dx</button>
            </span>
            <!-- <button @click="integrate(free)">&#x222B</button>  integration is broken :(-->
            <!-- <input type="number" /> -->
          </template>
        </div>
      </div>
      <div class="cols" v-if="expr.description">
        <span class="fullRow">{{ expr.description }}</span>
      </div>
    </div>
    <div class="rows">
      <button class="menuButton" @click="state.showMenu = !state.showMenu">
        &#9776;
      </button>
      <template v-if="state.showMenu">
        <button
          class="menuButton"
          :disabled="notBlank(appState.newExpr) && props.expr.name !== '__tmp'"
          @click="remove()"
        >
          Remove
        </button>
        <button
          class="menuButton"
          v-if="props.allowEdit"
          :disabled="notBlank(appState.newExpr)"
          @click="edit()"
        >
          Edit
        </button>
        <button
          class="menuButton"
          v-if="props.allowCopy"
          @click="copyToCurrent()"
          :disabled="isImported"
        >
          Copy to current save
        </button>
        <button class="menuButton" @click="expr.showValue = !expr.showValue">
          {{ expr.showValue ? "Hide Value" : "Show Value" }}
        </button>
        <button class="menuButton" @click="sonify()">Sonify</button>
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

.lastSmall > :last-child {
  flex: 0 1 fit-content;
}

.imported {
  background-color: rgb(43, 51, 36);
}

button:disabled {
  background-color: rgb(59, 20, 20);
}
</style>
