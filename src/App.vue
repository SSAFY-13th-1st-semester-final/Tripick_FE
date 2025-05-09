<template>
  <div class="app-container">
    <!-- 스크롤 시 같이 올라가는 헤더 -->
    <AppHeader />

    <!-- 콘텐츠 영역 -->
    <div class="content-area">
      <router-view />
    </div>

    <!-- 스크롤 끝에 나오는 일반적인 푸터 -->
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
  overflow-y: auto; /* 콘텐츠 영역에서 스크롤 가능 */
  padding-bottom: 50px; /* 푸터가 가려지지 않도록 여백 추가 */
}

footer {
  background-color: #f3f4f6;
  color: #fff;
  text-align: center;
  padding: 0.5rem;
  width: 100%;
}

footer .hover\:text-white:hover {
  font-weight: 600;
  color: gray;
}
</style>
