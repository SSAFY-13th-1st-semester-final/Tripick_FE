<template>
  <div class="app-container">
    <AppHeader v-if="!isMapView" />

    <div :class="isMapView ? 'flex-grow overflow-hidden' : 'content-area'">
      <router-view />
    </div>

    <AppFooter v-if="!isMapView" />
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/layout/Header.vue';
import AppFooter from '@/components/layout/Footer.vue';

export default {
  name: 'App',
  components: { AppHeader, AppFooter },
  setup() {
    const route = useRoute();
    const isMapView = computed(() => route.path === '/map');
    return { isMapView };
  },
};
</script>

<style>
html, body {
  overflow-x: hidden;
  width: 100%;
}

html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Apple SD Gothic Neo', sans-serif;
}

* {
  font-family: inherit;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 50px;
}
</style>
