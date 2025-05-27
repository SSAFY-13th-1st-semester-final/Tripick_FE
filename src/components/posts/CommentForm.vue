<template>
  <div class="comment-form">
    <div class="comment-form__card glass-card">
      <div class="comment-form__input-wrapper">
        <div class="comment-form__avatar">
          <img
            :src="
              authStore.currentUser?.profileImageUrl || '/default-profile.jpg'
            "
            :alt="authStore.currentUser?.nickname || '사용자'"
            @error="handleProfileError"
          />
        </div>

        <div class="comment-form__input-area">
          <textarea
            v-model="content"
            ref="textareaRef"
            class="comment-form__textarea glass-input"
            :placeholder="placeholder"
            rows="2"
            maxlength="1000"
            @keydown.esc="handleCancel"
            @focus="onFocus"
            @blur="onBlur"
          ></textarea>

          <div
            class="comment-form__actions"
            :class="{
              'comment-form__actions--visible': isFocused || content.trim(),
            }"
          >
            <div class="comment-form__counter">
              <span
                :class="[
                  'comment-form__count',
                  { 'comment-form__count--warning': content.length > 900 },
                ]"
              >
                {{ content.length }}/1000
              </span>
            </div>

            <div class="comment-form__buttons">
              <AppButton
                v-if="showCancel"
                @click="handleCancel"
                variant="outline"
                size="sm"
                :disabled="isSubmitting"
              >
                취소
              </AppButton>
              <AppButton
                @click="submitComment"
                variant="primary"
                size="sm"
                :disabled="
                  !content.trim() || content.length > 1000 || isSubmitting
                "
                :loading="isSubmitting"
              >
                {{ parentId ? "답글" : "댓글" }}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import PostService from "@/services/post.service";
import AppButton from "@/components/common/shared/AppButton.vue";

// Props
const props = defineProps({
  postId: {
    type: Number,
    required: true,
  },
  parentId: {
    type: Number,
    default: null,
  },
  placeholder: {
    type: String,
    default: "댓글을 작성해보세요...",
  },
  showCancel: {
    type: Boolean,
    default: false,
  },
  autoFocus: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["comment-created", "cancel"]);

// 스토어
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 상태
const content = ref("");
const isSubmitting = ref(false);
const isFocused = ref(false);
const textareaRef = ref(null);

// 포커스 이벤트
const onFocus = () => {
  isFocused.value = true;
};

const onBlur = () => {
  isFocused.value = false;
};

// 댓글 제출
const submitComment = async () => {
  if (!content.value.trim()) {
    notificationStore.showWarning("댓글 내용을 입력해주세요.");
    return;
  }

  if (content.value.length > 1000) {
    notificationStore.showWarning("댓글은 1000자 이내로 작성해주세요.");
    return;
  }

  isSubmitting.value = true;

  try {
    // 인증 상태 확인
    if (!authStore.isAuthenticated) {
      notificationStore.showError("로그인이 필요합니다.");
      return;
    }

    // 토큰 갱신
    await authStore.refreshUserData();

    // 댓글 데이터 구성
    const commentData = {
      content: content.value.trim(),
      parentId: props.parentId,
    };

    // API 호출
    const response = await PostService.createComment(props.postId, commentData);

    // 응답 처리
    if (response && response.data) {
      const newComment = response.data.data || response.data;

      // 새 댓글 정보에 현재 사용자 정보 추가 (API에서 제공하지 않는 경우)
      if (!newComment.writerName && authStore.currentUser) {
        newComment.writerName = authStore.currentUser.nickname;
        newComment.profileImageUrl = authStore.currentUser.profileImageUrl;
        newComment.writerId = authStore.currentUser.id;
      }

      emit("comment-created", newComment);
      content.value = "";
      isFocused.value = false;

      // 댓글 작성 후 포커스를 유지하지 않음 (답글인 경우 폼이 닫힘)
      if (!props.parentId) {
        await nextTick();
        textareaRef.value?.blur();
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      notificationStore.showError(
        "세션이 만료되었습니다. 다시 로그인해주세요."
      );
      authStore.logout();
    } else if (error.response && error.response.status === 403) {
      notificationStore.showError("댓글을 작성할 권한이 없습니다.");
    } else if (error.response && error.response.status === 404) {
      notificationStore.showError("게시글을 찾을 수 없습니다.");
    } else if (error.response && error.response.status === 429) {
      notificationStore.showError(
        "너무 많은 요청입니다. 잠시 후 다시 시도해주세요."
      );
    } else {
      notificationStore.showError("댓글 작성에 실패했습니다.");
    }
  } finally {
    isSubmitting.value = false;
  }
};

// 취소 처리
const handleCancel = () => {
  content.value = "";
  isFocused.value = false;
  emit("cancel");
};

// 프로필 이미지 오류 처리
const handleProfileError = (event) => {
  event.target.src = "/default-profile.jpg";
};

// 컴포넌트 마운트 시 자동 포커스
onMounted(async () => {
  if (props.autoFocus) {
    await nextTick();
    textareaRef.value?.focus();
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.comment-form {
  width: 100%;
  margin-bottom: $spacing-xs; // 하단 여백 추가로 가시성 향상

  &__card {
    padding: $spacing-sm $spacing-md;
    transition: all $transition-fast;

    &:focus-within {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(31, 38, 135, 0.12);
    }
  }

  &__input-wrapper {
    display: flex;
    gap: $spacing-sm;
    align-items: flex-start;
  }

  &__avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    margin-top: 2px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__input-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__textarea {
    resize: none;
    min-height: 36px;
    max-height: 120px;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.4;
    border: none;
    padding: $spacing-xs $spacing-sm;
    transition: all $transition-fast;

    &:focus {
      outline: none;
      min-height: 60px;
    }

    &::placeholder {
      color: rgba($primary-color, 0.5);
      font-size: 0.9rem;
    }
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all $transition-fast;

    &--visible {
      opacity: 1;
      max-height: 40px;
      margin-top: $spacing-xs;
    }
  }

  &__counter {
    flex: 1;
  }

  &__count {
    font-size: 0.75rem;
    color: rgba($primary-color, 0.5);
    transition: color $transition-fast;

    &--warning {
      color: $warning-color;
      font-weight: $font-weight-medium;
    }
  }

  &__buttons {
    display: flex;
    gap: $spacing-xs;
  }
}

// 모바일 최적화
@media (max-width: $breakpoint-md) {
  .comment-form {
    &__card {
      padding: $spacing-xs $spacing-sm;
    }

    &__avatar {
      width: 24px;
      height: 24px;
    }

    &__textarea {
      font-size: 0.85rem;
      min-height: 32px;

      &:focus {
        min-height: 50px;
      }

      &::placeholder {
        font-size: 0.85rem;
      }
    }

    &__actions {
      &--visible {
        max-height: 36px;
      }
    }

    &__count {
      font-size: 0.7rem;
    }
  }
}
</style>
