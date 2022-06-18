<script setup lang="ts">
import { reactive } from "vue";

function setTutorialData() {
  const newMeta = `
{
	"fns": {
		"anon: sin(x)": "sin(x)",
		"anon: cos(x)": "cos(x)",
		"anon: -sin(x)": "-sin(x)",
		"anon: -cos(x)": "-cos(x)",
		"inc_cnt": "inc_cnt = 0",
		"inc_cost": "inc_cost = inc_cnt * 1.25 ^ inc_cnt",
		"fish_cnt": "fish_cnt = 0",
		"fish_cost": "fish_cost = fish_cnt * 5",
		"dog_cnt": "fish_cnt = 0",
		"dog_cost": "fish_cost = inc_cnt * dog_cnt",
		"cat_cnt": "cat_cnt = 0",
		"cat_cost": "cat_cost = cat_cnt * sin(cat_cnt)",
                "totalPets": "totalPets = fish_cnt + dog_cnt + cat_cnt"
	},
	"game": {
		"items": [
                        
			{
				"label": "Number of Pets",
				"type": "GameVar",
				"valueFn": "totalPets"
			},
			{
				"label": "Increment a",
				"type": "GameButton",
				"costFn": "inc_cost",
				"cntFn": "inc_cnt"
			},
			{
				"label": "Fish",
				"type": "GameButton",
				"costFn": "fish_cost",
				"cntFn": "fish_cnt"
			},
			{
				"label": "Dog",
				"type": "GameButton",
				"costFn": "dog_cost",
				"cntFn": "dog_cnt"
			},
			{
				"label": "Cat",
				"type": "GameButton",
				"costFn": "cat_cost",
				"cntFn": "cat_cnt"
			}
		]
	}
}`;
   navigator.clipboard.writeText(newMeta).then(function() {
     alert('clipboard successfully set');
  }, function() {
     alert('clipboard write failed');
  });
}
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
  go to the game tab and you should have two working buttons<br /><br/>
  Game metadata can also be editted directly as JSON instead of using the editting UI<br/>
  Check out the JSON on the MetaData Tab<br>
  Then click this button to fill your clipboard with a more interesting set of meta data <button @click="setTutorialData">Set Meta Data</button><br>
  Go to the MetaData tab, paste to replace the current meta data, and click Update Game<br>
  Check out the game tab, it should be a little more interesting now<br>

  </div>
</template>
