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
    A game with just one button is pretty boring, let's add another <br />
    Add these formulas on the calc tab <br />
    <h2>a = inc_cnt + big_cnt * 10</h2>
    <h2>big_cnt = 0</h2>
    <h2>big_cost = big_cnt * 2^big_cnt</h2>
    <br />
    now go to the Editor tab, enter "big boy" in the Add Game Item input, and
    press Button<br />
    A new GameButton named big boy should have been created<br />
    Set its costFn to big_cost and its cntFn to big_cnt<br />
    Set the valueFn for GameVar a to a<br />
    go to the game tab and you should have two working buttons<br />
  </div>
</template>
