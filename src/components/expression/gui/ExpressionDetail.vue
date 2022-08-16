<script setup lang="ts">
import { state as saveState } from 'src/components/SaveWidget';
import TexSpan from 'src/components/TexSpan.vue';
import { EnvExpr } from 'src/js/env/EnvExpr';
import { tex2html } from 'src/js/typeset';
import {
  nodeToObjectTree,
  getBody,
  MathNodeObject,
} from 'src/js/math/mathUtil';
import * as M from 'mathjs';
import { defined } from 'src/js/util';
import { defineSSRCustomElement, reactive, ref } from 'vue';
import AstConstant from 'src/components/ast/AstConstant.vue';
import AstCalledFunction from 'src/components/ast/AstCalledFunction.vue';
import AstOperator from 'src/components/ast/AstOperator.vue';
import AstSymbol from 'src/components/ast/AstSymbol.vue';
import { QTree } from 'quasar';
import { resolvePackageEntry } from 'vite';

interface Props {
  name: string;
  syncExprPane: () => void;
  readOnly?: boolean | undefined;
}

const props = defineProps<Props>();
let graphState = saveState.currentEnv.expression.getState(props.name);

const state = reactive({
  node: graphState.value.node,
  simpleNode: graphState.value.simpleNode,
  isSimplified: graphState.value.isSimplified,
  tree: graphState.value.node ? [nodeToObjectTree(graphState.value.node)] : [],
  error: graphState.value.error,
  selected: 'none' as string,
  replaced: undefined as M.MathNode | undefined,
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

function updateExpr() {
  const node = state.node;
  if (!defined(node)) {
    return;
  }
  saveState.currentEnv.expression.set(props.name, EnvExpr(node.toString()));
  syncGraphState();
}

const treeEl = ref<InstanceType<typeof QTree> | null>(null);

function getSelectedObject() {
  const selected = treeEl.value?.getNodeByKey(state.selected) as MathNodeObject;
  return selected?.label === props.name ? undefined : selected;
}

function replaceSelected() {
  if (!defined(state.node)) {
    return;
  }
  const obj = getSelectedObject();
  const node = obj?.mathNode;
  const parent = obj?.parent;
  if (!defined(node) || !defined(parent)) {
    return;
  }

  state.replaced = state.node.transform((oldNode) => {
    return oldNode === node ? new M.ConstantNode(-27) : oldNode;
  });
}

function acceptReplacement() {
  if (!defined(state.replaced)) {
    return;
  }

  saveState.currentEnv.expression.set(
    props.name,
    EnvExpr(state.replaced.toString())
  );
  syncGraphState();
}

function onSelect() {
  state.replaced = undefined;
}
</script>

<template>
  <q-card style="width: 75vw; height: 90vh" class="bg-transparent-dark">
    <q-btn
      style="position: absolute; right: 0"
      flat
      round
      icon="close"
      v-close-popup
    />
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
      <div class="row col">selected: {{ state.selected }}</div>
      <div class="row col">
        <q-tree
          :nodes="state.tree"
          node-key="id"
          :no-nodes-label="state.error"
          default-expand-all
          dense
          v-model:selected="state.selected"
          selected-color="positive"
          color="primary"
          dark
          ref="treeEl"
          @update:selected="onSelect"
        >
          <template v-slot:default-body="prop">
            <div :class="{ 'bg-info': state.selected === prop.node.id }">
              <ast-operator
                v-if="prop.node.type === 'OperatorNode'"
                :node="prop.node"
                :expr-name="props.name"
                :update-expr="updateExpr"
                :sync-parent="syncGraphState"
              />
              <ast-called-function
                v-else-if="
                  prop.node.childIdx === 0 &&
                  prop.node.parent?.type === 'FunctionNode'
                "
                :node="prop.node"
              />
              <ast-constant
                v-else-if="prop.node.type === 'ConstantNode'"
                :node="prop.node"
              />
              <ast-symbol
                v-else-if="prop.node.type === 'SymbolNode'"
                :node="prop.node"
                :root="state.node"
                :rootName="props.name"
              />
              <div
                class="tex q-py-md text-white"
                v-else-if="prop.node.type != 'ParenthesisNode'"
              >
                <tex-span :expr="prop.node.mathNode"> </tex-span>
              </div>
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
    <div class="bg-secondary q-pl-sm q-pt-sm inset-shadow shadow" style="height: 20vh">
      {{ getSelectedObject()?.label }}<br />
      <q-btn label="replace with -27" @click="replaceSelected" />
      <div class="row" v-if="state.replaced">
        <span class="q-ma-sm q-px-xs bg-transparent-dark tex " v-html="tex2html(state.replaced?.toTex())"></span>
      </div>
      <q-btn label="Accept Replacement" @click="acceptReplacement" v-if="state.replaced" />
    </div>
  </q-card>
</template>
