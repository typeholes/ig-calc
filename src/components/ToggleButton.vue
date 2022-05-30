
<script setup lang="ts">

import { ref } from 'vue';

interface Props {
  labelOn: string,
  labelOff: string
  colorOn: string,
  colorOff: string,
  valueOn: any,
  valueOff: any
}

const props = withDefaults(defineProps<Props>(), {
  colorOn: "#dee7a7",
  colorOff: "#dee7a7",
  labelOff: "",
  valueOn: true as any,
  valueOff: false as any
});

defineEmits<{
  (e: 'update:value', value: any): void
}>();

const state = ref(true);

</script>

<template>
    <button :style="{backgroundColor: state ? colorOn : colorOff}" @click="state=!state; $emit('update:value', state ? valueOn : valueOff)">{{ state ? labelOn : labelOff || labelOn}}</button>
</template>
