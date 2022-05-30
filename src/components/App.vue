<script setup lang="ts">
import IgCalc from "./IgCalc.vue";
import { globalTheme } from "../js/theme";

const theme = globalTheme ?? {};

</script>

<template>
  <IgCalc></IgCalc>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

:deep(*) {
  background-color: v-bind("theme.backgroundColor");
  color: v-bind("theme.color");
  text-align: center;
}
</style>

<style>
html {
    background-color: black;
}
</style>
