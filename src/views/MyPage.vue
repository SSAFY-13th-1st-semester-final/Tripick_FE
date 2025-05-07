<template>
  <div class="relative min-h-screen">
    <!-- 내정보 컴포넌트 추가 -->
    <div class="absolute top-0 left-0 w-[300px]">
      <MyInfo />
    </div>
    <!-- 여기에 나머지 MyPage 콘텐츠들 -->
  </div>
</template>

<script setup>
import MyInfo from '@/components/MyInfo.vue'
</script>
