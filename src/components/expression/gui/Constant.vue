<script setup lang="ts">
   import { addTexElement, typeset } from 'js/typeset';
   import { nextTick, reactive, computed, watch } from 'vue';
   import { MathNode } from 'mathjs';
   import { state as appState } from 'components/uiUtil';
   import { defined, notBlank } from 'js/util';

   import NumericInput from 'components/NumericInput.vue';

var x = 1
console.log(x);

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

   const graphState = appState.env.constant.getState(props.name);

   //   const isImported = computed(() => hasImportExpression(props.state));

   const emit = defineEmits<{
      (e: 'error', value: Error): void;
      (e: 'edit', value: string): void;
   }>();

   function remove() {
      appState.env.constant.delete(props.name);
   }

   function edit() {
      if (props.name.startsWith('anon: ')) {
         remove();
      } else {
         emit('edit', props.name);
      }
   }

   function getTex() {
      const value = appState.env.constant.get(props.name);
      return defined(value)
         ? appState.env.constant.toTex(props.name, value)
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

   const slider = reactive({ min: -50, max: 50 });

   let heldValue = graphState.value;
   watch(slider, () => {
      console.log({ heldValue });
      // if (slider.min > slider.max) {
      //    [slider.min, slider.max] = [slider.max, slider.min];
      // }
      // if (slider.min === slider.max) {
      //       slider.min--;
      // }
      void nextTick(() => {
         const [min, max] = [slider.min, slider.max].sort(); // handle reversed range;
         graphState.value = Math.max(min, Math.min(heldValue, max));
      });
   });
   //   function holdSliderValue() {
   heldValue = graphState.value;
   //   }
</script>

<template>
   <div
      class="cols GraphExpr lastSmall"
      :class="{ imported: isImported }"
      v-if="name !== 'time' || appState.showHiddenExpressions"
   >
      <div class="rows">
         <div class="cols wrap">
            <span 
            :style="{display: appState.exprBarExpanded ? 'inline' : 'block'}"
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
         <div class="cols lastSmall" v-if="appState.saveEditable">
            <o-field class="fullRow" label="">
               <o-slider
               expand
                  v-model="graphState.value"
                  :step="0.01"
                  :min="slider.min"
                  :max="slider.max"
                  style="padding: 10px"
               >
                  <o-slider-tick :value="slider.min">
                     <NumericInput
                        class="sliderCap left"
                        v-model:value="slider.min"
                        @click="(e) => e.stopPropagation()"
                     ></NumericInput>
                     <!-- :max="slider.max - 1" -->
                  </o-slider-tick>
                  <o-slider-tick :value="slider.max">
                     <NumericInput
                        class="sliderCap right"
                        v-model:value="slider.max"
                        @click="(e) => e.stopPropagation()"
                     ></NumericInput>
                     <!-- :min="slider.min + 1" -->
                  </o-slider-tick>
               </o-slider>
            </o-field>
         </div>
         <div class="cols">
            <span class="tex" :id="'tex_' + name">{{ state.toString() }} </span>
         </div>
         <div class="cols" v-if="graphState.description">
            <span class="fullRow">{{ graphState.description }}</span>
         </div>
         </template>
      </div>
      <div class="rows" v-if="appState.saveEditable && appState.exprBarExpanded">
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
