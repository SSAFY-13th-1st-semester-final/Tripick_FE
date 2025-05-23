import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.scss'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()

const app = createApp(App)

pinia.use(piniaPluginPersistedstate)

app.use(router)
   .use(pinia)
   .mount('#app')

if (import.meta.env.DEV) {
  window.__VUE_APP__ = app;
}