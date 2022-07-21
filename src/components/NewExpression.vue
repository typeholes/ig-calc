<script setup lang="ts">
   import { reactive, computed } from 'vue';
   import { EnvTypeTag } from 'js/env/EnvType';
   import { state as appState } from './uiUtil';
   import { EnvExpr } from 'js/env/EnvExpr';
   import { Animation } from 'js/env/Animation';

   const state = reactive({
      name: '',
      type: 'constant' as EnvTypeTag,
   });

   const disableAdd = computed(
      () => state.name === 'time' || appState.env.items.has(state.name)
   );

   function addExpr() {
      const newName = state.name;
      state.name = '';
      if (state.type === 'constant') {
         appState.env.constant.set(newName, 0);
         return;
      }
      if (state.type === 'expression') {
         appState.env.expression.set(newName, EnvExpr(`${newName} = sin(x)`));
         return;
      }
      if (state.type === 'animated') {
         appState.env.animated.set(newName, Animation('zigZag', 0, 5, 3));
         return;
      }
   }
</script>

<template>
   <div class="cols NewExpr">
      <o-field label="Name"><o-input v-model="state.name"></o-input></o-field>
      <o-field label="Type">
         <o-select v-model="state.type">
            <option>constant</option>
            <option value="animated">periodic</option>
            <option>expression</option>
         </o-select>
      </o-field>
      <o-button :disabled="disableAdd" @click="addExpr">+</o-button>
      <div></div>
   </div>
</template>

<style>
   .NewExpr {
      border: 1px solid bisque;
      border-radius: 4px;
   }
</style>
