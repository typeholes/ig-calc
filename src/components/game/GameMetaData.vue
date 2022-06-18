<script setup lang="ts">
import { isArray } from "@vue/shared";
import { reactive } from "vue";
import { errorable, on } from "../../js/Either";
import { hasProp, hasPropIs } from "../../js/function-plot/utils";
import { isString } from "../../js/util";
import { addNewExpr, state as igCalcState } from "../uiUtil";
import { game, GameButton, GameVar, isItemType } from "./game";

function getMetaData() {
  const fns = igCalcState.env.map((v, k) => v.node.toString());
  return JSON.stringify({ fns, game }, null, "\t");
}

const state = reactive({
  meta: getMetaData(),
  errors: "",
});

function fromGame() {
  state.meta = getMetaData();
  state.errors = "";
}

function toGame() {
  const parsed = errorable(() => JSON.parse(state.meta));
  on(parsed, {
    Left: (err) => {
      state.errors = err.message;
    },
    Right: (obj) => {
      if (!hasProp(obj, "fns")) {
        state.errors = "missing fns object";
        return;
      }
      if (!hasProp(obj, "game")) {
        state.errors = "missing game object";
        return;
      }
      if (!hasPropIs(obj.game, "items", isArray)) {
        state.errors = "missing game.items array";
        return;
      }

      const fns = obj.fns as Record<string, string>;
      for (const name in fns) {
        state.errors = fns[name];
        addNewExpr(name, fns[name]);
      }

      const items: unknown[] = obj.game.items;
      state.errors = `${items}`;

      game.items = [];
      for (const entry of items) {
        const entryStr = JSON.stringify(entry, null, "\t");
        if (!hasPropIs(entry, "label", isString)) {
          state.errors = `missing label in ${entryStr}`;
          return;
        }
        if (!hasPropIs(entry, "type", isItemType)) {
          state.errors = `invalid item type in ${entryStr}`;
          return;
        }
        if (entry.type === "GameVar" && hasPropIs(entry, "valueFn", isString)) {
          const gameVar: GameVar = entry;
          game.items.push(gameVar);
        } else if (
          entry.type === "GameButton" &&
          hasPropIs(entry, "costFn", isString) &&
          hasPropIs(entry, "cntFn", isString)
        ) {
          const gameButton: GameButton = entry;
          game.items.push(gameButton);
        } else {
          state.errors = `invalid functions in ${entryStr}`;
          return;
        }
      }

      state.errors = "";
    },
  });
}
</script>

<template>
  <div class="grid">
    <button class="col1" @click="fromGame">Refresh From Game</button>
    <button class="col2" @click="toGame">Update Game</button>
    <pre class="error" v-if="state.errors !== ''">{{ state.errors }} </pre>
    <textarea
      spellcheck="false"
      class="metadata row3"
      cols="120"
      rows="80"
      v-model="state.meta"
    ></textarea>
  </div>
</template>

<style scoped>
.metadata {
  text-align: left;
  grid-column: 1/3;
}
.grid {
  display: grid;
  grid-auto-columns: 1fr;
}
.error {
  color: red;
  grid-row: 2;
}
</style>
