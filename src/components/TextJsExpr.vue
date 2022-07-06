<script setup lang="ts">
   import { ValidExpr } from './expressions';
   import { getJavaScript } from '../js/math/mathUtil';

   interface props {
      expr: ValidExpr;
   }
   const props = defineProps<props>();
</script>

<template>
   <div>{{ getJavaScript(expr.node) }}</div>
</template>
