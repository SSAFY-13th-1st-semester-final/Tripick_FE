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
            <router-link
              v-if="!isAuthenticated"
              to="/auth/signup"
              class="hero-btn secondary"
            >
              회원가입
            </router-link>
            <router-link v-else to="/travel/create" class="hero-btn secondary">
              내 여행 계획
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <FeatureSection :features="homeFeatures" />

    <section v-if="!isAuthenticated" class="cta">
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

    <section v-else class="recommendations">
      <div class="container">
        <div class="recommendations-content glass-card">
          <h2 class="recommendations-title">맞춤형 여행 추천</h2>
          <p class="recommendations-description">
            {{ authStore.user?.nickname || "회원" }}님을 위한 특별한 여행
            추천입니다.
          </p>
          <div class="recommendations-actions">
            <router-link to="#" class="recommendations-btn">
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
import { ref, computed } from "vue";
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

.recommendations {
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
    color: $primary-color;

    @media (max-width: $breakpoint-md) {
      font-size: 1.75rem;
    }
  }

  &-description {
    font-size: 1.125rem;
    margin-bottom: $spacing-xl;
    color: rgba($primary-color, 0.8);
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
    }
  }
}
</style>