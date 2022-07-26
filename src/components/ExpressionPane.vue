<script setup lang="ts">

import { shallowRef } from 'vue';
import DisplayAnimation from './expression/gui/DisplayAnimation.vue';
import DisplayConstant from './expression/gui/DisplayConstant.vue';
import DisplayExpresssion from './expression/gui/DisplayExpresssion.vue';
import NewExpression from './NewExpression.vue';

import { state, } from './uiUtil';

const graphComponents = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  constant: shallowRef(DisplayConstant),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  animated: shallowRef(DisplayAnimation),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  expression: shallowRef(DisplayExpresssion),
};

function lookupGraphComponent(name: string) {
  const tag = state.env.items.get(name)?.typeTag ?? '';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const component = graphComponents[tag];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return component.value;
}
</script>

<template>
  <div class="ig-calc">
        <div class="transparent">
          <div class="cols lastSmall">
            <div>
              <label for="exprComponent">Display expressions as</label>
              <select id="exprComponent" v-model="state.exprComponent">
                <option value="expr">Expression</option>
                <option value="text">Plain Text</option>
                <option value="js">JavaScript (experimental)</option>
              </select>
            </div>
            <div>
              <o-checkbox v-model="state.runTimer">Run Timer</o-checkbox>
            </div>
          </div>
          <div class="expressions" :key="name" v-for="name in state.env.names">
            <component
              :is="lookupGraphComponent(name)"
              :name="name"
              :allow-copy="false"
              :allow-edit="false"
            ></component>
          </div>
          <div
            class="expressions"
            v-if="state.saveEditable && state.exprBarExpanded"
          >
            <NewExpression></NewExpression>
          </div>
        </div>
  </div>
</template>
