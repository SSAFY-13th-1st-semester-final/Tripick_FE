<template>
  <div class="feature-card glass-card">
    <!-- 배경 아이콘 레이어 -->
    <div
      class="background-icon"
      :style="{ backgroundImage: `url(${iconImage})` }"
    ></div>

    <!-- 콘텐츠 레이어 -->
    <div class="card-content">
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
    </div>

    <slot></slot>
  </div>
</template>

<script setup>
// Props 정의
const props = defineProps({
  iconImage: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.feature-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: $spacing-xl $spacing-lg;
  min-height: 300px;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  // 배경색 투명도 조절
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;

  // 더 부드러운 그림자
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04) !important;

  transition: all $transition-normal cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 48px rgba(31, 38, 135, 0.15),
      0 8px 16px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.55) !important;

    .background-icon {
      filter: blur(15px) opacity(0.2);
      transform: translate(-50%, -50%) scale(1.1);
    }

    .card-content {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 배경 아이콘 스타일 - 초기에는 선명하게
  .background-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 160px;
    height: 160px;
    transform: translate(-50%, -50%);
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    filter: none; // 초기에는 블러 없음
    opacity: 0.8;
    transition: all $transition-slow; // 더 부드러운 전환
    z-index: 1;
  }

  // 콘텐츠 레이어 - 초기에는 숨겨짐
  .card-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    align-items: center;

    // 초기에는 보이지 않음
    opacity: 0;
    transform: translateY(20px);
    transition: all $transition-slow cubic-bezier(0.22, 1, 0.36, 1);
  }

  // 타이틀 스타일링
  .feature-title {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    line-height: 1.3;
    margin-bottom: $spacing-md;
    text-align: center;

    // 제목에 미묘한 그라데이션
    background: linear-gradient(
      135deg,
      $primary-color,
      rgba($primary-color, 0.8)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  // 설명 스타일링 - 호버시 굵게
  .feature-description {
    color: rgba($primary-color, 0.75);
    line-height: 1.6;
    font-size: 1rem;
    font-weight: $font-weight-regular;
    letter-spacing: -0.01em;
    margin-bottom: 0;
    text-align: center;
    transition: font-weight $transition-normal;
  }

  // 호버시 description 굵게
  &:hover .feature-description {
    font-weight: $font-weight-medium;
  }

  // 반응형 디자인
  @media (max-width: $breakpoint-md) {
    min-height: 280px;
    padding: $spacing-lg $spacing-md;

    .background-icon {
      width: 140px;
      height: 140px;
    }

    .feature-title {
      font-size: 1.375rem;
    }

    .feature-description {
      font-size: 0.95rem;
    }
  }

  @media (max-width: $breakpoint-sm) {
    min-height: 260px;
    padding: $spacing-md;

    .background-icon {
      width: 120px;
      height: 120px;
    }

    .feature-title {
      font-size: 1.25rem;
    }

    .feature-description {
      font-size: 0.9rem;
    }
  }
}
</style>
