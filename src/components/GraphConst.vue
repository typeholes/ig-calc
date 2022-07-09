<script setup lang="ts">
import { addTexElement, typeset } from '../js/typeset';
import { nextTick, reactive, computed, watch } from 'vue';
import { MathNode } from 'mathjs';
import { state as appState } from './uiUtil';
import { notBlank } from '../js/util';

import { GraphConstant } from '../js/GraphItem';
import NumericInput from './NumericInput.vue';

interface Props {
   graphItem: GraphConstant;
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

//   const isImported = computed(() => hasImportExpression(props.graphItem));

const emit = defineEmits<{
   (e: 'error', value: Error): void;
   (e: 'edit', value: string): void;
}>();

function remove() {
   appState.env.deleteConstant(props.graphItem.name);
}

function edit() {
   if (props.graphItem.name.startsWith('anon: ')) {
      remove();
   } else {
      emit('edit', props.graphItem.name);
   }
}

function graphFn() {
   return props.graphItem.name.startsWith('anon: ')
      ? props.graphItem.value.toString()
      : `${props.graphItem.name} = ${props.graphItem.value}`;
}

function refreshTex() {
   addTexElement(
      'tex_' + props.graphItem.name,
      props.tex ?? graphFn().replace('=', ':=')
   );
   typeset();
}

addTexElement(
   'tex_' + props.graphItem.name,
   props.tex ?? graphFn().replace('=', ':=')
);

function copyToCurrent() {
   //         addImportExpression(props.graphItem);
}

watch(
   () => props.graphItem.value,
   () => {
      refreshTex();
   }
);

watch(
   () => props.graphItem.showGraph,
   (show) => appState.env.showGraph(props.graphItem.name, show)
)

watch(
   () => props.graphItem.color,
   (color) => appState.env.colorGraph(props.graphItem.name, color)
)

function toggleShowValue() {
   props.graphItem.showValue = !props.graphItem.showValue;
}

function toggleAnimate() {
   //TODO
}

const isImported = computed(() => false); // TODO

const slider = reactive({ min: -50, max: 50 });

let heldValue = props.graphItem.value;
watch(slider, () => {
   console.log({ heldValue });
   nextTick(
      () =>
      (props.graphItem.value = Math.max(
         slider.min,
         Math.min(heldValue, slider.max)
      ))
   );
});
function holdSliderValue() {
   heldValue = props.graphItem.value;
   console.log({ heldValue });
}
</script>

<template>
   <div class="cols GraphExpr lastSmall" :class="{ imported: isImported }" v-if="graphItem.name !== 'time'">
      <div class="rows">
         <div class="cols">
            <span v-if="
               !props.graphItem.name.startsWith('anon:') &&
               props.graphItem.name !== '__tmp'
            ">
               {{ props.graphItem.name }}
            </span>
            <input class="gridCheck" type="checkbox" v-model="graphItem.showGraph" :id="`show:${graphItem.name}`" />
            <input class="colorPicker" type="color" v-model="graphItem.color" :id="`color:${graphItem.name}`" />
         </div>
         <div class="cols lastSmall">
            <o-field class="fullRow" label="">
               <o-slider v-model="graphItem.value" :step="0.01" :min="slider.min" :max="slider.max"
                  style="padding: 10px">
                  <o-slider-tick :value="slider.min">
                     <NumericInput class="sliderCap left" v-model:value="slider.min" :max="slider.max - 1"
                        @click="(e) => e.stopPropagation()"></NumericInput>
                  </o-slider-tick>
                  <o-slider-tick :value="slider.max">
                     <NumericInput class="sliderCap right" v-model:value="slider.max" :min="slider.min + 1"
                        @click="(e) => e.stopPropagation()"></NumericInput>
                  </o-slider-tick>
               </o-slider>
            </o-field>
            <button @click="toggleAnimate">
               {{ state.animate ? 'Make Constant' : 'Animate' }}
            </button>
         </div>
         <div class="cols">
            <span class="tex" :id="'tex_' + graphItem.name">{{ graphItem.toString() }}
            </span>
         </div>
         <div class="cols" v-if="graphItem.description">
            <span class="fullRow">{{ graphItem.description }}</span>
         </div>
      </div>
      <div class="rows">
         <button class="menuButton" @click="state.showMenu = !state.showMenu">
            &#9776;
         </button>
         <template v-if="state.showMenu">
            <button class="menuButton" :disabled="
               notBlank(appState.newExpr) && props.graphItem.name !== '__tmp'
            " @click="remove()">
               Remove
            </button>
            <button class="menuButton" v-if="props.allowEdit" :disabled="notBlank(appState.newExpr)" @click="edit()">
               Edit
            </button>
            <button class="menuButton" v-if="props.allowCopy" @click="copyToCurrent()" :disabled="isImported">
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

.lastSmall> :last-child {
   flex: 0 1 fit-content;
   margin-left: auto;
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
   position: absolute
}
</style>
