<script setup lang="ts">
import { computed, reactive } from 'vue';
import { Interval, offsetInterval } from '../js/interval';
import { state } from './SaveWidget';

const graph = reactive({
  x: Interval(-5, 15),
  y: Interval(10, -10),
  scale: 0,
  width: window.innerWidth,
  height: window.innerHeight,
});

const xTick = computed(() => Interval.span(graph.x) / 10);
const yTick = computed(() => Interval.span(graph.y) / 10);

function handlePan({ ...info }) {
  graph.x = offsetInterval(
    graph.x,
    (-1 * (info.delta.x * Interval.span(graph.x))) / graph.width
  );
  graph.y = offsetInterval(
    graph.y,
    (info.delta.y * Interval.span(graph.y)) / graph.height
  );
}

function handleWheel(e: WheelEvent) {
  graph.scale += e.deltaY;
  const by = e.deltaY > 0 ? 1.1 : 0.9;
  graph.x = Interval.scale(graph.x, by);
  graph.y = Interval.scale(graph.y, by);
  e.preventDefault();
}

const samples = 2000;
function testPoints(fn: (x: number) => number) {
  const scaleX = graph.width / Interval.span(graph.x);
  const scaleY = graph.height / Interval.span(graph.y);
  const offsetX = Interval.midpoint(graph.x);
  const offsetY = Interval.midpoint(graph.y);
  let points = '';
  for (let i = 0; i < samples; i++) {
    const x = Interval.at(graph.x, i / samples);
    const y = fn(x);
    const gx = (x - offsetX) * scaleX + graph.width * 0.5;
    const gy = (y + offsetY) * scaleY + graph.height * 0.5;
    points = `${points} ${gx},${gy}`;
  }
  return points;
}

const lines = computed(() => {
  const arr = Array.from(state.currentEnv.items.keys());
  return arr.map((name) => {
    const datum = state.currentEnv.getDatum(name);
    return { id: name, fn: datum.evalFn, color: datum.color };
  });
});
//viewBox="0 0 800 800"
</script>

<template>
  <q-card v-touch-pan.prevent.mouse="handlePan" @wheel="handleWheel">
    <svg
      version="1.1"
      :width="graph.width"
      :height="graph.height"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      class="graph"
    >
      <g stroke="white" stroke-width="1" v-for="n in 11" :key="n" fill="white">
        <line
          :stroke-opacity="n === 6 ? 0.5 : 0.2"
          x1="0%"
          x2="100%"
          :y1="(n - 1) * 10 + '%'"
          :y2="(n - 1) * 10 + '%'"
        ></line>
        <text
          class="axis"
          x="50%"
          :y="(n - 1.01) * 10 + '%'"
          text-anchor="left"
          stroke-width="0"
        >
          {{ ((n - 1) * yTick + graph.y.lo).toFixed(2) }}
        </text>
      </g>

      <g stroke="white" stroke-width="1" v-for="n in 11" :key="n" fill="white">
        <line
          :stroke-opacity="n === 6 ? 0.5 : 0.2"
          y1="0%"
          y2="100%"
          :x1="(n - 1) * 10 + '%'"
          :x2="(n - 1) * 10 + '%'"
        ></line>
        <text
          class="axis"
          y="51%"
          :x="(n - 1.01) * 10 + '%'"
          text-anchor="left"
          stroke-width="0"
        >
          {{ ((n - 1) * xTick + graph.x.lo).toFixed(2) }}
        </text>
      </g>
      <template :key="line.id" v-for="line in lines">
        <polyline
          :points="testPoints(line.fn)"
          :stroke="line.color"
          fill="transparent"
        />
      </template>
    </svg>
  </q-card>
</template>

<style>
.graph {
  position: relative;
  left: 0;
  pointer-events: none;
}

div.graph {
  width: 100px;
}

.axis {
  font: 8px sans-serif;
}
</style>
