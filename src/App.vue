<template>
  <div class="app">
    <!-- 배경 요소들 -->
    <div class="app-background"></div>
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 메인 라우터 뷰 -->
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>

    <!-- 알림 컴포넌트 -->
    <AppNotification />

    <!-- 개발자 도구 (개발 환경에서만) -->
    <DevPanel />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import TokenMonitorService from '@/services/token-monitor.service';
import AppNotification from "@/components/common/utils/AppNotification.vue";
import DevPanel from "@/components/common/utils/DevPanel.vue";

// 스토어 접근
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { isAuthenticated } = storeToRefs(authStore);

// 초기화 타이머
let initializationTimeout = null;

// 인증 초기화
const initializeAuth = async () => {
  try {
    // 인증 상태 초기화
    await authStore.initAuth();
    
    // 로그인 상태면 토큰 모니터링 시작
    if (isAuthenticated.value) {
      TokenMonitorService.startMonitoring();
    }
    
  } catch (error) {
    console.error('❌ 애플리케이션 초기화 실패:', error);
    notificationStore.showError('애플리케이션 초기화 중 오류가 발생했습니다.');
  }
};

// 인증 상태 변경 처리
const handleAuthChange = (newValue) => {
  if (newValue) {
    // 로그인 됨 - 모니터링 시작
    TokenMonitorService.startMonitoring();
  } else {
    // 로그아웃 됨 - 모니터링 중지
    TokenMonitorService.stopMonitoring();
  }
};

// 라이프사이클 훅
onMounted(() => {
  // 초기화 지연으로 DOM 준비 대기
  initializationTimeout = setTimeout(initializeAuth, 100);
});

onBeforeUnmount(() => {
  if (initializationTimeout) {
    clearTimeout(initializationTimeout);
  }
});

onUnmounted(() => {
  TokenMonitorService.stopMonitoring();
});

// 인증 상태 변경 감시
watch(isAuthenticated, handleAuthChange);
</script>

<style lang="scss">
@use '@/assets/styles' as *;

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 배경 요소들 */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ffffff, #f5f7fa);
  z-index: -1;
}

.bg-shapes {
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  opacity: 0.5;
  
  .shape {
    position: absolute;
    opacity: 0.15;
    
    &.shape-1 {
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: linear-gradient(45deg, $accent-color, #5b21b6);
      top: -100px;
      right: -100px;
    }
    
    &.shape-2 {
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: linear-gradient(45deg, #0ea5e9, #06b6d4);
      bottom: -200px;
      left: -150px;
    }
    
    &.shape-3 {
      width: 200px;
      height: 200px;
      border-radius: 40%;
      background: linear-gradient(45deg, #f59e0b, #fcd34d);
      top: 30%;
      left: 10%;
    }
  }
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