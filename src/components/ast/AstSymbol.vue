<script setup lang="ts">
import { MathNodeObject, getBody, getDerivative } from 'src/js/math/mathUtil';
import { state as saveState } from 'src/components/SaveWidget';
import { MathNode, SymbolNode } from 'mathjs';
import TexSpan from 'src/components/TexSpan.vue';
import { EnvExpr } from 'src/js/env/EnvExpr';
import { tex2html } from 'src/js/typeset';

interface Props {
  node: MathNodeObject;
  root: MathNode | undefined;
  rootName: string;
}

const props = defineProps<Props>();

const symbol = props.node.mathNode as SymbolNode;
const bound = saveState.currentEnv.order.includes(symbol.name);
const type = saveState.currentEnv.getType(symbol.name);
const value = bound
  ? saveState.currentEnv[type].getState(symbol.name).value
  : 0;

</script>

<template>
  <div class="col text-white">
    <q-expansion-item dense v-if="bound" :label="symbol.name + ': bound'">
      <q-tab-panels :model-value="type" class="col q-pa-xs">
        <q-tab-panel name="free" class="q-pa-none"> free </q-tab-panel>
        <q-tab-panel name="constant" class="q-pa-none">
          {{ value }}
        </q-tab-panel>
        <q-tab-panel name="expression" class="q-pa-none">
          <div class="tex q-py-md text-white">
            <tex-span :expr="(value as EnvExpr).node"> </tex-span>
            <!-- cast ok, as it handles the undefined result when value is not an EnvExpr -->
          </div>
        </q-tab-panel>
        <q-tab-panel name="animated" class="q-pt-none"> Anim here </q-tab-panel>
      </q-tab-panels>
    </q-expansion-item>
    <q-expansion-item dense v-else :label="symbol.name + ': free'">
        <span v-if="props.root"
          class="q-ml-sm"
          v-html="tex2html('\\frac{\\partial ' + props.rootName + '}{\\partial ' + symbol.name + '}' + getDerivative(getBody(props.root), symbol.name, saveState.currentEnv.getMathEnv()).toTex())"
        ></span>

    </q-expansion-item>
  </div>
</template>
