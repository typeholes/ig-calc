<script setup lang="ts">
import { reactive } from "vue";
</script>

<template>
  <div>
    copy the formula below<br />
    <h2>simple = inc_cnt + 1</h2>
    <br />
    go to the Calc tab and past the formula into the new expression input box
    (wide input below the graph)<br />
    click the Add button<br />
    go to the game tab and click the buy button a few times<br />
    you should see the cost and GameVar a going up.<br />
    The cost goes up exponentially, let's change it to a linear cost increase.
    <br />
    go to the Editor tab and change the costFn from inc_cost to simple <br />
    again, click the buy button a few times and you should see that the cost
    increases linearly <br />
  </div>
</template>
