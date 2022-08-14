<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string; names: string[];
  includeActive?: boolean
  static?: boolean
}>();

const inmodelValue = computed(() =>
  props.includeActive ? props.names : props.names.filter((name) => name !== props.modelValue)
);

const emit = defineEmits<{ (event: 'update:modelValue', modelValue: string): void }>();

function select(name: string) {
  emit('update:modelValue', name);
}

</script>

<template>
  <q-toolbar class="q-pl-xs">
    <q-btn icon="edit" dense unelevated >
      <q-menu anchor="top right" self="top left" :offset="[365,40]">
        <q-list v-for="name in inmodelValue" :key="name">
          <q-item class="q-mt-lg">
          <q-radio :modelValue="modelValue" :val="name" @update:model-value="select" v-if="!props.static"/>
        <slot :name="name"></slot>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <slot :name="modelValue"></slot>
  </q-toolbar>
</template>
