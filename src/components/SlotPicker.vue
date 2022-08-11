<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ modelValue: string; names: string[]; includeActive?: boolean }>();

const inmodelValue = computed(() =>
  props.includeActive ? props.names : props.names.filter((name) => name !== props.modelValue)
);

const emit = defineEmits<{ (event: 'update:modelValue', modelValue: string): void }>();

function select(name: string) {
  emit('update:modelValue', name);
}

</script>

<template>
  <q-toolbar>
    <slot :name="modelValue"></slot>
    <q-space />
    <q-btn label=">">
      <q-menu anchor="top right" self="top left" :offset="[40,40]">
        <q-list v-for="name in inmodelValue" :key="name">
          <q-item class="q-mt-lg">
          <q-radio :modelValue="modelValue" :val="name" @update:model-value="select"/>
        <slot :name="name"></slot>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </q-toolbar>
</template>
