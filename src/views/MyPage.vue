<template>
  <div class="relative min-h-screen font-apple-sdgothic">
    <!-- 내정보 컴포넌트 추가 -->
    <div class="absolute top-10 left-10 w-[14rem]">
      <MyInfo />
    </div>
    <!-- 여기에 나머지 MyPage 콘텐츠들 -->
  </div>
</template>

<script setup>
import MyInfo from '@/components/MyInfo.vue'
</script>
