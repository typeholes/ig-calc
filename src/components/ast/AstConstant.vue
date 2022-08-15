<script setup lang="ts">
import { MathNodeObject } from 'src/js/math/mathUtil';

interface Props {
  node: MathNodeObject;
}

const props = defineProps<Props>();
</script>

<template>
  <div>{{ props.node.label }} : TODO constant ast interface</div>
</template>
