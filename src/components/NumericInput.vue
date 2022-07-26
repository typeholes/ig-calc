<script setup lang="ts">
   import { reactive } from 'vue';
   import { isValidNumber } from '../js/function-plot/utils';
   import { defined } from '../js/util';

   const props = defineProps<{ value: number; min?: number; max?: number }>();

   const emit = defineEmits<{
      (e: 'update:value', value: number): void;
   }>();

   const tmp = reactive({ value: props.value, valid: true });

   function validate(e: Event) {
      let num: undefined | number = undefined;
      function check(p: (n: number) => boolean, msg: string, fix = false) {
         tmp.valid = p(num!);
        if (tmp.valid) { emit('update:value', num!); }
         if (fix) {
            tmp.value = num!;
            tmp.valid = true;
         }
         const target = e.target as HTMLInputElement;
         target.setCustomValidity(tmp.valid ? '' : msg);
         //         target.reportValidity();
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

         check(isValidNumber, 'invalid number');
         if (!tmp.valid) return;

         num = num * negate;

         check(
            () => defined(value.match(/((^-)|[0-9.e]|(e-))$/)),
            'last digit invalid',
            true
         );
         if (!tmp.valid) return;

         check((x) => x >= (props.min ?? x), 'below minimum');
         if (!tmp.valid) return;

         check((x) => x <= (props.max ?? x), 'above maximum');
         if (!tmp.valid) return;

         check(() => !defined(value.match(/^[^0-9-.]/)), 'invalid number');
         if (!tmp.valid) return;

         console.log('end', { tmp, props });
         return;
      }
      console.log('???');
   }

   function change(e: Event) {
      if (!tmp.valid) {
         tmp.valid = true;
         tmp.value = props.value;
      }
      tmp.value = Math.min(
         props.max ?? tmp.value,
         Math.max(props.min ?? tmp.value, tmp.value)
      );
      (e.target as HTMLInputElement).setCustomValidity(
         tmp.valid ? '' : 'invalid'
      );
      emit('update:value', tmp.value);
   }
</script>

<template>
   <input
      v-model="tmp.value"
      @input="(e) => validate(e)"
      @change="(e) => change(e)"
      :size="tmp.value.toString().length"
      :customValidity="tmp.valid"
   />
</template>
