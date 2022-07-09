window.global = global;

import { createApp } from 'vue';
import App from './components/App.vue';
import Oruga from '@oruga-ui/oruga-next';
import '@oruga-ui/oruga-next/dist/oruga.css';

let app = createApp(App).use(Oruga);
//app.use(ST.init());
app.mount('#app');
