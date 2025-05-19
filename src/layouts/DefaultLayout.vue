<template>
  <div class="default-layout" :class="{ 'no-layout': isFullScreen }">
    <AppNavbar v-if="!isFullScreen" />

    <main class="main-content" :class="{ 'no-layout-content': isFullScreen }">
      <router-view />
    </main>

    <AppFooter v-if="!isFullScreen" />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import AppNavbar from "@/components/common/layout/AppNavbar.vue";
import AppFooter from "@/components/common/layout/AppFooter.vue";

const route = useRoute();
const hideLayoutRoutes = ["travel-planner"];
const isFullScreen = hideLayoutRoutes.includes(route.name);
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
