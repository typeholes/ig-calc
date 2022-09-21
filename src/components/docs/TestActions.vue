<script setup lang="ts">
import { sendAction } from 'src/js/actions';
import { createDocChannel } from 'src/js/docs/receiver';
import { defined, unique } from 'src/js/util';
import { computed, ref } from 'vue';

const docChannel = createDocChannel();

let childWindow: Window | undefined = undefined;

function open() {
  childWindow =
    window.open(
      window.location.origin + window.location.pathname + '?docDriven=true',
      'DocTarget',
      'left=400'
    ) ?? undefined;

  sendTopic();
}

const tgtIds = ref([] as string[]);

function getTgtIds() {
  if (!defined(childWindow)) {
    return [];
  }

  const ids = Array.from(childWindow.document.querySelectorAll('[id]')).map(
    (el) => el.id
  );
  tgtIds.value = unique(ids);
}

const tgtId = ref('');

function sendTopic() {
  docChannel.postMessage({ topic: 'test topic' });
}

function goto() {
  sendAction(docChannel, 'goto', {
    delay: 0,
    args: { elementId: tgtId.value },
  });
}

function sendClick() {
  sendAction(docChannel, 'click', {
    delay: 0,
    args: { elementId: tgtId.value },
  });
}
</script>

<template>
  <div>
    <h1>docs here</h1>
    <q-btn label="open" @click="open" />
    <q-btn label="set topic" @click="sendTopic" />
    <q-select v-model="tgtId" :options="tgtIds" @update:model-value="goto" />
    <q-btn label="get ids" @click="getTgtIds" />
    <q-btn label="click" @click="sendClick" />
  </div>
</template>
