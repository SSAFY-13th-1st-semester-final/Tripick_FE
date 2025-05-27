<template>
  <div class="post-content glass-card">
    <div class="post-content__header">
      <div class="post-content__actions">
        <AppButton
          @click="$emit('navigate-to-list')"
          variant="ghost"
          size="sm"
          class="back-btn"
        >
          <i class="fas fa-arrow-left"></i>
          목록으로
        </AppButton>

        <div v-if="isAuthorOrAdmin" class="post-content__author-actions">
          <AppButton @click="$emit('edit-post')" variant="outline" size="sm">
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
              class="post-content__icon"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              ></path>
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              ></path>
            </svg>
            수정
          </AppButton>
          <AppButton
            @click="$emit('confirm-delete')"
            variant="outline"
            size="sm"
            class="delete-btn"
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
              class="post-content__icon"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"
              ></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            삭제
          </AppButton>
        </div>
      </div>

      <h1 class="post-content__title">{{ post.title }}</h1>

      <div class="post-content__meta">
        <div class="post-content__author">
          <div class="post-content__author-image">
            <img
              :src="post.profileImageUrl || '/default-profile.jpg'"
              :alt="post.nickname"
              @error="handleProfileError"
            />
          </div>
          <div class="post-content__author-info">
            <span class="post-content__author-name">{{ post.nickname }}</span>
            <span class="post-content__date">{{
              formatDate(post.createdAt)
            }}</span>
          </div>
        </div>

        <!-- PostStats 컴포넌트 사용 -->
        <PostStats
          :view-count="post.viewCount"
          :like-count="post.likeCount"
          :comment-count="post.commentCount"
          :is-liked="isLiked"
          :is-like-loading="isLikeLoading"
          :is-authenticated="isAuthenticated"
          @toggle-like="$emit('toggle-like')"
        />
      </div>
    </div>

    <!-- 게시글 썸네일 -->
    <div v-if="post.thumbnail" class="post-content__thumbnail">
      <div class="post-content__thumbnail-container">
        <img
          :src="post.thumbnail"
          :alt="post.title"
          class="post-content__thumbnail-image"
          @error="handleImageError"
        />
        <div class="post-content__thumbnail-overlay"></div>
      </div>
    </div>

    <div class="post-content__body">
      <!-- 게시글 본문 내용 -->
      <div class="post-content__main-content">
        <div class="post-content__text" v-html="post.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import AppButton from "@/components/common/shared/AppButton.vue";
import PostStats from "@/components/posts/PostStats.vue";

