<script setup lang="ts">
import { defineProps, reactive, ref } from "vue";
import { SaveId } from "../js/SaveManager";

interface Props {
  id: SaveId;
  description?: string;
  showDescription?: boolean;
  deleted: boolean;
}

const props = defineProps<Props>();

</script>

<template>
  <div :class="{saveEntry: true, deleted: props.deleted}">
    <div>{{ id.name }}  </div>
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

.saveEntry.deleted {
  border-color: red; 
  background-color: rgb(87, 57, 57);
  border-style: dashed;
  text-decoration: line-through;
}

.saveEntry.deleted > div {
  background-color: rgb(87, 57, 57);
  text-decoration: line-through;
}
.saveEntry > div {
  background-color: rgb(57, 57, 57);
}

div .description {
  background-color: rgb(27, 27, 27);
  flex: auto;
}
</style>
