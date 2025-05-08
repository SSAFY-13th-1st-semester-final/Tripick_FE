<template>
  <div>
    <!-- 네비게이션 바 컴포넌트 -->
    <AppHeader />

    <!-- 라우터 뷰 영역 -->
    <router-view />

    <!-- 푸터 컴포넌트 -->
    <AppFooter />
  </div>
</template>

<script>
import AppHeader from './components/Header.vue';
import AppFooter from './components/Footer.vue'; 

export default {
  name: 'App',
  components: {
    AppHeader, 
    AppFooter,
  },
};
</script>

<style>
  html, body {
    font-family: 'Apple SD Gothic Neo', sans-serif;
  }
  * {
    font-family: inherit;
  }
</style>
