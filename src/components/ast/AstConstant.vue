<script setup lang="ts">
import { MathNodeObject } from 'src/js/math/mathUtil';

interface Props {
  node: MathNodeObject;
}

const props = defineProps<Props>();
</script>

<template>
<!-- probably don't want to display anything for consants -->
  <div hidden>{{ props.node.label }} : TODO constant ast interface</div>
</template>
