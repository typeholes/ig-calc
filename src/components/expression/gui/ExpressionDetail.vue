<script setup lang="ts">
import { state as saveState } from 'src/components/SaveWidget';
import TexSpan from 'src/components/TexSpan.vue';

interface Props {
  name: string;
}

const props = defineProps<Props>();
let graphState = saveState.currentEnv.expression.getState(props.name);

const dependencies = graphState.value.vars.map((dep) => {
  if (saveState.currentEnv.order.includes(dep)) {
    const type = saveState.currentEnv.getType(dep);
    return [dep, type, saveState.currentEnv[type].getState(dep).value] as const;
  }

  return [dep, 'free', 0];
});
</script>

<template>
  <q-card style="width: 50vw" class="bg-transparent-dark">
    <div class="tex q-py-md">
      <tex-span :id="'tex_' + props.name" >
      </tex-span>
    </div>
    <q-scroll-area style="height: 80vh" visible>
      <div class="column" v-for="([dep, type, value]) of dependencies" :key="dep">
        <div class="row flex-center shadow-1 " >
          <span > {{ dep }} </span>
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
                <tex-span :id="'tex_' + dep">
                </tex-span>
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
