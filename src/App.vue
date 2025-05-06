<template>
  <div>
    <!-- 네비게이션 바 컴포넌트 -->
    <NavBar />

    <!-- 라우터 뷰 영역 -->
    <router-view />

    <!-- 푸터 컴포넌트 -->
    <AppFooter />
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue';
import AppFooter from './components/Footer.vue'; 

export default {
  name: 'App',
  components: {
    NavBar, 
    AppFooter,
  },
};
</script>

<style>
</style>
