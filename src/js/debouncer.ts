import { reactive, watch } from 'vue';

export function debouncedReactive<T extends object>(state: T) {
   const tgtState = reactive(structuredClone(state)) as T;
   const srcState = reactive(structuredClone(state)) as T;

   // probably need to have the held state reactive to keep deep reactivity
   const holdState = reactive(structuredClone(state)) as T;

   for (const key in state) {
      watch(
         () => srcState[key],
         (value, old) => {
            if (value !== old) holdState[key] = value;
         }
      );
      watch(
         () => tgtState[key],
         (value, old) => {
            if (value !== old) srcState[key] = value;
         }
      );
   }

   const onTick = () => {
      for (const key in state) {
         tgtState[key] = holdState[key];
      }
   };

   return { srcState, tgtState, onTick };
}
