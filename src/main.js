import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/global.css';
import './assets/tailwind.css';

import axios from 'axios';
axios.defaults.baseURL = '/api';

import { useKakao } from 'vue3-kakao-maps/@utils';

useKakao('e275d3ecdc79f7233649e9ee24d2e982'); 

const app = createApp(App);

app
  .use(router)
  .use(store)
  .mount('#app');
