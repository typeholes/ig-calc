<script setup lang="ts">
import { reactive, computed } from 'vue';
import { EnvTypeTag } from '../js/env/EnvType';
import { state as appState } from './uiUtil';
import { EnvExpr } from '../js/env/EnvExpr';
import { Animation } from '../js/env/Animation';

const state = reactive({
  name: '',
});

const disableAdd = computed(
  () =>
    state.name === '' ||
    state.name === 'time' ||
    appState.env.items.has(state.name)
);

function addExpr(type: EnvTypeTag) {
  const newName = state.name;
  state.name = '';
  if (type === 'constant') {
    appState.env.constant.set(newName, 0);
    return;
  }
  if (type === 'expression') {
    appState.env.expression.set(newName, EnvExpr(`${newName} = sin(x)`));
    return;
  }
  if (type === 'animated') {
    appState.env.animated.set(newName, Animation('zigZag', 0, 5, 3));
    return;
  }
}

const buttonTypeText: Record<EnvTypeTag, (s: string) => string> = {
  constant: (name: string) => `${name} = 0`,
  animated: (name: string) => `${name}(time)`,
  expression: (name: string) => `${name} = x`,
} as const;

function buttonText(name: string, type: EnvTypeTag) {
  const shortName = name.substring(0, 4);
  const formatter: (s: string) => string = buttonTypeText[type];
  return formatter(shortName);
}
</script>

<template>
  <div class="cols NewExpr">
    <div label-class="textCentered" label="New expression name">
      <input v-model="state.name" />
    </div>
    <template :key="type" v-for="(_, type) in buttonTypeText">
      <button :disabled="disableAdd" @click="addExpr(type)">
        {{ buttonText(state.name, type) }}
      </button>
    </template>
    <div></div>
  </div>
</template>

<style>
.NewExpr {
  border: 1px solid bisque;
  border-radius: 4px;
  gap: 3px;
  padding: 2px;
}

button {
  border-radius: 7px;
}

.textCentered {
  text-align: center;
}
</style>
