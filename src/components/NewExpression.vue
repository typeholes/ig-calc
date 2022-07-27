<script setup lang="ts">
import { reactive, computed } from 'vue';
import { EnvTypeTag } from '../js/env/EnvType';
import { state as appState } from './uiUtil';
import { EnvExpr } from '../js/env/EnvExpr';
import { Animation } from '../js/env/Animation';
import AInput from './qDefaulted/AInput.vue';
import ABtn from './qDefaulted/ABtn.vue';

const state = reactive({
  name: '',
});

function validateName(name: string) {
  return appState.env.items.has(name) ? 'Name already exists' : true;
}

const disableAdd = computed(
  () =>
    state.name === '' ||
    state.name === 'time' ||
    appState.env.items.has(state.name)
);

function addExpr(type: EnvTypeTag) {
  if (state.name === '') {
    return;
  }
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
  <div class="rows NewExpr">
    <div label-class="textCentered" label="New expression name">
      <a-input v-model="state.name" outlined :rules="[validateName]" />
    </div>
    <div class="cols">
      <template :key="type" v-for="(_, type) in buttonTypeText">
        <a-btn
          :disable="disableAdd"
          @click="addExpr(type)"
          :label="buttonText(state.name, type)"
          no-caps
          color="primary"
          glossy
          rounded
          push
        />
      </template>
      <div></div>
    </div>
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
