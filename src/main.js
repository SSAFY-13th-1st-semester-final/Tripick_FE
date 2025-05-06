import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/tailwind.css';
import 'font-awesome/css/font-awesome.min.css';

import axios from 'axios';

// axios 기본 URL 설정
axios.defaults.baseURL = '/mvc';

// ✅ Vuex store도 등록
createApp(App)
  .use(router)
  .use(store) // 이 줄이 꼭 필요함!
  .mount('#app');
