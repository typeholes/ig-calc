<script setup lang="ts">
import { state as saveState } from 'src/components/SaveWidget';
import TexSpan from 'src/components/TexSpan.vue';
import { EnvExpr } from 'src/js/env/EnvExpr';
import { tex2html } from 'src/js/typeset';
import { nodeToObjectTree, opMap } from 'src/js/math/mathUtil';
import * as M from 'mathjs';
import { defined } from 'src/js/util';
import { reactive } from 'vue';

interface Props {
  name: string;
  syncExprPane: () => void;
}

const props = defineProps<Props>();
let graphState = saveState.currentEnv.expression.getState(props.name);

const state = reactive({
  node: graphState.value.node,
  simpleNode: graphState.value.simpleNode,
  isSimplified: graphState.value.isSimplified,
  tree: graphState.value.node ? [nodeToObjectTree(graphState.value.node)] : [],
  error: graphState.value.error,
});

function syncGraphState() {
  graphState = saveState.currentEnv.expression.getState(props.name);
  state.node = graphState.value.node;
  state.simpleNode = graphState.value.simpleNode;
  state.isSimplified = graphState.value.isSimplified;
  (state.tree = graphState.value.node
    ? [nodeToObjectTree(graphState.value.node)]
    : []),
    (state.error = graphState.value.error);
  props.syncExprPane();
}
const dependencies = graphState.value.vars.map((dep) => {
  if (saveState.currentEnv.order.includes(dep)) {
    const type = saveState.currentEnv.getType(dep);
    return [dep, type, saveState.currentEnv[type].getState(dep).value] as const;
  }

  return [dep, 'free', 0];
});

function makeSimple() {
  if (!defined(state.simpleNode)) {
    return;
  }
  saveState.currentEnv.expression.set(
    props.name,
    EnvExpr(state.simpleNode.toString())
  );
  syncGraphState();
}

function changeOp(n: M.OperatorNode, newOp: string) {
  const node = state.node;
  if (!defined(node)) {
    return;
  }
  if (newOp in opMap) {
    const newFn = opMap[newOp as keyof typeof opMap];
    if (!defined(newFn)) {
      return;
    }
    // @ts-expect-error Don't care about the generics
    n.op = newOp;
    // @ts-expect-error Don't care about the generics
    n.fn = newFn;
  }

  if (newOp === 'swap_horiz') {
    n.args = [n.args[1], n.args[0]];
  }

  saveState.currentEnv.expression.set(props.name, EnvExpr(node.toString()));
  syncGraphState();
}

const ops = [...Object.keys(opMap), 'swap_horiz'];
</script>

<template>
  <q-card style="width: 75vw" class="bg-transparent-dark">
    <!-- <div class="tex q-py-md">
      <tex-span :expr="state.node"> </tex-span>
    </div> -->
    <q-scroll-area style="height: 70vh; width=100%" visible>
      <div class="row" v-if="!state.isSimplified">
        <q-btn dense label="Simplify" @click="makeSimple" color="primary" />
        <span
          class="q-ml-sm"
          v-html="tex2html(state.simpleNode?.toTex())"
        ></span>
      </div>
      <div class="row col">
        <q-tree
          :nodes="state.tree"
          node-key="id"
          :no-nodes-label="state.error"
          default-expand-all
          dense
        >
          <template v-slot:default-body="prop">
            <div class="row" v-if="prop.node.type === 'OperatorNode'">
              <div v-for="op in ops" :key="op">
                <q-btn
                  v-if="op in opMap"
                  class="q-mx-sm"
                  color="primary"
                  :label="op"
                  @click="changeOp(prop.node.mathNode, op)"
                />
                <q-btn
                  v-else
                  class="q-mx-sm"
                  color="primary"
                  :icon="op"
                  @click="changeOp(prop.node.mathNode, op)"
                />
              </div>
            </div>
            <div
              v-else-if="
                prop.node.childIdx === 0 &&
                prop.node.parent?.type === 'FunctionNode'
              "
            >
              replace function dropdown here
            </div>
            <div v-else-if="prop.node.type === 'ConstantNode'">
              numeric input here
            </div>
            <div v-else-if="prop.node.type === 'SymbolNode'">
               handle symbols here
            </div>
            <div class="tex q-py-md" v-else>
              <tex-span :expr="prop.node.mathNode"> </tex-span>
            </div>
          </template>
          <!-- <template v-slot:default-header="prop">
   id: {{ prop.node.id }}
</template > -->
        </q-tree>
      </div>
      <div class="column" v-for="[dep, type, value] of dependencies" :key="dep">
        <div class="row flex-center shadow-1">
          <span> {{ dep }} </span>
          <q-tab-panels
            :model-value="type"
            class="q-mini-drawer-hide col q-pa-xs"
          >
            <q-tab-panel name="free" class="q-pa-none"> free </q-tab-panel>
            <q-tab-panel name="constant" class="q-pa-none">
              {{ value }}
            </q-tab-panel>
            <q-tab-panel name="expression" class="q-pa-none">
              <div class="tex q-py-md">
                <tex-span :expr="(value as EnvExpr).node"> </tex-span>
                <!-- cast ok, as it handles the undefined result when value is not an EnvExpr -->
              </div>
            </q-tab-panel>
            <q-tab-panel name="animated" class="q-pt-none">
              Anim here
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </q-scroll-area>
  </q-card>
</template>
