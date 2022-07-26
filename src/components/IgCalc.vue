<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<script setup lang="ts">
import { computed } from 'vue';

import NewExpression from './NewExpression.vue';

import ColorPicker from './ColorPicker.vue';

import { state } from './uiUtil';

const exprNames = computed(() => {
  //      const names = ISet(state.env.names);
  return []; //names.filter((name) => graph.options.data[name]?.show).toArray();
});
</script>

<template>
  <div class="ig-calc">
    <FakeCursor></FakeCursor>
    <section>
      <o-sidebar
        :v-if="false"
        :fullwidth="false"
        :fullheight="true"
        :overlay="false"
        :can-cancel="false"
        :open="!state.saveBarExpanded"
        :right="true"
        content-class="save-bar"
      >
        <SaveWidget></SaveWidget>
      </o-sidebar>
    </section>
    <div>
      <o-tabs type="toggle" position="top" variant="success">
        <o-tab-item label="Graph">
          <KeepAlive>
            <DisplayGraph></DisplayGraph>
          </KeepAlive>
        </o-tab-item>
        <o-tab-item label="Grid">
          <DisplayData :names="exprNames"></DisplayData>
        </o-tab-item>
        <o-tab-item label="None">
          <div style="width: 90vw">&nbsp;</div>
        </o-tab-item>
        <o-tab-item label="Color">
          <div style="width: 75vw"><ColorPicker></ColorPicker></div>
        </o-tab-item>
      </o-tabs>
    </div>
  </div>
</template>
