<template>
  <div class="post-stats">
    <!-- 조회수 -->
    <div class="post-stats__item">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="post-stats__icon"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <span class="post-stats__count">{{ formatCount(viewCount) }}</span>
    </div>

    <!-- 좋아요 버튼 -->
    <button
      @click="handleLikeToggle"
      :disabled="isLikeLoading || !isAuthenticated"
      class="post-stats__item post-stats__like-button"
      :class="{
        'post-stats__like-button--liked': isLiked,
        'post-stats__like-button--loading': isLikeLoading,
        'post-stats__like-button--disabled': !isAuthenticated,
      }"
      :title="!isAuthenticated ? '로그인이 필요합니다' : ''"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="post-stats__icon"
        :style="{
          stroke: isLiked ? '#3182F6' : 'currentColor',
          fill: isLiked ? '#3182F6' : 'none',
        }"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        ></path>
      </svg>
      <span class="post-stats__count">{{ formatCount(likeCount) }}</span>

      <!-- 로딩 스피너 -->
      <div v-if="isLikeLoading" class="post-stats__loading-overlay">
        <div class="post-stats__mini-spinner"></div>
      </div>
    </button>

    <!-- 댓글 수 -->
    <div class="post-stats__item">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="post-stats__icon"
      >
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        ></path>
      </svg>
      <span class="post-stats__count">{{ formatCount(commentCount) }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

// Props 정의
const props = defineProps({
  viewCount: {
    type: Number,
    default: 0,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  isLiked: {
    type: Boolean,
    default: false,
  },
  isLikeLoading: {
    type: Boolean,
    default: false,
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
});

// Emits 정의
const emit = defineEmits(["toggleLike"]);

// 좋아요 토글 핸들러
const handleLikeToggle = () => {
  if (!props.isAuthenticated || props.isLikeLoading) {
    return;
  }
  emit("toggleLike");
};

// 수 포맷팅 함수
const formatCount = (count) => {
  if (!count && count !== 0) return "0";

  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }

  return count.toString();
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.post-stats {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  @media (max-width: $breakpoint-sm) {
    gap: $spacing-sm;
  }

  &__item {
    display: flex;
    align-items: center;
    color: rgba($primary-color, 0.7);
    font-size: 0.9rem;
    transition: all $transition-fast;
    padding: $spacing-xs $spacing-sm;
    border-radius: 16px;
    background-color: rgba($white, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba($white, 0.18);
    box-shadow: 0 2px 8px rgba(31, 38, 135, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(31, 38, 135, 0.15);
    }

    @media (max-width: $breakpoint-sm) {
      padding: $spacing-xs;
      font-size: 0.8rem;
    }
  }

  &__icon {
    margin-right: $spacing-xs;
    width: 16px;
    height: 16px;
    flex-shrink: 0;

    @media (max-width: $breakpoint-sm) {
      margin-right: 2px;
      width: 14px;
      height: 14px;
    }
  }

  &__count {
    font-weight: $font-weight-medium;
    white-space: nowrap;
  }

  // 좋아요 버튼 전용 스타일
  &__like-button {
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    font-family: inherit;
    font-size: inherit;

    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba($accent-color, 0.3);
    }

    &--liked {
      color: #3182f6 !important;
      background-color: rgba(49, 130, 246, 0.1) !important;
      border-color: rgba(49, 130, 246, 0.3) !important;

      .post-stats__icon {
        animation: heartBeat 0.6s ease-in-out;
      }
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        transform: none !important;
        box-shadow: 0 2px 8px rgba(31, 38, 135, 0.1) !important;
      }
    }

    &--loading {
      pointer-events: none;
    }

    &:hover:not(&--disabled):not(&--loading) {
      background-color: rgba(49, 130, 246, 0.05) !important;
      border-color: rgba(49, 130, 246, 0.2) !important;
    }

    &:disabled {
      pointer-events: none;
    }
  }

  // 로딩 오버레이
  &__loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
  }

  // 미니 스피너
  &__mini-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid #f3f4f6;
    border-top: 2px solid #3182f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

// 애니메이션
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
