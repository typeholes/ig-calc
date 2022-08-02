<script setup lang="ts">
   import CanError from './CanError.vue';
   import { errorable } from '../js/Either';
   import { arrayRange } from '../js/function-plot/utils';
   import { EnvItem } from '../js/env/exprEnv';
   import { defined } from '../js/util';
   import { Map as IMap } from 'immutable';
   import { state as appState } from './uiUtil';
import { computed } from 'vue';
import { currentEnv } from 'src/components/SaveWidget'

   function getNames() {
      const names =  IMap(currentEnv.value.items).filter ( (item) => item.showGraph);
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
         const datum = currentEnv.value.getDatum(name);
         if (defined(datum) && datum.evalFn instanceof Function) {
            return formatNumber(datum.evalFn(n));
         }
         return '';
      });
   }

</script>

<template >
   <div class="fillLeft lastSmall">
      <div>&nbsp;</div>
      <div
         class="dataGrid"
         :style="{
            gridTemplateColumns: `repeat( ${names.size + 2}, auto)`,
         }"
         :key="currentEnv.constant.get('time')"
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
                     :value="runFn(name, item, num)"
                  ></CanError>
               </div>
            </template>
         </template>
      </div>
   </div>
</template>

<style>

   .fillLeft {
      display: flex;
      width: 90vw;
   }

   .dataGrid {
      display: grid;
      border: 1px solid whitesmoke;
      column-gap: 2px;
      overflow: auto auto;
      max-width: 60vw;
      margin-right: 20vw;
   }
</style>
