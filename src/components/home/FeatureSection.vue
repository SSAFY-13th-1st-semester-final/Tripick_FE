<template>
  <section class="features">
    <div class="container">
      <h2 class="section-title">
        Trip<span class="brand-accent">!</span>ck만의 특별한 서비스
      </h2>
      <div class="features-grid">
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :icon-image="feature.iconImage"
          :title="feature.title"
          :description="feature.description"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import FeatureCard from "@/components/common/shared/FeatureCard.vue";

// Props 정의
const props = defineProps({
  features: {
    type: Array,
    default: () => [
      {
        id: 1,
        iconImage: "/src/assets/data/images/ai-icon.png",
        title: "스마트 AI 여행 일정 솔루션",
        description: "나의 여행 계획을 AI와 함께 스마트하게 관리하세요.",
      },
      {
        id: 2,
        iconImage: "/src/assets/data/images/history-icon.png",
        title: "나만의 여행, 함께 나누는 기록",
        description: "여행의 순간을 공유하고, 나만의 발자국을 남겨보세요.",
      },
      {
        id: 3,
        iconImage: "/src/assets/data/images/mobile-icon.png",
        title: "모바일 최적화",
        description: "언제 어디서나 모바일로 여행 정보를 확인하고 예약하세요.",
      },
    ],
  },
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.features {
  padding: $spacing-3xl 0;
  position: relative;

  // 더 미묘한 배경색 - 완전히 투명하게
  background: transparent;

  // 배경에 미묘한 그라데이션 추가
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba($accent-color, 0.02) 0%,
      rgba($white, 0.01) 50%,
      rgba($accent-color, 0.01) 100%
    );
    z-index: -1;
  }

  .section-title {
    text-align: center;
    margin-bottom: $spacing-2xl;
    font-size: 2.25rem;
    font-weight: $font-weight-bold;
    color: $primary-color;

    // 제목에 미묘한 그라데이션
    background: linear-gradient(
      135deg,
      $primary-color,
      rgba($primary-color, 0.8)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    // 미묘한 텍스트 섀도우
    filter: drop-shadow(0 2px 4px rgba($primary-color, 0.1));

    @media (max-width: $breakpoint-md) {
      font-size: 2rem;
      margin-bottom: $spacing-xl;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 1.75rem;
    }

    // Trip!ck의 느낌표 강조 스타일
    .brand-accent {
      color: $accent-color;
      // 배경 클립 효과를 오버라이드하여 토스블루 색상 적용
      background: none;
      -webkit-background-clip: unset;
      -webkit-text-fill-color: $accent-color;
      background-clip: unset;

      // 느낌표에 미묘한 글로우 효과
      text-shadow: 0 0 10px rgba($accent-color, 0.3);

      // 호버 효과 (전체 제목에 마우스 올렸을 때)
      transition: all $transition-fast;
    }

    // 제목 호버시 느낌표 강조 효과
    &:hover .brand-accent {
      text-shadow: 0 0 15px rgba($accent-color, 0.5);
      transform: scale(1.1);
    }
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-xl;
    align-items: stretch; // 카드 높이 균등하게

    // 그리드 간격 증가로 카드들이 더 여유롭게
    @media (max-width: $breakpoint-lg) {
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-lg;
    }

    @media (max-width: $breakpoint-md) {
      grid-template-columns: 1fr;
      gap: $spacing-lg;
      max-width: 500px; // 모바일에서 최대 너비 제한
      margin: 0 auto;
    }

    @media (max-width: $breakpoint-sm) {
      gap: $spacing-md;
    }
  }

  // 전체 섹션 패딩 조정
  @media (max-width: $breakpoint-md) {
    padding: $spacing-2xl 0;
  }

  @media (max-width: $breakpoint-sm) {
    padding: $spacing-xl 0;
  }
}

// 컨테이너 스타일 개선
.container {
  position: relative;
  z-index: 1;
}
</style>
