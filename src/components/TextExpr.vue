<script setup lang="ts">
   import { ValidExpr } from '../js/expressions';

   interface props {
      expr: ValidExpr;
   }
   const props = defineProps<props>();
</script>

<template>
   <div>
      {{ expr.node.toString() }}
   </div>
</template>
