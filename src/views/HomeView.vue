<template>
  <div class="home-view">
    <section ref="heroSection" class="hero">
      <div class="container">
        <div class="hero-content">
          <!-- 애니메이션 타이틀 -->
          <h1 class="hero-title" ref="titleRef">
            <span
              :class="['title-part', { 'is-animated': titlePart1Animated }]"
              :style="{ animationDelay: '0ms' }"
            >
              나만의 여행,
            </span>
            <span
              :class="['title-part', { 'is-animated': titlePart2Animated }]"
              :style="{ animationDelay: '400ms' }"
            >
              나만의 방식으로.
            </span>
          </h1>

          <!-- 애니메이션 서브타이틀 -->
          <div class="hero-subtitle-container">
            <p
              :class="[
                'hero-subtitle-line',
                { 'is-animated': animatedLines[0] },
              ]"
              :style="{ animationDelay: '1000ms' }"
            >
              여행 일정 생성부터 <span class="ai-text">AI 추천·요약</span>, 후기
              검색과 커스터마이징까지.
            </p>
            <p
              :class="[
                'hero-subtitle-line',
                { 'is-animated': animatedLines[1] },
              ]"
              :style="{ animationDelay: '1200ms' }"
            >
              여행의 모든 순간을
              <span class="ai-text">AI와 함께</span> 스마트하게.
            </p>
          </div>

          <!-- 액션 버튼들 -->
          <div
            :class="['hero-actions', { 'is-animated': actionsAnimated }]"
            :style="{ animationDelay: '1800ms' }"
          >
            <button @click="openTripPlanner" class="hero-btn primary">
              여행 둘러보기
            </button>
            <router-link
              v-if="!isAuthenticated"
              to="/auth/signup"
              class="hero-btn secondary"
            >
              회원가입
            </router-link>
            <router-link v-else to="/profile" class="hero-btn secondary">
              내 여행 계획
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section ref="featuresSection" class="features">
      <FeatureSection :features="homeFeatures" />
    </section>

    <section ref="ctaSection" v-if="!isAuthenticated" class="cta">
      <div class="container">
        <div class="cta-content glass-card">
          <h2 class="cta-title">지금 바로 시작하세요</h2>
          <p class="cta-description">
            전 세계 수많은 여행지가 당신을 기다리고 있습니다.
          </p>
          <router-link to="/auth/signup" class="cta-btn">
            무료로 가입하기
          </router-link>
        </div>
      </div>
    </section>

    <section ref="recommendationsSection" v-else class="recommendations">
      <div class="container">
        <div class="recommendations-content glass-card">
          <h2 class="recommendations-title">맞춤형 여행 추천</h2>
          <p class="recommendations-description">
            {{ authStore.user?.nickname || "회원" }}님을 위한 특별한 여행
            추천입니다.
          </p>
          <div class="recommendations-actions">
            <router-link
              to="/travel/travel-planning"
              class="recommendations-btn"
            >
              추천 여행지 보기
            </router-link>
            <button
              @click="openTripPlanner"
              class="recommendations-btn secondary"
            >
              새 여행 계획하기
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 비디오 섹션 -->
    <section ref="videoSection" class="video-section">
      <div class="container">
        <div class="video-content glass-card">
          <h2 class="video-title">서비스 소개 영상</h2>
          <div class="video-wrapper">
            <div class="video-container">
              <iframe
                class="intro-video"
                src="https://www.youtube.com/embed/acexNo3L2AU?controls=1&rel=0&modestbranding=1"
                title="서비스 소개 영상"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 섹션 네비게이션 화살표 -->
    <button
      class="section-navigator"
      @click="scrollToNextSection"
      :class="{ hidden: isLastSection }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <!-- TripPlanner 독립 모달 - 간단한 사용법 -->
    <TripPlanner
      v-if="showTripModal"
      :is-modal="true"
      @close="closeTripPlanner"
      @trip-created="handleTripCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import TripPlanner from "@/components/travel/TripPlanner.vue";
import FeatureSection from "@/components/home/FeatureSection.vue";
import { homeFeatures } from "@/assets/data/homeFeatures.js";

const router = useRouter();
const authStore = useAuthStore();

// 인증 상태 확인
const isAuthenticated = computed(() => authStore.isAuthenticated);

// 모달 표시 상태
const showTripModal = ref(false);

// 섹션 참조
const heroSection = ref(null);
const featuresSection = ref(null);
const ctaSection = ref(null);
const recommendationsSection = ref(null);
const videoSection = ref(null);

