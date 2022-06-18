<script setup lang="ts">
import DisplayButton from "./DisplayButton.vue";
import DisplayVar from "./DisplayVar.vue";

import { GameItem, ItemType } from "./game";

const props = defineProps<{ item: GameItem }>();

const editors: Record<ItemType, any> = {
  GameVar: DisplayVar,
  GameButton: DisplayButton,
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
