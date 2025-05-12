<template>
  <div class="w-full relative font-apple-sdgothic">
    <!-- 이미지 슬라이더 -->
    <div class="relative w-full h-[400px] overflow-hidden bg-black">
      <div
        v-for="(slide, index) in slides"
        :key="index"
        class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        :class="{
          'opacity-100 z-0': currentIndex === index,
          'opacity-0 z-0': currentIndex !== index
        }"
      >
        <img :src="slide.image" class="w-full h-full object-cover" />
      </div>
    </div>

    <!-- 텍스트 + 인디케이터 -->
    <div
  class="absolute top-1/3 left-10 transform -translate-y-1/2 text-white bg-black bg-opacity-40 p-4 rounded-md max-w-[270px] w-full h-[170px] z-20 pointer-events-none flex flex-col justify-start"
>
      <!-- Title -->
      <transition name="fade-up-title" mode="out-in">
        <h2
          v-if="showTitle"
          :key="slides[currentIndex].title"
          class="text-2xl font-bold mb-2"
        >
          {{ slides[currentIndex].title }}
        </h2>
      </transition>

      <!-- Description -->
      <transition name="fade-up-desc" mode="out-in">
        <p
          v-if="showDescription"
          :key="slides[currentIndex].description"
        >
          {{ slides[currentIndex].description }}
        </p>
      </transition>

      <!-- 인디케이터 (고정 위치) -->
      <div class="absolute bottom-3 left-40 flex items-center space-x-4 w-96 pointer-events-auto">
        <div class="bg-gray-900 rounded-full flex justify-center items-center">
          <button
            @click="prevSlide"
            class="text-white hover:bg-opacity-100 px-3 py-1 rounded-full"
          >
            ‹
          </button>

          <!-- 현재 인덱스 -->
          <span class="text-white text-sm mx-0 inline-block text-center" style="min-width: 1rem;">
            {{ currentIndex + 1 }}
          </span>

          <!-- 슬래시 (/) -->
          <span class="text-white text-sm mx-0 text-opacity-50">
            /
          </span>

          <!-- 슬라이드 총 개수 -->
          <span class="text-white text-sm mx-0 inline-block text-center" style="min-width: 1rem;">
            {{ slides.length }}
          </span>

          <button
            @click="nextSlide"
            class="text-white hover:bg-opacity-100 px-3 py-1 rounded-full"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- 네비게이션 -->
    <NavBar />
  </div>
</template>

<script>
import NavBar from '@/components/layout/NavBar.vue';

import img0 from '@/assets/img/home-img-0.webp';
import img1 from '@/assets/img/home-img-1.jpeg';
import img2 from '@/assets/img/home-img-2.webp';

export default {
  components: { NavBar },
  data() {
    return {
      currentIndex: 0,
      showTitle: true,
      showDescription: true,
      intervalId: null,
      slides: [
        {
          image: img0,
          title: '자연 속의 여유',
          description: '푸른 숲과 함께하는 휴식의 순간',
        },
        {
          image: img1,
          title: '여행의 시작',
          description: '설레는 발걸음을 따라가는 길',
        },
        {
          image: img2,
          title: '노을지는 하늘',
          description: '따뜻한 빛으로 물든 하루의 끝',
        },
      ],
    };
  },
  mounted() {
    this.startSlideShow();
  },
  beforeDestroy() {
    clearInterval(this.intervalId);
  },
  methods: {
    startSlideShow() {
      this.intervalId = setInterval(this.changeSlide, 6000);
    },
    changeSlide() {
      this.animateText(() => {
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
      });
    },
    nextSlide() {
      this.manualChange(1);
    },
    prevSlide() {
      this.manualChange(-1);
    },
    manualChange(step) {
      clearInterval(this.intervalId);
      this.animateText(() => {
        this.currentIndex =
          (this.currentIndex + step + this.slides.length) % this.slides.length;
        this.startSlideShow();
      });
    },
    animateText(callback) {
      this.showTitle = false;
      this.showDescription = false;
      setTimeout(() => {
        callback();
        // title 먼저
        setTimeout(() => {
          this.showTitle = true;
        }, 100);
        // description 나중
        setTimeout(() => {
          this.showDescription = true;
        }, 400);
      }, 400); // 기존 텍스트 페이드아웃 시간
    },
  },
};
</script>

<style scoped>


.opacity-0 {
  opacity: 0;
  transition: opacity 1s ease-in-out;
}
.opacity-100 {
  opacity: 1;
  transition: opacity 1s ease-in-out;
}

/* Title 애니메이션 */
.fade-up-title-enter-active,
.fade-up-title-leave-active {
  transition: all 0.5s ease;
}
.fade-up-title-enter-from,
.fade-up-title-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.fade-up-title-enter-to,
.fade-up-title-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Description 애니메이션 (같은 효과, key 다름) */
.fade-up-desc-enter-active,
.fade-up-desc-leave-active {
  transition: all 0.5s ease;
}
.fade-up-desc-enter-from,
.fade-up-desc-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.fade-up-desc-enter-to,
.fade-up-desc-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
