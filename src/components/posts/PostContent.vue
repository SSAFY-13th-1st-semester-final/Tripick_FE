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

    <div v-if="post.thumbNail" class="post-content__thumbnail">
      <img :src="post.thumbNail" :alt="post.title" @error="handleImageError" />
    </div>

    <div class="post-content__body">
      <div v-if="post.description" class="post-content__description">
        {{ post.description }}
      </div>

      <div class="post-content__text" v-html="post.content"></div>
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

// 현재 사용자가 작성자인지 또는 관리자인지 확인
const isAuthorOrAdmin = computed(() => {
  if (!props.post) return false;
  if (!props.isAuthenticated) return false;

  // 관리자인 경우 항상 수정/삭제 가능
  if (props.isAdmin) return true;

  // 작성자인 경우 수정/삭제 가능
  return props.currentUser && props.post.memberId === props.currentUser.id;
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

  &__header {
    margin-bottom: $spacing-sm;
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
    font-size: 1.8rem;
    color: $primary-color;
    margin: 0 0 $spacing-lg;
    line-height: 1.4;

    @media (max-width: $breakpoint-md) {
      font-size: 1.5rem;
    }
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-md;
  }

  &__author {
    display: flex;
    align-items: center;
  }

  &__author-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: $spacing-sm;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__author-info {
    display: flex;
    flex-direction: column;
  }

  &__author-name {
    font-weight: $font-weight-medium;
    color: $primary-color;
  }

  &__date {
    font-size: 0.8rem;
    color: rgba($primary-color, 0.6);
  }

  &__thumbnail {
    margin-bottom: $spacing-md;
    overflow: hidden;
    border-radius: 8px;

    img {
      width: 100%;
      height: auto;
      display: block;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__description {
    font-size: 1.1rem;
    color: rgba($primary-color, 0.8);
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid rgba($primary-color, 0.1);
  }

  &__text {
    line-height: 1.6;
    color: $primary-color;

    ::v-deep(img) {
      max-width: 100%;
      height: auto;
    }

    ::v-deep(a) {
      color: $accent-color;
      text-decoration: none;

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
      margin-top: $spacing-xl;
      margin-bottom: $spacing-md;
      color: $primary-color;
    }

    ::v-deep(p) {
      margin-bottom: $spacing-lg;
    }

    ::v-deep(ul),
    ::v-deep(ol) {
      margin-bottom: $spacing-lg;
      padding-left: $spacing-xl;
    }

    ::v-deep(blockquote) {
      margin: $spacing-lg 0;
      padding: $spacing-md $spacing-lg;
      border-left: 4px solid $accent-color;
      background-color: rgba($accent-color, 0.05);
      font-style: italic;
    }

    ::v-deep(pre) {
      background: rgba($primary-color, 0.05);
      padding: $spacing-md;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: $spacing-lg;
    }

    ::v-deep(code) {
      font-family: monospace;
      background: rgba($primary-color, 0.05);
      padding: 2px 4px;
      border-radius: 4px;
    }
  }
}

.back-btn {
  display: flex;
  align-items: center;

  .post-content__icon {
    margin-right: $spacing-xs;
    width: 16px;
    height: 16px;
  }
}

.delete-btn {
  color: $error-color;

  &:hover {
    background-color: rgba($error-color, 0.1);
  }
}

// 모바일 최적화
@media (max-width: $breakpoint-md) {
  .post-content {
    padding: $spacing-lg;

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
</style>
