<script setup lang="ts">
   import { reactive } from 'vue';
   import { isValidNumber } from '../js/function-plot/utils';
   import { defined } from '../js/util';

   const props = defineProps<{ value: number; min?: number; max?: number }>();

   const emit = defineEmits<{
      (e: 'update:value', value: number): void;
   }>();

   const tmp = reactive({ value: props.value, valid: true });

   function validate(final: boolean, e: Event) {
      let num: undefined | number = undefined;
      function check(p: (n: number) => boolean, fix = false) {
         tmp.valid = p(num!);
         if (tmp.valid) {
            emit('update:value', num!);
         } else if (final) {
            tmp.value = props.value;
            tmp.valid = true;
         } else if (fix) {
            tmp.value = num!;
            tmp.valid = true;
         }
      }
      if (e.target instanceof HTMLInputElement) {
         const value = e.target.value;
         let negate = 1;
         let str = value.trim();
         if (str.endsWith('`')) {
            negate = -1;
            str = str.replace('`', '');
         }
         num = parseFloat(e.target.value);

         check(isValidNumber);
         if (!tmp.valid) return;

         num = num * negate;
         if (final) {
            if (defined(props.min)) {
               num = Math.max(props.min, num);
            }
            if (defined(props.max)) {
               num = Math.min(props.max, num);
            }
         }

         check(() => defined(value.match(/((^-)|[0-9.e]|(e-))$/)), true);
         if (!tmp.valid) return;

         check((x) => x >= (props.min ?? x) && x <= (props.max ?? x));
         if (!tmp.valid) return;

         check(() => !defined(value.match(/^[^0-9-.]/)));
         if (!tmp.valid) return;

         console.log('end', { final, tmp, props });
         return;
      }
      console.log('???');
   }
</script>

<template>
   <input
      :style="{ borderColor: tmp.valid ? '#595958' : '#990000' }"
      v-model="tmp.value"
      @input="(e) => validate(false, e)"
      @change="(e) => validate(true, e)"
      :size="tmp.value.toString().length"
   />
</template>
