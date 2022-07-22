<script setup lang="ts">
   import { addTexElement, typeset } from 'js/typeset';
   import { reactive, computed, watch } from 'vue';
   import { MathNode } from 'mathjs';
   import { state as appState } from 'components/uiUtil';
   import { notBlank, defined, assert } from 'js/util';
   import { libraries } from 'js/libraryValues';

   interface Props {
      name: string;
      tex?: string;
      allowCopy: boolean;
      allowEdit: boolean;
   }

   const props = defineProps<Props>();

   const state = reactive({
      showMenu: false,
      animate: false,
      holdConstant: undefined as MathNode | undefined,
   });

   const graphState = appState.env.animated.getState(props.name);

   //   const isImported = computed(() => hasImportExpression(props.state));

   const emit = defineEmits<{
      (e: 'error', value: Error): void;
      (e: 'edit', value: string): void;
   }>();

   function remove() {
      appState.env.animated.delete(props.name);
   }

   function edit() {
      if (props.name.startsWith('anon: ')) {
         remove();
      } else {
         emit('edit', props.name);
      }
   }

   function getTex() {
      const value = appState.env.animated.get(props.name);
      return defined(value)
         ? appState.env.animated.toTex(props.name, value)
         : `${props.name} not found`;
   }

   function refreshTex() {
      addTexElement('tex_' + props.name, getTex());
      typeset();
   }

   updateAnimation();

   function copyToCurrent() {
      //         addImportExpression(props.state);
   }

   watch(
      () => graphState.value,
      () => {
         refreshTex();
      }
   );

   function updateAnimation() {
      const fnName = graphState.value.fnName;
      if (!defined(appState.env.expression.get(fnName))) {
         const fn = libraries.get('periodic')?.expression[fnName][0];
         assert(defined(fn), 'missing periodic function: ' + fnName);
         appState.env.expression.set(fnName, fn, { hidden: true });
         appState.env.items.get(fnName)!.hidden = true;
      }
      appState.env.animated.set(props.name, graphState.value, { hidden:  true});
      refreshTex();
   }

   const isImported = computed(() => false); // TODO
</script>

<template>
   <div
      class="cols GraphExpr lastSmall"
      :class="{ imported: isImported }"
      v-if="name !== 'time'"
   >
      <div class="rows">
         <div class="cols">
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
         <div class="cols lastSmall" v-if="appState.saveEditable">
            <o-field label="From">
               <o-input
                  type="number"
                  v-model="graphState.value.from"
                  @change="updateAnimation"
               ></o-input>
            </o-field>
            <o-field label="To">
               <o-input
                  type="number"
                  v-model="graphState.value.to"
                  @change="updateAnimation"
               ></o-input>
            </o-field>
            <o-field label="Period">
               <o-input
                  type="number"
                  v-model="graphState.value.period"
                  @change="updateAnimation"
               ></o-input>
            </o-field>
            <o-field label="Type">
               <!-- TODO drive this from the periodic library -->
               <o-select
                  v-model="graphState.value.fnName"
                  @change="updateAnimation"
               >
                  <option value="sinal">sinal</option>
                  <option value="zigZag">zigZag</option>
               </o-select>
            </o-field>
         </div>
         <div class="cols">
            <span class="tex" :id="'tex_' + name">{{ state.toString() }} </span>
         </div>
         <div class="cols" v-if="graphState.description">
            <span class="fullRow">{{ graphState.description }}</span>
         </div>
      </div>
      <div class="rows">
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
