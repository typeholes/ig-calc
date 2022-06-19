<script setup lang="ts">
import { game, addGameVars, GameVar, GameButton, addGameItem, itemExists } from "./game";
import EditItem from "./EditItem.vue";
import { onMounted, reactive } from "vue";

onMounted(() => {
  addGameVars();
});

const state = reactive({
  newLabel: "a",
})

function addVariable() {
  addGameItem( GameVar(state.newLabel, 'time'))
}
function addButton() {
  addGameItem( GameButton(state.newLabel, 'inc_cost', 'inc_cnt','time'))
}

</script>

<template>
  <div class="grid">
    <div v-for="item in game.items">
      <EditItem :item="item"></EditItem>
    </div>
    <span class="col1"> Add Game Item </span> <input type="text" v-model="state.newLabel" width="20" class="col2" />
    <button @click="addVariable" :disabled="itemExists(state.newLabel)" class="col3">Variable</button>
    <button @click="addButton" :disabled="itemExists(state.newLabel)" class="col4">Button</button><br/>
    <span style="color: darkred">{{ itemExists(state.newLabel) ? state.newLabel + " already exists" : "" }}</span>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-auto-columns: 1fr;
}

button {
  background-color: rgb(79, 91, 96);
}

button:disabled {
  background-color: rgb(107, 43, 43);
}
</style>