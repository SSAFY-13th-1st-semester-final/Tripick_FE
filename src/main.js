import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/global.css';
import './assets/tailwind.css';
import 'font-awesome/css/font-awesome.min.css';


import axios from 'axios';

axios.defaults.baseURL = '/api'; // Spring 서버 주소

createApp(App)
  .use(router)
  .use(store) 
  .mount('#app');
