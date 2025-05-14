<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
    <div class="bg-white rounded-2xl p-8 w-full max-w-[95%] h-[90vh] relative flex flex-col items-center">
      <!-- 닫기 버튼 -->
      <button class="absolute top-3 right-4 text-3xl text-gray-600 hover:text-black" @click="$emit('close')">×</button>

      <!-- 제목 및 단계 안내 -->
      <h2 class="text-2xl font-bold text-center mb-4">
        어디로 여행을 떠나시나요?
        <span class="ml-4 text-lg">{{ selectedRegion }}</span>
      </h2>
      <p class="text-sm text-gray-500 mb-4">
        {{ slideIndex + 1 }}/2
      </p>

      <!-- 슬라이드 컨테이너 -->
      <div class="flex items-center w-full h-full">
        <!-- 좌측 버튼 -->
        <div class="w-[10%] flex justify-center">
          <button 
            class="text-2xl text-gray-600 hover:text-black"
            @click="prevSlide"
            v-if="slideIndex > 0" 
          >
            <span>&lt;</span>
          </button>
        </div>

        <!-- 슬라이드 영역 -->
        <div class="w-[80%] flex justify-center items-center overflow-hidden">
          <div class="flex w-full transition-transform duration-500 ease-in-out" :style="{ transform: `translateX(-${slideIndex * 100}%)` }">
            <!-- 첫 번째 슬라이드: KoreaMap -->
            <div class="flex-shrink-0 w-full flex justify-center items-center">
              <KoreaMap @region-selected="onRegionSelected" />
            </div>

            <!-- 두 번째 슬라이드: CalendarPopup -->
            <div class="flex-shrink-0 w-full flex justify-center items-center">
              <CalendarPopup />
            </div>
          </div>
        </div>

        <!-- 우측 버튼 -->
        <div class="w-[10%] flex justify-center">
          <button 
            class="text-2xl text-gray-600 hover:text-black"
            @click="nextSlide"
            v-if="slideIndex < 1" 
          >
            <span>&gt;</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KoreaMap from '@/components/destinations/KoreaMap.vue';
import CalendarPopup from '@/components/date/CalendarPopup.vue';

export default {
  name: 'KoreaMapModal',
  components: { KoreaMap, CalendarPopup },
  data() {
    return {
      selectedRegion: '',
      slideIndex: 0,  // 슬라이드 인덱스 (0: KoreaMap, 1: CalendarPopup)
    };
  },
  methods: {
    onRegionSelected(region) {
      console.log('부모 컴포넌트에서 받은 지역:', region);
      this.selectedRegion = region;
    },
    nextSlide() {
      if (this.slideIndex < 1) {
        this.slideIndex++;
      }
    },
    prevSlide() {
      if (this.slideIndex > 0) {
        this.slideIndex--;
      }
    },
  }
};
</script>

<style scoped>
/* 슬라이드 컨텐츠에 대한 스타일 */
.transition-transform {
  transition: transform 0.5s ease-in-out;
}

/* 버튼 스타일 */
button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 2rem;
}

button:hover {
  color: black;
}
</style>
