<script setup lang="ts">
import { GameVar, getValue } from "./game";

const props = defineProps<{ item: GameVar }>();

</script>

<template>
  <div>valueFn: {{ item.valueFn }}: {{ getValue(item.valueFn) }}</div>
</template>
