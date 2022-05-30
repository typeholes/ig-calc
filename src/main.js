
window.global = global;

import { createApp } from "vue";
import App from "./components/App.vue";

let app = createApp(App);
//app.use(ST.init());
app.mount("#app");
