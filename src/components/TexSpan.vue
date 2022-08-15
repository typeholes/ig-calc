<script setup lang="ts">
import { getTex } from 'src/js/typeset';


const props = defineProps<{ id: string }>();

</script>


<template>
  <span v-html="getTex(props.id)"></span>
</template>

