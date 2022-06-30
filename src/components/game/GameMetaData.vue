<script setup lang="ts">
import { isArray } from "@vue/shared";
import { isObject } from "util";
import { reactive } from "vue";
import { errorable, on } from "../../js/Either";
import { hasProp, hasPropIs } from "../../js/function-plot/utils";
import { isString } from "../../js/util";
import { addNewExpr, state as igCalcState } from "../uiUtil";
import { game, GameButton, GameVar, isItemType, addGameItem } from "./game";

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
      console.log(err);
      debugger;
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
      if (!hasProp(obj.game, "items")) {
        state.errors = "missing game.items object";
        return;
      }

      const fns = obj.fns as Record<string, string>;
      for (const name in fns) {
        state.errors = fns[name];
        addNewExpr(name, fns[name]);
      }

      const items = Object.values(obj.game.items as Record<string, unknown>);
      state.errors = `${items}`;

      game.items = {};
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
          addGameItem(gameVar, false);
        } else if (
          entry.type === "GameButton" &&
          hasPropIs(entry, "costFn", isString) &&
          hasPropIs(entry, "cntFn", isString) &&
          hasPropIs(entry, "currencyFn", isString)
        ) {
          const gameButton: GameButton = entry;
          addGameItem(gameButton, false);
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

:deep(*) {
  background-color: black;
}
</style>
