<script setup lang="ts">
import { processSlotOutlet } from '@vue/compiler-core';
import { reactive } from 'vue';

interface Props {
    collapsed: boolean,
    topColSpec?: string,
    bottomColSpec?: string,
}

const props = withDefaults(defineProps<Props>(), {
    collapsed: false,
    topColSpec: "45%",
    bottomColSpec: "2fr"
});

const emit = defineEmits<{
 (e: 'update:collapsed', value: boolean): void
}>();

type TopBottom = 'bottom';

function getLabel(isCollapsed: boolean) : string {
    return isCollapsed ? '\u00BB' : '\u00AB';
}

const theme = reactive({
    color : 'rgb(255,255,255)',
    bottom : { width: props.bottomColSpec, collapsed: props.collapsed}
});

    function toggle(side: TopBottom) {
        if ( props.collapsed ) {
            theme[side].width = props.topColSpec;
        } else {
            theme[side].width = '0%';
        }
        emit('update:collapsed', !props.collapsed);
    }
    
</script>

<template>
<div class="container">
    <div class="vSplitter">
       <div class="vTop">
           <slot name="top"></slot>
       </div> 
       <div @click="toggle('bottom')" class="collapseTop"> {{ getLabel(collapsed) }} </div>
       <div class="vBottom">
       <div v-if="!props.collapsed">
           <slot name="bottom"></slot>
       </div> 
       </div> 
    </div>
    </div>
</template>

<style scoped>
 .vSplitter {
   display: grid;
   grid-template-rows: v-bind('props.topColSpec') min-content v-bind('theme["bottom"].width');
   grid-template-columns: 1fr min-content 1fr;
   grid-gap: 1px;
}

.vTop   {
  grid-column: 1/span3;;
  grid-row: 1;
}

.vBottom {
  grid-column:1/span 3;
  grid-row: 3;
}

.collapseTop {
    grid-column: 2;
    grid-row: 2;
    transform: rotateZ(.25turn)
} 

</style>