<script setup lang="ts">
import { MathNodeObject } from 'src/js/math/mathUtil';
import { opMap } from 'src/js/math/mathUtil';
import * as M from 'mathjs';
import { defined } from 'src/js/util';

interface Props {
  node: MathNodeObject;
  syncParent: () => void;
  updateExpr: () => void;
  exprName: string;
}

const props = defineProps<Props>();

const ops = [...Object.keys(opMap), 'swap_horiz'];

function changeOp(n: M.OperatorNode, newOp: string) {
  const node = props.node.mathNode;
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

  props.updateExpr();
  props.syncParent();
}
</script>

<template>
  <div class="row q-pb-xs">:
    <div v-for="op in ops" :key="op">
      <q-btn
        v-if="op in opMap"
        class="q-mx-sm q-px-sm"
        color="primary"
        :label="op"
        :disable="op === (props.node.mathNode as M.OperatorNode).op"
        size="xs"
        @click="changeOp(props.node.mathNode as M.OperatorNode, op)"
      />
      <q-btn
        v-else
        class="q-mx-sm q-px-sm"
        color="primary"
        :icon="op"
        size="xs"
        @click="changeOp(props.node.mathNode as M.OperatorNode, op)"
      />
    </div>
  </div>
</template>