// Props 정의
const props = defineProps({
  post: {
    type: Object,
    required: true,
    default: () => ({}),
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
  currentUser: {
    type: Object,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

// Emits 정의
const emit = defineEmits([
  "navigate-to-list",
  "edit-post",
  "confirm-delete",
  "toggle-like",
  "image-error",
  "profile-error",
]);

const isAuthorOrAdmin = computed(() => {
  if (!props.post) return false;
  if (!props.isAuthenticated) return false;

  // 관리자인 경우 항상 수정/삭제 가능
  if (props.isAdmin) return true;

  // 타입 강제 변환 후 비교
  const postMemberId = String(props.post.memberId);
  const currentUserId = String(props.currentUser.id);

  console.log(">> postMemberId:", postMemberId);
  console.log(">> currentUserId:", currentUserId);
  console.log(">> 비교 결과:", postMemberId === currentUserId);

  // 작성자인 경우 수정/삭제 가능
  return postMemberId === currentUserId;
});

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return "";

  // UTC 기준 날짜 → 한국 시간으로 변환 (+9시간)
  const utcDate = new Date(dateString);
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

  return kstDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 이미지 오류 처리
const handleImageError = (event) => {
  event.target.src = "/default-thumbnail.jpg";
  emit("image-error", event);
};

// 프로필 이미지 오류 처리
const handleProfileError = (event) => {
  event.target.src = "/default-profile.jpg";
  emit("profile-error", event);
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.post-content {
  padding: $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  min-height: 900px; // 컨테이너 최소 높이를 더 길게 설정

  @media (max-width: $breakpoint-md) {
    min-height: 700px;
    padding: $spacing-lg;
  }

  @media (max-width: $breakpoint-sm) {
    min-height: 600px;
    padding: $spacing-xs;
  }

  &__header {
    margin-bottom: $spacing-lg;
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: $spacing-lg;
  }

  &__author-actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__title {
    font-size: 2rem;
    color: $primary-color;
    margin: 0 0 $spacing-lg;
    line-height: 1.4;
    font-weight: $font-weight-bold;

    @media (max-width: $breakpoint-md) {
      font-size: 1.7rem;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 1.5rem;
    }
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-md;
    padding-bottom: $spacing-lg;
  }

  &__author {
    display: flex;
    align-items: center;
  }

  &__author-image {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: $spacing-md;
    @include glassmorphism(0.3, 5px);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: $breakpoint-sm) {
      width: 40px;
      height: 40px;
      margin-right: $spacing-sm;
    }
  }

  &__author-info {
    display: flex;
    flex-direction: column;
  }

  &__author-name {
    font-weight: $font-weight-medium;
    color: $primary-color;
    font-size: 1.1rem;

    @media (max-width: $breakpoint-sm) {
      font-size: 1rem;
    }
  }

  &__date {
    font-size: 0.9rem;
    color: rgba($primary-color, 0.6);
    margin-top: 2px;

    @media (max-width: $breakpoint-sm) {
      font-size: 0.8rem;
    }
  }

  // 썸네일 영역 스타일링
  &__thumbnail {
    margin: $spacing-md 0 $spacing-xl 0; // 상단 마진 줄이고 하단은 유지

    @media (max-width: $breakpoint-md) {
      margin: $spacing-sm 0 $spacing-lg 0;
    }
  }

  &__thumbnail-container {
    position: relative;
    width: 100%;
    height: 400px;
    border-radius: 16px;
    overflow: hidden;
    @include glassmorphism(0.1, 8px);

    @media (max-width: $breakpoint-md) {
      height: 300px;
    }

    @media (max-width: $breakpoint-sm) {
      height: 250px;
      border-radius: 12px;
    }
  }

  &__thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform $transition-normal;

    &:hover {
      transform: scale(1.02);
    }
  }

  &__thumbnail-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(transparent, rgba($primary-color, 0.3));
    pointer-events: none;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    flex-grow: 1;

    @media (max-width: $breakpoint-md) {
      gap: $spacing-md;
    }
  }

  // 본문 콘텐츠 섹션 스타일링
  &__main-content {
    flex-grow: 1;
    min-height: 300px; // 본문 영역 최소 높이 확보
  }

  &__text {
    line-height: 1.8;
    color: $primary-color;
    font-size: 1.1rem;

    @media (max-width: $breakpoint-sm) {
      font-size: 1rem;
      line-height: 1.7;
    }

    ::v-deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: $spacing-lg 0;
    }

    ::v-deep(a) {
      color: $accent-color;
      text-decoration: none;
      font-weight: $font-weight-medium;

      &:hover {
        text-decoration: underline;
      }
    }

    ::v-deep(h1),
    ::v-deep(h2),
    ::v-deep(h3),
    ::v-deep(h4),
    ::v-deep(h5),
    ::v-deep(h6) {
      margin-top: $spacing-2xl;
      margin-bottom: $spacing-lg;
      color: $primary-color;
      font-weight: $font-weight-bold;

      @media (max-width: $breakpoint-md) {
        margin-top: $spacing-xl;
        margin-bottom: $spacing-md;
      }
    }

    ::v-deep(p) {
      margin-bottom: $spacing-lg;

      &:last-child {
        margin-bottom: 0;
      }
    }

    ::v-deep(ul),
    ::v-deep(ol) {
      margin-bottom: $spacing-lg;
      padding-left: $spacing-xl;

      li {
        margin-bottom: $spacing-sm;
      }
    }

    ::v-deep(blockquote) {
      margin: $spacing-xl 0;
      padding: $spacing-lg;
      border-left: 4px solid $accent-color;
      @include glassmorphism(0.3, 8px);
      border-radius: 0 8px 8px 0;
      font-style: italic;
      position: relative;

      &::before {
        content: '"';
        font-size: 3rem;
        color: rgba($accent-color, 0.3);
        position: absolute;
        top: -10px;
        left: $spacing-md;
        font-family: serif;
      }
    }

    ::v-deep(pre) {
      background: rgba($primary-color, 0.05);
      padding: $spacing-lg;
      border-radius: 8px;
      overflow-x: auto;
      margin: $spacing-xl 0;
      border: 1px solid rgba($primary-color, 0.1);

      code {
        background: none;
        padding: 0;
      }
    }

    ::v-deep(code) {
      font-family: "Monaco", "Consolas", monospace;
      background: rgba($primary-color, 0.08);
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      color: rgba($primary-color, 0.9);
    }
  }
}

.back-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  transition: transform $transition-fast;

  &:hover {
    transform: translateX(-2px);
  }

  .post-content__icon {
    width: 16px;
    height: 16px;
  }
}

.delete-btn {
  color: $error-color;

  &:hover {
    background-color: rgba($error-color, 0.1);
    border-color: $error-color;
  }
}

// 모바일 최적화
@media (max-width: $breakpoint-md) {
  .post-content {
    &__actions {
      flex-direction: column;
      gap: $spacing-sm;
      align-items: stretch;
    }

    &__author-actions {
      justify-content: center;
    }

    &__meta {
      flex-direction: column;
      align-items: stretch;
      gap: $spacing-sm;
    }
  }
}

// 추가 반응형 처리
@media (max-width: $breakpoint-sm) {
  .post-content {
    &__actions {
      gap: $spacing-xs;
    }

    &__author-actions {
      flex-direction: column;
    }
  }
}
</style>
