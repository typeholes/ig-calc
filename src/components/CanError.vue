<script setup lang="ts">
import { Errorable, isRight } from '../js/Either';

const props = defineProps<{ value: Errorable<unknown> }>();

</script>

<template>
<div>
    <template v-if="isRight(value)"> {{ value.value }} </template>
    <div v-else class="error" :title="value.value.message"> ERROR </div>
</div>
</template>

<style scoped>

.error {
    background-color: rgb(63, 17, 17);
    color: red
}
</style>