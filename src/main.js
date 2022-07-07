window.global = global;

import { createApp } from 'vue';
import App from './components/App.vue';
import { Slider, Field, Select, Input } from '@oruga-ui/oruga-next';
import '@oruga-ui/oruga-next/dist/oruga.css';

let app = createApp(App).use(Slider).use(Field).use(Input).use(Select);
//app.use(ST.init());
app.mount('#app');
