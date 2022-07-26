<script setup lang="ts">
import { defined, } from "../../js/util";
import { GameButton, getUsableFnNames, updateButtonCurrency } from "./game";

const props = defineProps<{ item: GameButton }>();

function changeCurrency(e: Event) {
  debugger;
  const target = e.target as HTMLSelectElement;
  if (defined(target.value)) {
    const newCurrencyFn = target.value;
    updateButtonCurrency(props.item, props.item.currencyFn, newCurrencyFn);
    // props.item.currencyFn = newCurrencyFn;
  }
}
</script>

<template>
  <div>
    <!-- costFn:
    <select v-model="item.costFn">
      <option
        v-for="[name, usable] in getUsableFnNames(item)"
        :value="name"
        :disabled="!usable"
      >
        {{ name }}
      </option>
    </select>
  </div>
  <div>
    cntFn:
    <select v-model="item.cntFn">
      <option
        v-for="[name, usable] in getUsableFnNames(item)"
        :value="name"
        :disabled="!usable"
      >
        {{ name }}
      </option>
    </select>
  </div>
  <div>
    currencyFn:
    <select :value="item.currencyFn" @change="changeCurrency">
      <option
        v-for="[name, usable] in getUsableFnNames(
          item,
          item.cntFn,
          item.costFn
        )"
        :value="name"
        :disabled="!usable"
      >
        {{ name }}
      </option>
    </select>
    -->
  </div>
</template>
