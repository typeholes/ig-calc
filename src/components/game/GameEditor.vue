<script setup lang="ts">
import { game, addGameVars, GameVar, GameButton } from "./game";
import EditItem from "./EditItem.vue";
import { onMounted, reactive } from "vue";

onMounted(() => {
  addGameVars();
});

const state = reactive({
  newLabel: "a",
})

function itemExists() {
  return game.items.findIndex( (x) => x.label === state.newLabel ) >= 0
}

function addVariable() {
  game.items.push( GameVar( state.newLabel, 'inc_cnt'))
}
function addButton() {
  game.items.push( GameButton(state.newLabel, 'inc_cost', 'inc_cnt'))

}
</script>

<template>
  <div class="grid">
    <div v-for="item in game.items">
      <EditItem :item="item"></EditItem>
    </div>
    <span class="col1"> Add Game Item </span> <input type="text" v-model="state.newLabel" width="20" class="col2" />
    <button @click="addVariable" :disabled="itemExists()" class="col3">Variable</button>
    <button @click="addButton" :disabled="itemExists()" class="col4">Button</button><br/>
    <span style="color: darkred">{{ itemExists() ? state.newLabel + " already exists" : "" }}</span>
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