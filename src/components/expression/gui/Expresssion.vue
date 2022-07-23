<script setup lang="ts">
   import { addTexElement, typeset } from 'js/typeset';
   import { reactive, computed, watch } from 'vue';
   import { state as appState } from 'components/uiUtil';
   import { notBlank, defined } from 'js/util';
   import { flattenDependencyTree } from 'js/env/exprEnv';
   import { EnvExpr } from 'js/env/EnvExpr';

   interface Props {
      name: string;
      tex?: string;
      allowCopy: boolean;
      allowEdit: boolean;
   }

   const props = defineProps<Props>();

   let graphState = appState.env.expression.getState(props.name);

   const state = reactive({
      showMenu: false,
      animate: false,
      error: defined(graphState.value.error),
   });

   //   const isImported = computed(() => hasImportExpression(props.state));

   const emit = defineEmits<{
      (e: 'error', value: Error): void;
      (e: 'edit', value: string): void;
   }>();

   function remove() {
      appState.env.expression.delete(props.name);
   }

   function edit() {
      if (props.name.startsWith('anon: ')) {
         remove();
      } else {
         emit('edit', props.name);
      }
   }

   function getTex() {
      const value = appState.env.expression.get(props.name);
      return defined(value)
         ? appState.env.expression.toTex(props.name, value)
         : `${props.name} not found`;
   }

   function refreshTex() {
      addTexElement('tex_' + props.name, getTex());
      typeset();
   }

   refreshTex();

   function copyToCurrent() {
      //         addImportExpression(props.state);
   }

   watch(
      () => graphState.value,
      () => {
         refreshTex();
      }
   );

   const isImported = computed(() => false); // TODO

   function updateExpr(event: Event) {
      if (event.target instanceof HTMLInputElement) {
         const expr = EnvExpr(event.target.value);
         appState.env.expression.set(props.name, expr);
         if (!defined(expr.error)) {
            state.error = false;
         }
         refreshTex();
      }
   }

   function syncGraphState() {
      graphState = appState.env.expression.getState(props.name);
      state.error = defined(graphState.value.error);
   }
</script>

<template>
   <div
      class="cols GraphExpr lastSmall"
      :class="{ imported: isImported }"
      v-if="!graphState.hidden || appState.showHiddenExpressions"
   >
      <div class="rows">
         <div class="cols wrap">
            <span
               v-if="!props.name.startsWith('anon:') && props.name !== '__tmp'"
            >
               {{ props.name }}
            </span>
            <input
               class="gridCheck"
               type="checkbox"
               v-model="graphState.showGraph"
               :id="`show:${name}`"
            />
            <input
               class="colorPicker"
               type="color"
               v-model="graphState.color"
               :id="`color:${name}`"
            />
         </div>
         <template v-if="appState.exprBarExpanded">
         <o-field style="width: 98%" v-if="appState.saveEditable">
            <o-input
               style="margin-left: 7px"
               v-model="graphState.value.expr"
               @input="updateExpr"
               @blur="syncGraphState"
            >
            </o-input>
         </o-field>
         <div class="cols">
            <span
               class="tex"
               :class="{ error: state.error }"
               :id="'tex_' + name"
               >{{ state.toString() }}
            </span>
         </div>
         <div class="cols" v-if="graphState.description">
            <span class="fullRow">{{ graphState.description }}</span>
         </div>
         <div class="cols">
            <span class="fullRow">{{
               flattenDependencyTree(
                  appState.env.getDependencies(props.name)
               ).toJSON()
            }}</span>
         </div>
         </template>
      </div>
      <div class="rows" v-if="appState.exprBarExpanded">
         <button class="menuButton" @click="state.showMenu = !state.showMenu">
            &#9776;
         </button>
         <template v-if="state.showMenu && appState.saveEditable">
            <button
               class="menuButton"
               :disabled="notBlank(appState.newExpr) && props.name !== '__tmp'"
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
            <!-- <button class="menuButton" @click="sonify()">Sonify</button> -->
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

   .tex.error {
      background-color: #371111;
   }

   .gridCheck {
      width: 15px;
      align-self: center;
   }

   .imported {
      background-color: rgb(43, 51, 36);
   }

   button:disabled {
      background-color: rgb(59, 20, 20);
   }

   fullRow {
      flex: 99 0 auto;
   }

   .rightward {
      margin-left: auto;
   }

   .sliderCap {
      /* text-decoration: underline #445e00; */
      width: max-content;
      margin-top: 5px;
      padding: 0px 4px;
      border: 1px solid #595958;
      border-radius: 10px;
   }

   .sliderCap.left {
      left: 90%;
      /* top: -15px; */
      position: absolute;
   }

   .sliderCap.right {
      right: 90%;
      /* top: -15px; */
      position: absolute;
   }

   input:invalid {
      background-color: #550000;
   }
</style>
