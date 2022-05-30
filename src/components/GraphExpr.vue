<script setup lang="ts">
import {
  ExprEnv,
  ValidExpr,
  isGraphable,
  getGraphFn,
  getDependencies,
  envToMathEnv,
} from "./expressions";
import { addTexElement, typeset } from "../js/typeset";
import { onUpdated, onMounted } from "vue";
import { expression, MathNode, simplify } from "mathjs";
import { derive as _derive } from "../js/math/derivatives";
import { integrate as _integrate } from "../js/math/integrals";
import { inline } from "../js/math/mathUtil";
import { Errorable, errorable } from "../js/Either";
import { Graph } from "../js/function-plot/d3util";
import { Datum, EvalFn } from "../js/function-plot/FunctionPlotDatum";
import { getFunctionBody, getBody as getDeclarationBody} from './expressions';
import { defined } from "../js/util";
import { pickColor, graph } from "./uiUtil";


interface Props {
  expr: ValidExpr;
  env: ExprEnv;
  tex?: string;
}

const props = defineProps<Props>();

const getBody =  (x: MathNode) => getDeclarationBody(getFunctionBody(x));


const emit = defineEmits<{
  (e: "new:expr", value: string): void;
  (e: "remove:expr", value: string): void;
  (e: "error", value: Error): void;
}>();



function getDatum(show?: boolean, color?: string) {
  const body = getBody(props.expr.node);
  const inlined = inline(body, envToMathEnv(props.env));
  const firstFree = getDependencies(props.env, props.expr, 'free').first('x');
  const evalFn = (x: number) => inlined.compile().evaluate({[firstFree]: x}) 
  return Datum( evalFn, {show, color: color ?? pickColor()})
}


function getColor() {
  return graph.data[props.expr.name]?.color;
}

function updateColor(event) {
  const id = props.expr.name;
  const color = event.target.value;
  graph.data[id].color = color;
  drawLines();
}

function getShow() {
  return graph.data[props.expr.name]?.show;
}

function updateShow(event) {
  const id = props.expr.name;
  const checked = event.target.checked;
  graph.data[id] ??= getDatum();
  graph.data[id].show = checked;
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
  emit("remove:expr", props.expr.name);
}

function z(x) {
  return getGraphFn(props.env, x);
}

function refreshTex() {
  addTexElement("tex_" + props.expr.name, props.tex ?? props.expr.node.toTex());
  typeset();
}

function drawGraph() {
  graph.data[props.expr.name] ??= getDatum();
  addTexElement("tex_" + props.expr.name, props.tex ?? props.expr.node.toTex());
  typeset();
  const newDatum = getDatum(getShow(),getColor());
  graph.data[props.expr.name]= newDatum;
  drawLines();
}

function drawLines() {
  Errorable.catch(errorable(graph.drawLines), (error) => { emit('error', error)})
}
onUpdated(drawGraph);
onMounted(drawGraph);

</script>

<template>
  <div class="GraphExpr">
    <button class="closeButton" @click="remove()">x</button>
    <div v-if="isGraphable(env, expr)">
      <input
        type="checkbox"
        :checked="getShow()"
        :value="getShow()"
        v-on:change="updateShow"
      />
      <input
        type="color"
        :value="getColor()"
        v-on:change="updateColor"
      />
      {{ z(expr) }}
    </div>
    <div><span class="tex" :id="'tex_' + expr.name">{{ expr.toString() }} </span></div>
    <div v-for="free in getDependencies(env, expr, 'free')">
      {{ free }}
      <button @click="derive(free)">dx</button>
      <!-- <button @click="integrate(free)">&#x222B</button>  integration is broken :(-->
      <!-- <input type="number" /> -->
    </div>
    <!-- {{ derive(expr.node).toString() }} -->
  </div>
</template>

<style scoped>
.GraphExpr {
  border: 1px solid bisque;
}

.closeButton {
  float: right;
  background-color: red;
  padding: 0 1px 0;
  margin: -1px;
}

:deep(mjx-container) {
  background: none;
  top: 1px

}
/* .tex { } */
</style>
