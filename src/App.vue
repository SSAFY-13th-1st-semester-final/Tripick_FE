<template>
  <div class="app">
    <!-- 배경 요소 -->
    <div class="app-background"></div>
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 라우터 뷰 - key 추가하여 항상 재렌더링 -->
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>

    <!-- 글로벌 알림 컴포넌트 -->
    <AppNotification />
  </div>
</template>
<script setup>
// Composition API를 사용한 App 컴포넌트
import AppNotification from "@/components/common/utils/AppNotification.vue";
</script>

<style lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 개선된 페이지 전환 애니메이션 */
.fade-enter-active {
  transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
