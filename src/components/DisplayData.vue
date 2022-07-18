<script setup lang="ts">
   import CanError from './CanError.vue';
   import { errorable } from '../js/Either';
   import { state as appState } from './uiUtil';
   import { arrayRange } from '../js/function-plot/utils';
   import { EnvItem } from '../js/env/exprEnv';
   import { defined } from '../js/util';
   import { Map as IMap } from 'immutable';
import { computed } from 'vue';

   function getNames() {
      const names =  IMap(appState.env.items).filter ( (item) => item.showGraph);
      return names;
   }

const names = computed(getNames);

   function formatName(name: string) {
      if (name === '__tmp') {
         return 'temp';
      }
      return name.replace(/^anon: /, '');
   }

   function formatNumber(n: number) {
      return n; // TODO
   }

   function runFn(name: string, item: EnvItem, n: number) {
      return errorable(() => {
         const datum = appState.env.getDatum(name);
         if (defined(datum) && datum.evalFn instanceof Function) {
            return formatNumber(datum.evalFn(n));
         }
         return '';
      });
   }
</script>

<template >
   <div>
      <div
         class="dataGrid"
         :style="{
            gridTemplateColumns: `repeat( ${names.size + 2}, auto)`,
         }"
         :key="appState.env.constant.get('time')"
      >
         <div style="gridcolumn: 1">free</div>
         <template :key="name" v-for="([name, item], idx) of names">
            <div
               :style="{
                  gridColumn: idx + 2,
                  border: `1px solid ${item.color ?? 'white'}`,
               }"
            >
               {{ formatName(name) }}
            </div>
         </template>
         <template
            :key="num"
            v-for="(num, rowNum) in arrayRange(
               appState.freeMin,
               appState.freeMax
            )"
         >
            <div :style="{ gridColumn: 1, gridRow: rowNum + 2 }">{{ num }}</div>
            <template :key="name" v-for="([name, item], idx) of names">
               <div
                  :style="{
                     gridColumn: idx + 2,
                     border: `1px solid ${item.color ?? 'white'}`,
                  }"
               >
                  <CanError
                     :key="appState.newExpr"
                     :value="runFn(name, item, num)"
                  ></CanError>
               </div>
            </template>
         </template>
      </div>
   </div>
</template>

<style>
   .dataGrid {
      display: grid;
      border: 1px solid whitesmoke;
      column-gap: 2px;
      overflow: auto auto;
      max-width: 60vw;
   }
</style>
