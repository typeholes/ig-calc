<script setup lang="ts">
   import { reactive } from 'vue';
   import { state as appState, onTicks } from './uiUtil';
   import * as Color from 'd3-color';
   import { defined } from '../js/util';

   const state = reactive({
      model: 'rgb',
      parts: ['r', 'g', 'b'],
      color: '#000000',
      newColor: '#000000',
      time: 0,
   });

   function updateColor(seconds: number) {
      let rgb = Color.color(state.newColor)?.rgb() ?? Color.rgb(1, 1, 1);

      const getR = appState.env.getDatum(state.parts[0]);
      if (defined(getR)) {
         rgb.r = getR.evalFn(state.time);
      }

      const getG = appState.env.getDatum(state.parts[1]);
      if (defined(getG)) {
         rgb.g = getG.evalFn(state.time);
      }

      const getB = appState.env.getDatum(state.parts[2]);
      if (defined(getB)) {
         rgb.b = getB.evalFn(state.time);
      }

      state.newColor = rgb.clamp().formatHex();
      const hsl = Color.hsl(rgb.r, rgb.g/255, rgb.b/255);
      state.newColor = hsl.clamp().formatHex();
      state.time += seconds;
   }

   onTicks.updateColor = updateColor;

   const models = {
      rgb: ['red', 'green', 'blue'],
   };
</script>

<template>
   <div>
      <select :value="state.model">
         <option :key="name" v-for="(parts, name) in models">
            {{ name }}
         </option>
      </select>
      <div class="rows">
         <template :key="part" v-for="(part, idx) in models[state.model]">
            <label :for="`color-${part}`">{{ idx }}) {{ part }}</label>
            <select :id="`color-${part}`" :value="state.parts[idx]">
               <option :key="name" v-for="name in appState.env.names">
                  {{ name }}
               </option>
            </select>
         </template>
      </div>
      <pre class="swatch">
         {{ state.time }}
         {{ state.newColor }}
         {{ JSON.stringify(state.parts) }}
         </pre
      >
   </div>
</template>

<style scoped>
   .swatch {
      display: block;
      width: 100%;
      height: 50px;
      background-color: v-bind('state.newColor');
   }

   select {
      color: white;
   }
</style>
