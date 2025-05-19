<template>
  <div class="app">
    <div class="app-background"></div>
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>

    <AppNotification />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import TokenMonitorService from '@/services/token-monitor.service';
import AppNotification from "@/components/common/utils/AppNotification.vue";

// Auth 스토어 접근
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  // 인증 상태 초기화
  authStore.initAuth();
  
  // 로그인 상태면 토큰 모니터링 시작
  if (isAuthenticated.value) {
    TokenMonitorService.startMonitoring();
  }
});

// 인증 상태 변경 감시
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    // 로그인 됨 - 모니터링 시작
    TokenMonitorService.startMonitoring();
  } else {
    // 로그아웃 됨 - 모니터링 중지
    TokenMonitorService.stopMonitoring();
  }
});

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  TokenMonitorService.stopMonitoring();
});
</script>

<style lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 페이지 전환 애니메이션 */
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