import * as mathjs from "mathjs";

global.math = mathjs;
window.math = mathjs;

export {};

// var eqRoot =
// Eq.newEqOp(
//   Eq.newEqVar("Var 1", "var1", 5),
//   "+",
//   Eq.newEqOp(
//     Eq.newEqVar("Var 2", "var2", 7),
//     "*",
//     Eq.newEqOp(
//       Eq.newEqVar("Var 3", "var3", 9),
//       "^",
//       Eq.newEqVar("Var 4", "var4", 11),
//     )
//   )
// );

// Vue.use((Vue) => {
//   Vue.prototype.$bubble = function $bubble(eventName, ...args) {
//     // Emit the event on all parent components
//     let component = this;
//     do {
//       component.$emit(eventName, ...args);
//       component = component.$parent;
//     } while (component);
//   };
// });

// Vue.__type('equation', {
//   props: { root: {}
//   },
//   data: function(){ return {
//     selected: eqRoot
//   }},
//   methods: {
//     handleSelection: function (e) {
//       this.selected = e;
//       displayExpr(this.root.eqString(), this.root.valString(e.eqString()), e.eqString());
//     }
//   },
//   template:
//   `
//   <div>
//     <component v-bind:is="root.__type" :src="root" v-on:select-term="handleSelection" ></component>
//     <div> selected: {{ selected.eqString() }}
//       Pretty: <div id="pretty"></div>
//       Pretty Val: <div id="pretty-val"></div>
//       Derivative: <div id="derivative"></div>
//       Derivative Val: <div id="derivative-val"></div>
//     </div>
//   </div>
//   `

// });

// Vue.__type('eq-var', {
//   props: {
//     src:{},
//   },
//   template:
//   `
//   <button v-on:click.self="$bubble('select-term',src)">
//     {{ src.displayName }}
//   </button>
//   `
//   })

// Vue.__type('eq-op', {
//   props: {
//     src:{},
//   },
//   methods: {
// //    logit: function(e) {  console.log('op'); }
//   },
//   template:
//   `
//   <button v-on:click.self="$bubble('select-term',src)" > (
//     <component v-bind:is="src.left.__type" :src="src.left" ></component>
//     {{ src.op }}
//     <component v-bind:is="src.right.__type" :src="src.right" ></component>
//     )
//     </button>
//   `
// })

// var app = new Vue({
//   el: '#app',
//   data: {
//     root: eqRoot
//   },
//   methods: {
//   },

// });