// 현재 섹션 인덱스
const currentSectionIndex = ref(0);

// 섹션 배열 (computed로 인증 상태에 따라 동적 관리)
const sections = computed(() => {
  const baseSections = [heroSection, featuresSection];
  if (isAuthenticated.value) {
    baseSections.push(recommendationsSection);
  } else {
    baseSections.push(ctaSection);
  }
  baseSections.push(videoSection); // 비디오 섹션은 항상 마지막에 추가
  return baseSections;
});

// 마지막 섹션 여부
const isLastSection = computed(() => {
  return currentSectionIndex.value >= sections.value.length - 1;
});

// 애니메이션 상태 관리
const titleRef = ref(null);
const titlePart1Animated = ref(false);
const titlePart2Animated = ref(false);

const animatedLines = ref([]);
const actionsAnimated = ref(false);

// 애니메이션 초기화
const initializeAnimation = () => {
  animatedLines.value = new Array(2).fill(false);
};

// 애니메이션 시작
const startAnimation = () => {
  // 첫 번째 타이틀 부분 애니메이션
  setTimeout(() => {
    titlePart1Animated.value = true;
  }, 0);

  // 두 번째 타이틀 부분 애니메이션 (더 빠르게)
  setTimeout(() => {
    titlePart2Animated.value = true;
  }, 400);

  // 서브타이틀 라인 애니메이션 (더 빠르게)
  setTimeout(() => {
    animatedLines.value[0] = true;
  }, 1000);

  setTimeout(() => {
    animatedLines.value[1] = true;
  }, 1200);

  // 액션 버튼 애니메이션
  setTimeout(() => {
    actionsAnimated.value = true;
  }, 1800);
};

// 다음 섹션으로 스크롤
const scrollToNextSection = () => {
  const nextIndex = currentSectionIndex.value + 1;
  if (nextIndex < sections.value.length) {
    const nextSection = sections.value[nextIndex].value;
    if (nextSection) {
      nextSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      currentSectionIndex.value = nextIndex;
    }
  }
};

// 현재 섹션 감지
const detectCurrentSection = () => {
  if (!sections.value.length) return;

  const scrollPosition = window.scrollY + window.innerHeight / 2;

  for (let i = 0; i < sections.value.length; i++) {
    const section = sections.value[i].value;
    if (section) {
      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const sectionBottom = sectionTop + rect.height;

      if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
        currentSectionIndex.value = i;
        break;
      }
    }
  }
};

// 스크롤 이벤트 핸들러
const handleScroll = () => {
  detectCurrentSection();
};

// 여행 계획 모달 열기
const openTripPlanner = () => {
  showTripModal.value = true;
};

// 여행 계획 모달 닫기
const closeTripPlanner = () => {
  showTripModal.value = false;
};

// 여행 계획 생성 완료 처리
const handleTripCreated = () => {
  // 여행 계획이 성공적으로 생성되면 일정 계획 페이지로 이동
  router.push({ name: "travel-planner" });
};

