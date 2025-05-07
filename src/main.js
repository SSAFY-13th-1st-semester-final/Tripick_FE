import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/global.css';
import './assets/tailwind.css';
import 'font-awesome/css/font-awesome.min.css';


import axios from 'axios';

// baseURL 수정 (mvc 삭제)
axios.defaults.baseURL = '/api'; // Spring 서버 주소

createApp(App)
  .use(router)
  .use(store) 
  .mount('#app');
