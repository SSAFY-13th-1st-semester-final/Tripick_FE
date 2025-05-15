<!-- components/common/TravelHeader.vue -->
<template>
  <div class="flex items-center justify-center w-full h-12">
    <!-- 왼쪽: 지역명/어디 -->
    <div class="w-1/3 flex justify-end">
      <div class="overflow-hidden">
        <transition name="slide-fade" mode="out-in">
          <span
            v-if="!selectedRegion"
            key="default"
            class="flex items-center justify-end text-2xl font-bold text-blue-600"
          >이번에는 어디</span>
          <span
            v-else
            key="region"
            class="flex items-center justify-end text-2xl font-bold text-blue-600"
          >{{ selectedRegion }}</span>
        </transition>
      </div>
    </div>

    <!-- 가운데 텍스트 -->
    <span class="text-2xl font-bold text-gray-800 text-center select-none whitespace-nowrap">로 여행을 떠나</span>

    <!-- 오른쪽: 시나요? / 볼까요? -->
    <div class="w-1/3 flex justify-start overflow-hidden">
      <transition name="slide-fade" mode="out-in">
        <span
          v-if="!selectedRegion"
          key="ask"
          class="flex items-center justify-start text-2xl font-bold text-gray-800"
        >시나요?</span>
        <span
          v-else
          key="see"
          class="flex items-center justify-start text-2xl font-bold text-gray-800"
        >볼까요?</span>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TravelHeader',
  props: {
    selectedRegion: {
      type: String,
      required: false,
      default: ''
    }
  }
};
</script>

<style scoped>
/* 슬라이드 트랜지션 */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(32px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-32px);
}
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>