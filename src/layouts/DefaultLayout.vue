<template>
  <div class="default-layout" :class="{ 'no-layout': isFullScreen }">
    <AppNavbar 
      v-if="!isFullScreen" 
      @open-trip-modal="openTripPlanner"
    />

    <main class="main-content" :class="{ 'no-layout-content': isFullScreen }">
      <router-view />
    </main>

    <!-- TripPlanner 독립 모달 - 간단한 사용법 -->
    <TripPlanner 
      v-if="showTripModal"
      :is-modal="true"
      @close="closeTripPlanner"
      @trip-created="handleTripCreated"
    />

    <AppFooter v-if="!isFullScreen" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from "vue-router";
import AppNavbar from "@/components/common/layout/AppNavbar.vue";
import AppFooter from "@/components/common/layout/AppFooter.vue";
import TripPlanner from "@/components/travel/TripPlanner.vue";

const route = useRoute();
const router = useRouter(); // router 추가
const hideLayoutRoutes = ["travel-planner"];
const isFullScreen = hideLayoutRoutes.includes(route.name);

// 모달 표시 상태
const showTripModal = ref(false)

// 여행 계획 모달 열기
const openTripPlanner = () => {
  showTripModal.value = true
}

// 여행 계획 모달 닫기
const closeTripPlanner = () => {
  showTripModal.value = false;
};

// 여행 계획 생성 완료 처리
const handleTripCreated = () => {
  // 여행 계획이 성공적으로 생성되면 일정 계획 페이지로 이동
  router.push({ name: "travel-planner" });
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/glassmorphism" as *;

.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-top: $spacing-3xl;
  margin-bottom: $spacing-2xl;
}

// 헤더/푸터 없이 꽉 채우는 레이아웃
.no-layout .main-content,
.main-content.no-layout-content {
  padding-top: 0;
  margin-bottom: 0;
}
</style>