<script setup lang="ts">
   import { globalTheme } from '../js/theme';
   import { reactive } from 'vue';
   import { appTabs as tabs, state as appState } from './uiUtil';

   const theme = globalTheme ?? {};

   const numTabs = () => Object.keys(tabs).length;

   const state = reactive({
      tab: tabs.Calc,
   });

   function setTab(tabName: keyof typeof tabs) {
      state.tab = tabs[tabName];
   }
</script>

<template>
   <div class="main firstSmall lastSmall">
      <div class="col1">
         <o-field>
            <o-switch
               v-model="appState.exprBarExpanded"
               expand
            ></o-switch>
         </o-field>
      </div>
      <template v-for="(_, tabName, col) in tabs">
         <button :class="`tab col${col + 2}`" @click="setTab(tabName)">
            {{ tabName }}
         </button>
      </template>
      <div class="col4">
         <o-field>
            <o-switch
               v-model="appState.saveBarExpanded"
               expand
            ></o-switch>
         </o-field>
      </div>
      <div class="pane">
         <KeepAlive :include="tabs.Calc.value.name">
            <component :is="state.tab"></component>
         </KeepAlive>
      </div>
   </div>
</template>

<style scoped>
   #app {
      font-family: Avenir, Helvetica, Arial, sans-serif;
   }

   :deep(*) {
      color: v-bind('theme.color');
   }

   :deep(button) {
      background-color: v-bind('theme.backgroundColor');
   }
   :deep(input) {
      background-color: v-bind('theme.backgroundColor');
   }
   :deep(select) {
      background-color: v-bind('theme.backgroundColor');
   }

   .main {
      display: grid;
      grid-template-columns: min-content 1fr 1fr min-content;
      row-gap: 5px;
   }

   .transparent {
      background-color: aliceblue;
      opacity: 90%;
   }

   .pane {
      grid-row: 2;
      grid-column-start: 1;
      grid-column-end: v-bind(numTabs() + 3);
   }

   .tab {
      background-color: rgb(82, 87, 90);
   }
</style>

<style>
   html {
      background-color: black;
   }

   .row2 {
      grid-row: 2;
   }
   .row3 {
      grid-row: 3;
   }
   .row4 {
      grid-row: 4;
   }
   .col1 {
      grid-column: 1;
   }
   .col2 {
      grid-column: 2;
   }
   .col3 {
      grid-column: 3;
   }
   .col4 {
      grid-column: 4;
   }
   .col5 {
      grid-column: 5;
   }
   .col6 {
      grid-column: 6;
   }
   .col7 {
      grid-column: 7;
   }
   .col8 {
      grid-column: 8;
   }
   .col9 {
      grid-column: 9;
   }

   .rows {
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: 100%;
   }

   .cols {
      display: flex;
      flex-direction: row;
      gap: 3px;
      margin: 3px;
   }
   .cols.wrap {
      flex-wrap: wrap;
   }

   .firstSmall > :first-child {
      flex: 0 1 fit-content;
      margin-right: auto;
   }
   .lastSmall > :last-child {
      flex: 0 1 fit-content;
      margin-left: auto;
   }
</style>

<style>
   .fakeActive {
      box-shadow: 0 2px #666;
      transform: translateY(2px);
   }

   button:disabled {
      background-color: rgb(59, 20, 20);
   }
   /* body {
    overflow: hidden;
   } */

   .o-side {
      backdrop-filter: blur(80%);
      isolation: isolate;
      display: contents;
   }

   .o-side__content--mini {
      background-color: #f22222;
      color: white;
      width: 10%;
      isolation: isolate;
   }
   .o-side__content {
      background-color: #222222;
      color: white;

      mix-blend-mode: lighten;
   }

   .o-side__content select {
      background-color: black;
      color: white;
   }
   .o-side__content input {
      background-color: transparent;
      color: white;
   }
   .o-side__content .tex {
      opacity: 100%;
   }

   .GraphExpr {
      background-color: black;
   }

   .transparent {
      background-color: black;
   }

   .o-side .expr-bar {
      background-color: black;
      margin-top: 3%;
   }

   .save-area {
      position: absolute;
      bottom: -1px;
   }

   .o-switch .o-switch__check {
      background-color: rgb(82, 87, 90);
   }
</style>
