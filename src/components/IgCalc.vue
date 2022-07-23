<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<script setup lang="ts">
   import { computed, onMounted } from 'vue';
   import HelpScreen from './HelpScreen.vue';
   import Vsplitter from './Vsplitter.vue';
   import SaveWidget from './SaveWidget.vue';
   import GeneralOptions from './GeneralOptions.vue';

   import { knownSymbols } from '../js/math/symbols';

   import NewExpression from './NewExpression.vue';

   import DisplayGraph from './DisplayGraph.vue';
   import DisplayData from './DisplayData.vue';

   import {
      state,
      initUI,
      lookupGraphComponent,
      loadPersistantOptions,
   } from './uiUtil';
   import FakeCursor from './FakeCursor.vue';

   onMounted(() => {
      initUI();
      loadPersistantOptions();
   });

   function help() {
      state.showHelp = !state.showHelp;
   }

   function showGraph() {
      state.showHelp = false;
      state.displayComponent = 'DisplayGraph';
   }

   function showData() {
      state.showHelp = false;
      state.displayComponent = 'DisplayData';
   }

   function generalOptions() {
      state.showHelp = false;
      state.showGeneralOptions = !state.showGeneralOptions;
   }

   function showMenu() {
      state.showMenuBar = !state.showMenuBar;
   }

   const exprNames = computed(() => {
      //      const names = ISet(state.env.names);
      return []; //names.filter((name) => graph.options.data[name]?.show).toArray();
   });

   function saveCollapse() {}
</script>

<template>
   <div class="ig-calc">
      <FakeCursor></FakeCursor>
      <div class="menuBar" v-if="false">
         <button class="menuButton" @click="showMenu">&#9776;</button>
         <div v-if="state.showMenuBar">
            <br />
            <div><button class="menuButton" @click="help">?</button></div>
            <div>
               <br /><button class="menuButton" @click="showGraph">
                  &#128200;
               </button>
            </div>
            <div>
               <br /><button class="menuButton" @click="showData">
                  &#8862;
               </button>
            </div>
            <div>
               <br /><button class="menuButton" @click="generalOptions">
                  &#9881;
               </button>
            </div>
         </div>
      </div>
      <section class="transparent">
         <o-sidebar
            :fullwidth="false"
            :fullheight="true"
            :overlay="false"
            :can-cancel="false"
            content-class="expr-bar"
            :reduce="!state.exprBarExpanded"
            open
         >
            <div class="transparent">
               <HelpScreen
                  class="LeftPopover"
                  v-if="state.showHelp"
               ></HelpScreen>
               <GeneralOptions
                  class="LeftPopover"
                  v-if="state.showGeneralOptions"
               ></GeneralOptions>
               <div class="cols lastSmall" v-if="state.exprBarExpanded">
                  <div>
                     <label for="exprComponent">Display expressions as</label>
                     <select id="exprComponent" v-model="state.exprComponent">
                        <option value="expr">Expression</option>
                        <option value="text">Plain Text</option>
                        <option value="js">JavaScript (experimental)</option>
                     </select>
                  </div>
                  <div>
                     <o-checkbox v-model="state.runTimer">Run Timer</o-checkbox>
                  </div>
               </div>
               <div
                  class="expressions"
                  :key="name"
                  v-for="name in state.env.names"
               >
                  <component
                     :is="lookupGraphComponent(name)"
                     :name="name"
                     :allow-copy="false"
                     :allow-edit="false"
                  ></component>
               </div>
               <div
                  class="expressions"
                  v-if="state.saveEditable && state.exprBarExpanded"
               >
                  <NewExpression></NewExpression>
               </div>
            </div>
         </o-sidebar>
      </section>
      <div class="rightward">
         <o-tabs type="toggle" position="right" vertical variant="success">
            <o-tab-item label="Graph">
               <DisplayGraph></DisplayGraph>
            </o-tab-item>
            <o-tab-item label="Grid">
               <DisplayData :names="exprNames"></DisplayData>
            </o-tab-item>
         </o-tabs>
      </div>
      <o-collapse class="save-area" :open="false">
         <template #trigger="saveCollapse"> saves here </template>
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
               <div class="saveWidget">
                  <SaveWidget></SaveWidget>
               </div>
            </template>
         </Vsplitter>
      </o-collapse>
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

   .expressions {
      display: flex;
      flex-direction: column;
      margin-top: 3px;
   }

   .saveWidget {
      margin-top: 10px;
   }

   .newExpr {
      width: 99.7%;
   }

   .rightward {
      position: absolute;
      right: -1px;
   }
</style>
