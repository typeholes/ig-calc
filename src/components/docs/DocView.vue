<script setup lang="ts">
import { mkAction, sendActions } from 'src/js/actions';
import { createDocChannel } from 'src/js/docs/receiver';
import { defined } from 'src/js/util';

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

const steps = [
  {
    text: 'goto new expression button',
    action: mkAction('goto', { delay: 0.3, args: { elementId: 'NewExprBtn' } }),
  },
  {
    text: 'click it',
    action: mkAction('click', {
      delay: 0.5,
      args: { elementId: 'NewExprBtn' },
    }),
  },
  {
    text: 'goto new expression name input',
    action: mkAction('goto', {
      delay: 0.5,
      args: { elementId: 'newExprInput' },
    }),
  },
  {
    text: 'enter a name',
    action: mkAction('type', {
      delay: 0.5,
      args: { elementId: 'newExprInput', value: 'RickRoll' },
    }),
  },
  {
    text: 'type a few more characters',
    action: mkAction('type', {
      delay: 0.5,
      args: { elementId: 'newExprInput', value: 'abcdefghilmnop' },
    }),
  },
];

function sendTopic() {
  docChannel.postMessage({ topic: 'test topic' });
}

function doSteps(until: number) {
  const stopAt = Math.min(until, steps.length);
  const isOpen = defined(childWindow);
  if (isOpen) {
    childWindow.close();
  }
  open();
  if (defined(childWindow)) {
    childWindow.onload = () => {
      sendTopic();
      sendActions(docChannel, steps.slice(0, stopAt + 1));
    };
    return;
  }
}
</script>

<template>
  <div>
    <h1>docs here</h1>
    <q-btn label="open" @click="open" />
    <div class="col">
      <div v-for="(step, idx) of steps" :key="idx">
        <div class="row items-start">
          <div>{{ step.text }}</div>
          <div>
            <q-btn dense label="showMe" @click="doSteps(idx)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
