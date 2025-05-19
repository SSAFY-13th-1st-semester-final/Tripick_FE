<template>
  <div class="home-view">
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">특별한 여행을 발견하세요</h1>
          <p class="hero-subtitle">
            글래스모피즘 디자인의 세련된 여행 웹앱과 함께 여정을 시작하세요
          </p>
          <div class="hero-actions">
            <button @click="openTripPlanner" class="hero-btn primary">
              여행 둘러보기
            </button>
            <router-link to="/auth/signup" class="hero-btn secondary">
              회원가입
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 기능 섹션을 컴포넌트로 대체 -->
    <FeatureSection :features="homeFeatures" />

    <section class="cta">
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

    <!-- TripPlanner 모달 -->
    <Teleport to="body" v-if="showTripModal">
      <!-- 모달 배경 오버레이 -->
      <div class="modal-backdrop" @click="closeTripPlanner"></div>

      <!-- 모달 컨테이너 -->
      <div class="modal-container">
        <TripPlanner
          class="modal-content"
          :is-modal="true"
          @close="closeTripPlanner"
          @trip-created="handleTripCreated"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TripPlanner from "@/components/travel/TripPlanner.vue";
import FeatureSection from "@/components/home/FeatureSection.vue";

// 라우팅 관련 정보 가져오기
const route = useRoute();
const router = useRouter();

// 모달 표시 상태
const showTripModal = ref(false);

// 홈 화면에 표시할 기능 목록 정의
const homeFeatures = [
  {
    id: 1,
    icon: "🔍",
    title: "맞춤형 여행 검색",
    description: "취향과 예산에 맞는 완벽한 여행 계획을 찾아보세요.",
  },
  {
    id: 2,
    icon: "💎",
    title: "특별한 경험",
    description: "현지 문화를 체험할 수 있는 특별한 여행 경험을 제공합니다.",
  },
  {
    id: 3,
    icon: "📱",
    title: "모바일 최적화",
    description: "언제 어디서나 모바일로 여행 정보를 확인하고 예약하세요.",
  },
];

// 여행 계획 모달 열기
const openTripPlanner = () => {
  showTripModal.value = true;

  // URL 상태 업데이트
  router.push({
    name: "travel-create",
    query: { returnTo: route.fullPath }, // 현재 페이지로 돌아올 수 있게 정보 저장
  });
};

// 여행 계획 모달 닫기
const closeTripPlanner = () => {
  showTripModal.value = false;

  // 이전 URL로 돌아가기
  if (route.query.returnTo) {
    router.push(route.query.returnTo);
  } else {
    router.push({ name: "home" });
  }
};

// 여행 계획 생성 완료 처리
const handleTripCreated = () => {
  // 여행 계획이 성공적으로 생성되면 일정 계획 페이지로 이동
  router.push({ name: "travel-planner" });
};

// URL 경로에 따라 모달 표시 여부 결정
watch(
  () => route.name,
  (routeName) => {
    showTripModal.value = routeName === "travel-create";
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles/glassmorphism" as *;

.home-view {
  padding-top: $spacing-lg;
}

.hero {
  padding: $spacing-3xl 0;
  text-align: center;
  position: relative;
  overflow: hidden;

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

  &-content {
    max-width: 800px;
    margin: 0 auto;
  }

  &-title {
    font-size: 3rem;
    margin-bottom: $spacing-md;
    color: $primary-color;

    @media (max-width: $breakpoint-md) {
      font-size: 2.5rem;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 2rem;
    }
  }

  &-subtitle {
    font-size: 1.25rem;
    margin-bottom: $spacing-xl;
    color: rgba($primary-color, 0.8);

    @media (max-width: $breakpoint-md) {
      font-size: 1.125rem;
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

.cta {
  padding: $spacing-3xl 0;

  &-content {
    text-align: center;
    padding: $spacing-2xl;
    max-width: 800px;
    margin: 0 auto;
    border-radius: 16px;
    @include glassmorphism(0.7, 10px);

    &:hover {
      transform: none;
    }
  }

  &-title {
    font-size: 2rem;
    margin-bottom: $spacing-md;

    @media (max-width: $breakpoint-md) {
      font-size: 1.75rem;
    }
  }

  &-description {
    font-size: 1.125rem;
    margin-bottom: $spacing-xl;
    color: rgba($primary-color, 0.8);
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
  }
}

/* 모달 스타일 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba($primary-color, 0.3);
  backdrop-filter: blur(3px);
  z-index: $z-index-modal;
}

/* 모달 컨테이너 - 크기와 스타일링 적용 */
.modal-container {
  position: fixed;
  top: 5vh; /* 상단에서 5vh 떨어진 위치에 배치 */
  left: 50%;
  transform: translateX(-50%); /* 가로 중앙 정렬만 적용 */
  width: 100%;
  max-width: 1000px;
  height: 60vh; /* 높이를 뷰포트 높이의 90%로 고정 */
  z-index: $z-index-modal + 1;
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  @include glassmorphism(0.9, 15px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);

  /* hover 효과 제거 */
  &:hover {
    transform: translateX(-50%) !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15) !important;
  }

  /* 모달이 열릴 때 애니메이션 */
  animation: modal-open 0.4s cubic-bezier(0.17, 0.67, 0.21, 0.99);

  @keyframes modal-open {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @media (max-width: $breakpoint-md) {
    width: 95%;
    height: 95vh; /* 모바일에서는 뷰포트 높이의 95%로 설정 */
    top: 2.5vh; /* 상하 여백을 균등하게 배분 */
  }
}

/* 모달 내부 콘텐츠 - 자식 컴포넌트가 꽉 채우도록 설정 */
.modal-content {
  width: 100%;
  height: 100%;
  display: block;
  overflow-y: auto;

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba($dark-gray, 0.3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background-color: rgba($medium-gray, 0.1);
  }
}
</style>
