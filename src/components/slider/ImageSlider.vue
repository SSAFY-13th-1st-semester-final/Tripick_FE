<template>
  <div class="relative w-full h-[500px] overflow-hidden bg-black font-apple-sdgothic">
    <SlideImage
      v-for="(slide, index) in slides"
      :key="index"
      :slide="slide"
      :active="currentIndex === index"
    />

    <!-- 텍스트 + 인디케이터 -->
    <div
      class="absolute top-1/3 left-10 transform -translate-y-1/2 text-white bg-black bg-opacity-40 p-4 rounded-md max-w-[270px] w-full h-[170px] z-20 pointer-events-none flex flex-col justify-start"
    >
      <transition name="fade-up-title" mode="out-in">
        <h2 v-if="showTitle" :key="slides[currentIndex].title" class="text-2xl font-bold mb-2">
          {{ slides[currentIndex].title }}
        </h2>
      </transition>

      <transition name="fade-up-desc" mode="out-in">
        <p v-if="showDescription" :key="slides[currentIndex].description">
          {{ slides[currentIndex].description }}
        </p>
      </transition>

      <SlideIndicator
        :currentIndex="currentIndex"
        :total="slides.length"
        @prev="prevSlide"
        @next="nextSlide"
      />
    </div>
  </div>
</template>

<script>
import SlideImage from './SlideImage.vue';
import SlideIndicator from './SlideIndicator.vue';

import img0 from '@/assets/img/home-img-0.webp';
import img1 from '@/assets/img/home-img-1.jpeg';
import img2 from '@/assets/img/home-img-2.webp';

export default {
  components: { SlideImage, SlideIndicator },
  data() {
    return {
      currentIndex: 0,
      showTitle: true,
      showDescription: true,
      intervalId: null,
      slides: [
        { image: img0, title: '자연 속의 여유', description: '푸른 숲과 함께하는 휴식의 순간' },
        { image: img1, title: '여행의 시작', description: '설레는 발걸음을 따라가는 길' },
        { image: img2, title: '노을지는 하늘', description: '따뜻한 빛으로 물든 하루의 끝' }
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
        this.currentIndex = (this.currentIndex + step + this.slides.length) % this.slides.length;
        this.startSlideShow();
      });
    },
    animateText(callback) {
      this.showTitle = false;
      this.showDescription = false;
      setTimeout(() => {
        callback();
        setTimeout(() => {
          this.showTitle = true;
        }, 100);
        setTimeout(() => {
          this.showDescription = true;
        }, 400);
      }, 400);
    }
  }
};
</script>

<style>
.fade-up-title-enter-active,
.fade-up-title-leave-active,
.fade-up-desc-enter-active,
.fade-up-desc-leave-active {
  transition: all 0.5s ease;
}

.fade-up-title-enter-from,
.fade-up-desc-enter-from,
.fade-up-title-leave-to,
.fade-up-desc-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-title-enter-to,
.fade-up-desc-enter-to,
.fade-up-title-leave-from,
.fade-up-desc-leave-from {
  opacity: 1;
  transform: translateY(0);
}

</style>