onMounted(async () => {
  initializeAnimation();

  // 약간의 지연 후 애니메이션 시작
  setTimeout(() => {
    startAnimation();
  }, 500);

  // DOM이 완전히 렌더링된 후 스크롤 이벤트 등록
  await nextTick();
  window.addEventListener("scroll", handleScroll, { passive: true });

  // 초기 섹션 감지
  detectCurrentSection();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles/glassmorphism" as *;

// 헤더 높이 변수 정의 (프로젝트에 맞게 조정하세요)
$header-height: 64px; // 일반적인 헤더 높이

.home-view {
  // 헤더와 겹치지 않도록 상단 패딩 제거
  padding-top: 0;
  position: relative;
}

.hero {
  // 전체 뷰포트 높이에서 헤더 높이를 뺀 높이로 설정
  min-height: calc(100vh - #{$header-height});
  height: calc(100vh - #{$header-height});

  // Flexbox를 사용하여 콘텐츠를 수직 중앙에 배치
  display: flex;
  align-items: center;
  justify-content: center;

  text-align: center;
  position: relative;
  overflow: hidden;

  // 패딩을 적절히 조정 (수직 패딩 줄임)
  padding: $spacing-xl 0;

  // 모바일에서는 약간 다른 처리
  @media (max-width: $breakpoint-md) {
    min-height: calc(100vh - #{$header-height});
    height: auto; // 모바일에서는 콘텐츠에 따라 높이 조정
    padding: $spacing-lg 0;
  }

  // 매우 작은 화면에서의 처리
  @media (max-width: $breakpoint-sm) {
    padding: $spacing-md 0;
  }

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -10%;
    width: 120%;
    height: 200%;
    background: radial-gradient(
      ellipse at center,
      rgba($accent-color, 0.05) 0%,
      rgba($white, 0) 70%
    );
    z-index: -1;
  }

  .container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 1000px;
    margin: 0 auto;
    border-radius: 20px;
    padding: $spacing-2xl;

    // glass-card 클래스의 hover 효과 제거
    &:hover {
      transform: none;
    }

    @media (max-width: $breakpoint-md) {
      padding: $spacing-lg;
      border-radius: 16px;
    }

    @media (max-width: $breakpoint-sm) {
      padding: $spacing-md;
      border-radius: 12px;
    }
  }

  &-content {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;

    // 콘텐츠가 화면을 넘어가지 않도록 최대 높이 설정
    max-height: calc(100vh - #{$header-height} - #{$spacing-xl * 2});

    @media (max-width: $breakpoint-md) {
      max-height: none; // 모바일에서는 제한 해제
    }
  }

  &-title {
    font-size: 3rem;
    margin-bottom: $spacing-md;
    color: $primary-color;
    line-height: 1.2;
    font-weight: $font-weight-bold;

    @media (max-width: $breakpoint-md) {
      font-size: 2.5rem;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 2rem;
    }
  }

  &-subtitle-container {
    margin-bottom: $spacing-xl;

    @media (max-width: $breakpoint-md) {
      margin-bottom: $spacing-lg;
    }
  }

  &-actions {
    display: flex;
    justify-content: center;
    gap: $spacing-md;
    opacity: 0;
    transform: translateY(30px);

    &.is-animated {
      animation: slideInFade 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    @media (max-width: $breakpoint-sm) {
      flex-direction: column;
      align-items: center;
    }
  }

  &-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-md $spacing-xl;
    border-radius: 30px;
    font-weight: $font-weight-medium;
    transition: all $transition-fast;
    text-decoration: none;
    border: none;
    cursor: pointer;
    font-family: $font-family;

    &.primary {
      background-color: $accent-color;
      color: $white;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba($accent-color, 0.3);
      }
    }

    &.secondary {
      @include glassmorphism(0.4, 5px);
      color: $primary-color;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba($primary-color, 0.15);
      }
    }

    @media (max-width: $breakpoint-sm) {
      width: 100%;
      max-width: 300px;
    }
  }
}

// 섹션 네비게이션 화살표
.section-navigator {
  position: fixed;
  bottom: $spacing-2xl;
  right: calc(
    $spacing-lg + 52px + $spacing-md
  ); // AI 챗봇 토글 버튼 좌측에 배치
  z-index: $z-index-fixed;

  // AI 챗봇 토글 버튼과 동일한 사이즈
  width: 52px;
  height: 52px;
  border-radius: 50%;
  cursor: pointer;

  // AI 챗봇 토글 버튼과 동일한 스타일
  background: rgba($white, 0.95);
  color: $accent-color;
  border: 1px solid rgba($accent-color, 0.2);

  // 글래스모피즘 효과
  @include glassmorphism(0.95, 15px);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);

  transition: all $transition-normal;
  box-shadow: $shadow-lg;

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1) translateY(-2px);
    box-shadow: $shadow-xl;
    background: rgba($accent-color, 0.95);
    color: $white;
    border-color: rgba($accent-color, 0.8);

    svg {
      color: $white;
      transform: translateY(2px);
    }
  }

  &:active {
    transform: scale(1.05) translateY(-1px);
  }

  &.hidden {
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
  }

  svg {
    width: 24px;
    height: 24px;
    transition: all $transition-fast;
    stroke-width: 2.5;
  }

  // 모바일에서 크기 조정 (AI 챗봇 토글과 동일)
  @media (max-width: $breakpoint-sm) {
    bottom: $spacing-lg;
    right: calc(
      $spacing-md + 48px + $spacing-sm
    ); // 모바일에서 AI 챗봇 토글 버튼 좌측
    width: 48px;
    height: 48px;

    svg {
      width: 20px;
      height: 20px;
      stroke-width: 2.5;
    }
  }
}

