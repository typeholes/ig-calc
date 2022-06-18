<script setup lang="ts">
import EditVar from "./EditVar.vue";
import EditButton from "./EditButton.vue";

import { GameItem, ItemType } from "./game";

const props = defineProps<{ item: GameItem }>();

const editors: Record<ItemType, any> = {
  GameVar: EditVar,
  GameButton: EditButton,
} as const;
</script>

<template>
  <div>
    {{ item.type }}
    {{ item.label }}: 
    <component :is="editors[item.type]" :item="item"></component>
  </div>
  <br />
</template>
