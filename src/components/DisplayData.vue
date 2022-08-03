<script setup lang="ts">
import { Errorable, errorable } from '../js/Either';
import { EnvItem } from '../js/env/exprEnv';
import { defined, isString } from '../js/util';
import { Map as IMap } from 'immutable';
import { computed, reactive } from 'vue';
import { currentEnv } from 'src/components/SaveWidget';
import { arrayRange } from 'src/js/function-plot/utils';

function getNames() {
  const names = IMap(currentEnv.value.items).filter((item) => item.showGraph);
  return names;
}

const names = computed(() => getNames().filter((item) => item.showGraph));

function formatNumber(n: number | string | undefined /*row: number*/) {
  if (isString(n)) {
    return n;
  }

  return defined(n) ? n.toExponential(3) : '';
}

function runFn(name: string, item: EnvItem, n: number) {
  return errorable(() => {
    const datum = currentEnv.value.getDatum(name);
    if (defined(datum) && datum.evalFn instanceof Function) {
      return datum.evalFn(n);
    }
    return 0;
  });
}

const columns = computed(() => [
  {
    name: 'free',
    label: 'free',
    sortable: true,
    field: 'free',
    style: `border: 1px solid white`,
    headerStyle: `border: 1px solid white`,
    required: true,
    format: formatNumber,
    align: 'right',
  } as const,
  ...names.value
    .map(
      (item, name) =>
        ({
          name,
          label: name,
          sortable: true,
          field: name,
          style: `border: 1px solid ${item.color}`,
          headerStyle: `border: 1px solid ${item.color}`,
          required: false,
          format: formatNumber,
          align: 'right',
        } as const)
    )
    .values(),
]);

function rows(freeValues: number[]) {
  return freeValues.map((x) => {
    const ret = { free: x } as Record<string, string | number>;
    names.value.forEach((item) => {
      if (!defined(item)) {
        return;
      }
      ret[item.name] = Errorable.on(runFn(item.name, item, x), {
        Left: (e) => e.message as string | number,
        Right: (n) => n,
      });
    });
    return ret;
  });

}

// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
const freeValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 987654321.0123456789].concat(
  arrayRange(0, 120)
);
</script>

<template>
  <div class="fixed-center q-pa-md">
    <!-- <q-scroll-area id="data-grid-scroll-area"> -->
    <q-table
      :rows="rows(freeValues)"
      :columns="columns"
      row-key="free"
      virtual-scroll
      dense
      style="height: 80vh"
    />
    <!-- </q-scroll-area> -->
  </div>
</template>