// 타이틀 부분 애니메이션
.title-part {
  display: inline-block;
  opacity: 0;
  transform: translateX(-30px);
  margin-right: $spacing-xs;

  &.is-animated {
    animation: slideInFromLeft 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
}

// 서브타이틀 라인 애니메이션 (순수 페이드인만)
.hero-subtitle-line {
  font-size: 1.25rem;
  color: rgba($primary-color, 0.8);
  line-height: 1.6;
  margin-bottom: $spacing-sm;
  opacity: 0;

  &.is-animated {
    animation: pureFadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @media (max-width: $breakpoint-md) {
    font-size: 1.125rem;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

// AI 텍스트 스타일링 (토스블루)
.ai-text {
  color: $accent-color;
  font-weight: $font-weight-medium;
}

// 키프레임 애니메이션 정의
@keyframes slideInFromLeft {
  0% {
    opacity: 0;
    transform: translateX(-30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pureFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes slideInFade {
  0% {
    opacity: 0;
    transform: translateY(30px);
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

// 글로우 효과 추가
.hero-title {
  text-shadow: 0 0 30px rgba($accent-color, 0.1);
}

// Feature 섹션 스타일
.features {
  // 전체 뷰포트 높이에서 헤더 높이를 뺀 높이로 설정
  min-height: calc(100vh - #{$header-height});
  height: calc(100vh - #{$header-height});

  // Flexbox를 사용하여 콘텐츠를 수직 중앙에 배치
  display: flex;
  align-items: center;
  justify-content: center;

  padding: $spacing-xl 0;

  // 모바일에서는 약간 다른 처리
  @media (max-width: $breakpoint-md) {
    min-height: calc(100vh - #{$header-height});
    height: auto; // 모바일에서는 콘텐츠에 따라 높이 조정
    padding: $spacing-lg 0;
  }

  // FeatureSection 컴포넌트가 전체 높이를 사용할 수 있도록 설정
  :deep(.feature-section) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.cta {
  // 전체 뷰포트 높이에서 헤더 높이를 뺀 높이로 설정
  min-height: calc(100vh - #{$header-height});
  height: calc(100vh - #{$header-height});

  // Flexbox를 사용하여 콘텐츠를 수직 중앙에 배치
  display: flex;
  align-items: center;
  justify-content: center;

  padding: $spacing-xl 0;

  // 모바일에서는 약간 다른 처리
  @media (max-width: $breakpoint-md) {
    min-height: calc(100vh - #{$header-height});
    height: auto; // 모바일에서는 콘텐츠에 따라 높이 조정
    padding: $spacing-lg 0;
  }

  .container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &-content {
    text-align: center;
    padding: $spacing-2xl;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    border-radius: 16px;
    @include glassmorphism(0.7, 10px);

    // 콘텐츠가 화면을 넘어가지 않도록 최대 높이 설정
    max-height: calc(100vh - #{$header-height} - #{$spacing-xl * 2});

    @media (max-width: $breakpoint-md) {
      max-height: none; // 모바일에서는 제한 해제
    }

    &:hover {
      transform: none;
    }
  }

  &-title {
    font-size: 2.5rem;
    margin-bottom: $spacing-md;
    font-weight: $font-weight-bold;
    text-shadow: 0 0 30px rgba($accent-color, 0.1);

    @media (max-width: $breakpoint-md) {
      font-size: 2rem;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 1.75rem;
    }
  }

  &-description {
    font-size: 1.125rem;
    margin-bottom: $spacing-xl;
    color: rgba($primary-color, 0.8);

    @media (max-width: $breakpoint-md) {
      font-size: 1rem;
    }
  }

  &-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-md $spacing-xl;
    border-radius: 30px;
    background-color: $accent-color;
    color: $white;
    font-weight: $font-weight-medium;
    text-decoration: none;
    transition: all $transition-fast;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba($accent-color, 0.3);
    }

    @media (max-width: $breakpoint-sm) {
      width: 100%;
      max-width: 300px;
    }
  }
}

.recommendations {
  // 전체 뷰포트 높이에서 헤더 높이를 뺀 높이로 설정
  min-height: calc(100vh - #{$header-height});
  height: calc(100vh - #{$header-height});

  // Flexbox를 사용하여 콘텐츠를 수직 중앙에 배치
  display: flex;
  align-items: center;
  justify-content: center;

  padding: $spacing-xl 0;

  // 모바일에서는 약간 다른 처리
  @media (max-width: $breakpoint-md) {
    min-height: calc(100vh - #{$header-height});
    height: auto; // 모바일에서는 콘텐츠에 따라 높이 조정
    padding: $spacing-lg 0;
  }

  .container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &-content {
    text-align: center;
    padding: $spacing-2xl;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    border-radius: 16px;
    @include glassmorphism(0.7, 10px);

    // 콘텐츠가 화면을 넘어가지 않도록 최대 높이 설정
    max-height: calc(100vh - #{$header-height} - #{$spacing-xl * 2});

    @media (max-width: $breakpoint-md) {
      max-height: none; // 모바일에서는 제한 해제
    }

    &:hover {
      transform: none;
    }
  }

  &-title {
    font-size: 2.5rem;
    margin-bottom: $spacing-md;
    color: $primary-color;
    font-weight: $font-weight-bold;
    text-shadow: 0 0 30px rgba($accent-color, 0.1);

    @media (max-width: $breakpoint-md) {
      font-size: 2rem;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 1.75rem;
    }
  }

  &-description {
    font-size: 1.125rem;
    margin-bottom: $spacing-xl;
    color: rgba($primary-color, 0.8);

    @media (max-width: $breakpoint-md) {
      font-size: 1rem;
    }
  }

  &-actions {
    display: flex;
    justify-content: center;
    gap: $spacing-md;

    @media (max-width: $breakpoint-sm) {
      flex-direction: column;
      align-items: center;
    }
  }

  &-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-md $spacing-xl;
    border-radius: 30px;
    background-color: $accent-color;
    color: $white;
    font-weight: $font-weight-medium;
    text-decoration: none;
    transition: all $transition-fast;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba($accent-color, 0.3);
    }

    &.secondary {
      @include glassmorphism(0.4, 5px);
      color: $primary-color;

      &:hover {
        box-shadow: 0 10px 20px rgba($primary-color, 0.15);
      }
    }

    @media (max-width: $breakpoint-sm) {
      width: 100%;
      max-width: 300px;
    }
  }
}

// 비디오 섹션 스타일
.video-section {
  // 전체 뷰포트 높이에서 헤더 높이를 뺀 높이로 설정
  min-height: calc(100vh - #{$header-height});
  height: calc(100vh - #{$header-height});

  // Flexbox를 사용하여 콘텐츠를 수직 중앙에 배치
  display: flex;
  align-items: center;
  justify-content: center;

  padding: $spacing-xl 0;

  // 모바일에서는 약간 다른 처리
  @media (max-width: $breakpoint-md) {
    min-height: calc(100vh - #{$header-height});
    height: auto; // 모바일에서는 콘텐츠에 따라 높이 조정
    padding: $spacing-lg 0;
  }

  .container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-content {
    text-align: center;
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;

    // 콘텐츠가 화면을 넘어가지 않도록 최대 높이 설정
    max-height: calc(100vh - #{$header-height} - #{$spacing-xl * 2});

    @media (max-width: $breakpoint-md) {
      max-height: none; // 모바일에서는 제한 해제
    }
  }

  .video-title {
    font-size: 2.5rem;
    margin-bottom: $spacing-2xl;
    color: $primary-color;
    font-weight: $font-weight-bold;
    text-shadow: 0 0 30px rgba($accent-color, 0.1);

    @media (max-width: $breakpoint-md) {
      font-size: 2rem;
      margin-bottom: $spacing-xl;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 1.75rem;
      margin-bottom: $spacing-lg;
    }
  }

  .video-wrapper {
    // glass-card 스타일이 자동으로 적용됨
    padding: $spacing-xl;
    border-radius: 20px;

    // hover 효과 제거 (비디오 섹션에는 적합하지 않음)
    &:hover {
      transform: none;
    }

    @media (max-width: $breakpoint-md) {
      padding: $spacing-lg;
      border-radius: 16px;
    }

    @media (max-width: $breakpoint-sm) {
      padding: $spacing-md;
      border-radius: 12px;
    }
  }

  .video-container {
    position: relative;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: $shadow-xl;

    // 16:9 비율 반응형 컨테이너
    aspect-ratio: 16 / 9;

    // 구형 브라우저 호환성을 위한 fallback
    &::before {
      content: "";
      display: block;
      padding-bottom: 56.25%; // 16:9 비율 (9/16 * 100%)
    }

    // aspect-ratio를 지원하는 브라우저에서는 padding-bottom 제거
    @supports (aspect-ratio: 16 / 9) {
      &::before {
        display: none;
      }
    }

    @media (max-width: $breakpoint-sm) {
      border-radius: 12px;
    }

    .intro-video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 16px;
      border: none;
      object-fit: cover;

      @media (max-width: $breakpoint-sm) {
        border-radius: 12px;
      }
    }
  }
}
</style>
