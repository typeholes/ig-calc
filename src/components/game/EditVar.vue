<script setup lang="ts">
import { GameVar, getUsableFnNames } from "./game";

const props = defineProps<{ item: GameVar }>();
</script>

<template>
  <div>
    valueFn:
    <select v-model="item.valueFn">
      <option
        v-for="[name, usable] in getUsableFnNames(item)"
        :value="name"
        :disabled="!usable"
      >
        {{ name }}
      </option>
    </select>
  </div>
</template>
