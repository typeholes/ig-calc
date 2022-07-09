<script setup lang="ts">
import { reactive } from 'vue';
import { isValidNumber } from '../js/function-plot/utils';
import { defined } from '../js/util';

const props = defineProps<{ value: number, min?: number, max?: number }>();

const emit = defineEmits<{
   (e: 'update:value', value: number): void;
}>();

const tmp = reactive({ value: props.value });

function validate(e: Event) {
   if (e.target instanceof HTMLInputElement) {
      let negate = 1;
      let str = e.target.value;
      if (str.endsWith('`')) {
         negate = -1;
         str.replace('`', '');
      }
      let num = parseFloat(e.target.value);
      if (isValidNumber(num)) {
         num = num * negate;
         if (defined(props.min)) { num = Math.max(props.min, num) }
         if (defined(props.max)) { num = Math.min(props.max, num) }

         if (!e.target.value.match(/([.e]|e-)$/)) {
            tmp.value = num
         }
         emit('update:value', num);
      } else {
         tmp.value = props.value;
      }
   }
}
</script>

<template>
   <input v-model="tmp.value" @input="(e) => validate(e)" :size="tmp.value.toString().length" />
</template>
