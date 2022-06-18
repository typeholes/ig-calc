<script setup lang="ts">
import { GameVar, getValue } from "./game";

const props = defineProps<{ item: GameVar }>();

</script>

<template>
  <span> {{ getValue(item.valueFn) }}</span>
</template>
