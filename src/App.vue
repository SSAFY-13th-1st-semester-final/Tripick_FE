<template>
  <div class="app-container">
    <!-- 항상 보여지는 헤더 -->
    <AppHeader v-if="!isMapView" />

    <!-- 콘텐츠 영역 -->
    <div :class="isMapView ? 'flex-grow overflow-hidden' : 'content-area'">
      <router-view />
    </div>

    <!-- MapView가 아닐 때만 푸터 보여줌 -->
    <AppFooter v-if="!isMapView" />
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/Header.vue';
import AppFooter from './components/Footer.vue';

export default {
  name: 'App',
  components: { AppHeader, AppFooter },
  setup() {
    const route = useRoute();
    const isMapView = computed(() => route.path === '/map'); // 정확한 경로 확인
    return { isMapView };
  },
};
</script>

<style>
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
  padding-bottom: 50px; /* 푸터가 가려지지 않도록 */
}
</style>
