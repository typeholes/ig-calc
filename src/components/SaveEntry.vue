<script setup lang="ts">
import { defineProps } from "vue";

interface Props {
  name: string;
  description: string;
  showDescription?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="saveEntry">
    <div>{{ name }}</div>
    <div class="description" v-if="showDescription">{{ description }}</div>
  </div>
</template>

<style scoped>
.saveEntry {
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(108, 180, 243);
  border-radius: 5px;
  text-align:left ;
  padding: 2px;
  background-color: rgb(57, 57, 57);
}

.saveEntry > div {
  background-color: rgb(57, 57, 57);
}

div .description {
  background-color: rgb(27, 27, 27);
  flex: auto;
}
</style>
