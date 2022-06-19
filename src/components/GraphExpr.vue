<script setup lang="ts">
import {
  ExprEnv,
  ValidExpr,
  isGraphable,
  getGraphFn,
  getDependencies,
  envToMathEnv,
getGraphFnStr,
} from "./expressions";
import { addTexElement, typeset } from "../js/typeset";
import { onUpdated, onMounted } from "vue";
import { MathNode, simplify } from "mathjs";
import { derive as _derive } from "../js/math/derivatives";
import { integrate as _integrate } from "../js/math/integrals";
import { inline } from "../js/math/mathUtil";
import { Errorable, errorable } from "../js/Either";
import { getFunctionBody, getBody as getDeclarationBody } from "./expressions";
import { graph } from "./uiUtil";

interface Props {
  expr: ValidExpr;
  env: ExprEnv;
  tex?: string;
}

const props = defineProps<Props>();

const getBody = (x: MathNode) => getDeclarationBody(getFunctionBody(x));

const emit = defineEmits<{
  (e: "new:expr", value: string): void;
  (e: "remove:expr", value: string): void;
  (e: "error", value: Error): void;
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
  emit("remove:expr", props.expr.name);
}

function graphFn(x) {
  return getGraphFnStr(props.env, x);
}

function refreshTex() {
  addTexElement("tex_" + props.expr.name, props.tex ?? props.expr.node.toTex());
  typeset();
}

function drawGraph() {
  addTexElement("tex_" + props.expr.name, props.tex ?? props.expr.node.toTex());
  typeset();
  drawLines();
}

function drawLines() {
  Errorable.catch(errorable(graph.drawLines), (error) => {
    emit("error", error);
  });
}
onUpdated(drawGraph);
onMounted(drawGraph);
</script>

<template>
  <button class="closeButton" @click="remove()">x</button>
  <div class="GraphExpr">
  <span v-if="!props.expr.name.startsWith('anon:')"> {{ props.expr.name }} </span>
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
        v-on:change="updateColor"
      />
      <span class="fullRow">{{ graphFn(expr) }}</span>
    </template>
    <span class="tex" :id="'tex_' + expr.name">{{ expr.toString() }} </span>
    <template v-for="free in getDependencies(env, expr, 'free')">
      <span class="free">
        {{ free }}
      </span>
      <button class="dx" @click="derive(free)">dx</button>
      <!-- <button @click="integrate(free)">&#x222B</button>  integration is broken :(-->
      <!-- <input type="number" /> -->
    </template>
    <!-- {{ derive(expr.node).toString() }} -->
  </div>
</template>

<style scoped>
.GraphExpr {
  border: 1px solid bisque;
  display: grid;
  grid-template-columns: 8fr min-content min-content 3fr 8fr;
}

.fullRow {
  grid-column: 1/6;
}

.closeButton {
  float: right;
  background-color: red;
  padding: 0 1px 0;
  margin: -1px;
}

:deep(mjx-container) {
  background: none;
  top: 1px;
}
.tex {
  grid-column: 1/6;
  overflow: auto;
}

.gridCheck {
  grid-column: 3;
  width: 15px;
  align-self: center;
}

.colorPicker {
  grid-column: 4;
}

.dx {
  grid-column: 3;
}

.free {
  grid-column: 2;
}
</style>
