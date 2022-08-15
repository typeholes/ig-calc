<script setup lang="ts">
import { MathNode } from 'mathjs';
import { node2html } from 'src/js/typeset';


const props = defineProps<{ expr: MathNode | undefined }>();

</script>


<template>
  <span v-html="node2html(props.expr)"></span>
</template>

