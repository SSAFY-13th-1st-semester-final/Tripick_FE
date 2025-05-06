import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/tailwind.css';
import 'font-awesome/css/font-awesome.min.css';

import axios from 'axios';

axios.defaults.baseURL = '/mvc';

createApp(App)
  .use(router)
  .use(store) 
  .mount('#app');
