<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-3xl p-4 w-full max-w-[55%] h-[70vh] relative flex flex-col">
      <!-- 닫기 버튼 -->
        <button
          class="absolute top-4 right-5 z-30 text-gray-500 hover:text-gray-800 transition-colors duration-200"
          @click="$emit('close')"
        >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- 헤더 및 단계 안내 -->
      <div class="flex flex-col items-center w-full mb-4">
        <div class="relative h-12 flex items-center justify-center w-full mb-1">
          <TravelHeader v-if="slideIndex === 0" :selectedRegion="selectedRegion" />

          <h2 v-if="slideIndex === 1" class="text-2xl font-bold text-gray-800 flex items-center">
            여행 기간이
            <transition name="slide-fade" mode="out-in">
              <span v-if="!startDate || !endDate" key="default-text" class="ml-2"> 어떻게 되시나요?</span>
              <span v-else-if="startDate && endDate" key="duration-text" class="ml-2">
                <span class="text-blue-600">{{ nightCount }}박 {{ dayCount }}일</span> 이신가요?
              </span>
            </transition>
          </h2>
        </div>

        <!-- 단계 인디케이터 -->
        <div class="flex items-center mt-1">
          <div class="flex space-x-2">
            <div class="w-8 h-1 rounded-full" :class="slideIndex === 0 || slideIndex === 1 ? 'bg-blue-500' : 'bg-gray-200'"></div>
            <div class="w-8 h-1 rounded-full" :class="slideIndex === 1 ? 'bg-blue-500' : 'bg-gray-200'"></div>
          </div>
        </div>
      </div>

      <!-- 슬라이드 컨텐츠 -->
      <div class="flex items-center w-full flex-1 overflow-hidden">
        <!-- 좌측 화살표 -->
        <div class="w-[5%] flex justify-center">
          <button
            :disabled="slideIndex === 0"
            @click="prevSlide"
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            :class="slideIndex === 0 ? 'text-white cursor-default' : 'text-gray-600 hover:bg-gray-100'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- 콘텐츠 영역 -->
        <div class="w-[90%] flex justify-center items-center overflow-hidden">
          <div class="flex w-full h-full transition-transform duration-500 ease-in-out" :style="{ transform: `translateX(-${slideIndex * 100}%)` }">
            <!-- 지역 선택 -->
            <div class="flex-shrink-0 w-full flex justify-center items-center">
              <KoreaMap @region-selected="onRegionSelected" />
            </div>
            <!-- 날짜 선택 -->
            <div class="flex-shrink-0 w-full flex justify-center items-center">
              <CalendarPopup />
            </div>
          </div>
        </div>

        <!-- 우측 화살표 -->
        <div class="w-[5%] flex justify-center">
          <button
            :disabled="slideIndex === 1"
            @click="nextSlide"
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            :class="slideIndex === 1 ? 'text-gray-300 cursor-default' : 'text-gray-600 hover:bg-gray-100'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="w-full mt-2 mb-2 flex flex-col items-center justify-center">
        <button
          class="w-[80%] px-3 py-3 rounded-lg font-semibold transition-colors duration-200 text-lg"
          :disabled="!canProceed"
          :class="canProceed ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
          @click="completeSelection"
        >
          계획하기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import KoreaMap from '@/components/destinations/KoreaMap.vue';
import CalendarPopup from '@/components/date/CalendarPopup.vue';
import TravelHeader from '@/components/destinations/TravelHeader.vue';

export default {
  name: 'KoreaMapModal',
  components: {
    KoreaMap,
    CalendarPopup,
    TravelHeader,
  },
  data() {
    return {
      selectedRegion: '',
      slideIndex: 0,
      nightCount: 0,
      dayCount: 0,
    };
  },
  computed: {
    ...mapState('places', {
      startDate: (state) => state.tripDates.startDate,
      endDate: (state) => state.tripDates.endDate,
    }),
    canProceed() {
      return this.selectedRegion && this.startDate && this.endDate;
    },
  },
  watch: {
    startDate: 'updateDateCounts',
    endDate: 'updateDateCounts',
  },
  methods: {
    ...mapMutations('places', {
      setTripDates: 'SET_TRIP_DATES',
    }),
    onRegionSelected(region) {
      this.selectedRegion = region;
    },
    nextSlide() {
      if (this.slideIndex < 1 && this.selectedRegion) {
        this.slideIndex++;
      }
    },
    prevSlide() {
      if (this.slideIndex > 0) {
        this.slideIndex--;
      }
    },
    updateDateCounts() {
      if (!this.startDate || !this.endDate) {
        this.nightCount = 0;
        this.dayCount = 0;
        return;
      }

      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const diffTime = Math.abs(end - start);
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const days = nights + 1;

      this.nightCount = nights;
      this.dayCount = days;
    },
    completeSelection() {
      if (this.startDate && this.endDate) {
        this.$store.commit('places/setTripCount', {
          nightCount: this.nightCount,
          dayCount: this.dayCount,
        });
        this.$store.commit('places/setSelectedRegion', this.selectedRegion);
        this.$router.push('/map');
      } else {
        alert('여행 시작일과 종료일을 모두 선택해주세요.');
      }
    },
  },
};
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
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
