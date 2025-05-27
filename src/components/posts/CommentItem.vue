<template>
  <div class="comment-item" :class="{ 'comment-item--reply': !isRoot }">
    <div class="comment-item__card glass-card">
      <!-- 1행: 프로필이미지 + 닉네임 + 작성일자 + 수정됨 ---- 수정/삭제아이콘 -->
      <div class="comment-item__header">
        <div class="comment-item__author-info">
          <div class="comment-item__avatar">
            <img
              :src="comment.profileImageUrl || '/default-profile.jpg'"
              :alt="comment.writerName"
              @error="handleProfileError"
            />
          </div>
          <span class="comment-item__author-name">{{
            comment.writerName
          }}</span>
          <span class="comment-item__date">{{
            formatDate(comment.createdAt)
          }}</span>
          <span
            v-if="comment.updatedAt !== comment.createdAt"
            class="comment-item__edited"
          >
            (수정됨)
          </span>
        </div>

        <div v-if="isAuthorOrAdmin" class="comment-item__actions">
          <button
            v-if="!isEditing"
            @click="startEdit"
            class="comment-item__action-btn"
            aria-label="수정"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              ></path>
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              ></path>
            </svg>
          </button>
          <button
            @click="confirmDelete"
            class="comment-item__action-btn comment-item__action-btn--delete"
            aria-label="삭제"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- 2행: (대댓글인 경우 멘션) + 댓글내용 -->
      <div class="comment-item__content">
        <!-- 수정 모드 -->
        <div v-if="isEditing" class="comment-item__edit-form">
          <textarea
            v-model="editContent"
            class="comment-item__edit-textarea glass-input"
            rows="3"
            maxlength="1000"
            placeholder="댓글을 수정하세요..."
            @keydown.esc="cancelEdit"
          ></textarea>
          <div class="comment-item__edit-actions">
            <AppButton @click="cancelEdit" variant="outline" size="sm">
              취소
            </AppButton>
            <AppButton
              @click="saveEdit"
              variant="primary"
              size="sm"
              :disabled="!editContent.trim() || isUpdating"
              :loading="isUpdating"
            >
              저장
            </AppButton>
          </div>
        </div>

        <!-- 일반 모드 -->
        <div v-else class="comment-item__text">
          <!-- 대댓글인 경우 멘션을 내용 앞에 표시 -->
          <span v-if="!isRoot && parentComment" class="comment-item__mention">
            @{{ parentComment.writerName }}
          </span>
          {{ comment.content }}
        </div>
      </div>

      <!-- 3행 우측: 좋아요 및 대댓글 작성 버튼 -->
      <div class="comment-item__footer">
        <div class="comment-item__actions-right">
          <!-- 좋아요 버튼 -->
          <button
            class="comment-item__like-btn"
            :class="{ 'comment-item__like-btn--active': comment.isLiked }"
            @click="toggleLike"
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
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              ></path>
            </svg>
            <span v-if="comment.likeCount > 0">{{ comment.likeCount }}</span>
          </button>

          <!-- 답글 버튼 -->
          <button
            v-if="authStore.isAuthenticated"
            @click="toggleReplyForm"
            class="comment-item__reply-btn"
            :class="{ 'comment-item__reply-btn--active': showReplyForm }"
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
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              ></path>
            </svg>
            답글
          </button>
        </div>
      </div>
    </div>

    <!-- 답글 작성 폼 -->
    <div v-if="showReplyForm" class="comment-item__reply-form">
      <CommentForm
        :post-id="postId"
        :parent-id="comment.id"
        :placeholder="`${comment.writerName}님에게 답글 작성...`"
        @comment-created="handleReplyCreated"
        @cancel="showReplyForm = false"
        show-cancel
        auto-focus
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import PostService from "@/services/post.service";
import AppButton from "@/components/common/shared/AppButton.vue";
import CommentForm from "./CommentForm.vue";

// Props
const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  postId: {
    type: Number,
    required: true,
  },
  parentComment: {
    type: Object,
    default: null,
  },
  isRoot: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits([
  "comment-updated",
  "comment-deleted",
  "reply-created",
]);

// 스토어
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 상태
const isEditing = ref(false);
const editContent = ref("");
const isUpdating = ref(false);
const showReplyForm = ref(false);

// 계산된 속성
const isAuthorOrAdmin = computed(() => {
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin) return true;
  return (
    !!authStore.currentUser &&
    props.comment.writerId === Number(authStore.currentUser.id)
  );
});

// 수정 시작
const startEdit = () => {
  isEditing.value = true;
  editContent.value = props.comment.content;
};

// 수정 취소
const cancelEdit = () => {
  isEditing.value = false;
  editContent.value = "";
};

// 수정 저장
const saveEdit = async () => {
  if (!editContent.value.trim()) return;

  isUpdating.value = true;

  try {
    await PostService.updateComment(props.postId, props.comment.id, {
      content: editContent.value.trim(),
    });

    emit("comment-updated", props.comment.id, editContent.value.trim());
    isEditing.value = false;
    editContent.value = "";
  } catch (error) {
    if (error.response && error.response.status === 401) {
      notificationStore.showError(
        "세션이 만료되었습니다. 다시 로그인해주세요."
      );
      authStore.logout();
    } else if (error.response && error.response.status === 403) {
      notificationStore.showError("댓글을 수정할 권한이 없습니다.");
    } else {
      notificationStore.showError("댓글 수정에 실패했습니다.");
    }
  } finally {
    isUpdating.value = false;
  }
};

// 삭제 확인
const confirmDelete = () => {
  if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
    deleteComment();
  }
};

// 댓글 삭제
const deleteComment = async () => {
  try {
    await PostService.deleteComment(props.postId, props.comment.id);
    emit("comment-deleted", props.comment.id);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      notificationStore.showError(
        "세션이 만료되었습니다. 다시 로그인해주세요."
      );
      authStore.logout();
    } else if (error.response && error.response.status === 403) {
      notificationStore.showError("댓글을 삭제할 권한이 없습니다.");
    } else {
      notificationStore.showError("댓글 삭제에 실패했습니다.");
    }
  }
};

// 좋아요 토글 (추후 구현)
const toggleLike = () => {
  notificationStore.showInfo("좋아요 기능은 준비 중입니다.");
};

// 답글 폼 토글
const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value;
};

// 답글 생성 처리
const handleReplyCreated = (newReply) => {
  // 루트 댓글에 대한 답글이면 해당 루트 댓글 ID로, 아니면 부모 루트 댓글 ID로 emit
  const targetParentId = props.isRoot
    ? props.comment.id
    : props.parentComment
    ? props.parentComment.id
    : props.comment.id;
  emit("reply-created", targetParentId, newReply);
  showReplyForm.value = false;
};

// 날짜 포맷팅 (UTC를 한국 시간으로 변환)
const formatDate = (dateString) => {
  if (!dateString) return "";

  // UTC 날짜를 한국 시간으로 변환 (+9시간)
  const utcDate = new Date(dateString);
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
  const now = new Date();

  const diffMs = now - kstDate;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "방금 전";
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return kstDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

// 프로필 이미지 오류 처리
const handleProfileError = (event) => {
  event.target.src = "/default-profile.jpg";
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.comment-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &--reply {
    .comment-item__card {
      background: rgba(255, 255, 255, 0.4);
      // border-left 제거하여 중복 방지
    }
  }

  &__card {
    padding: $spacing-md;
    transition: all $transition-fast;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(31, 38, 135, 0.12);
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__author-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__author-name {
    font-weight: $font-weight-medium;
    color: $primary-color;
    font-size: 0.9rem;
  }

  &__date {
    font-size: 0.75rem;
    color: rgba($primary-color, 0.6);
  }

  &__edited {
    font-size: 0.7rem;
    color: rgba($primary-color, 0.5);
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }

  &__action-btn {
    background: transparent;
    border: none;
    padding: $spacing-xs;
    cursor: pointer;
    border-radius: 4px;
    color: rgba($primary-color, 0.6);
    transition: all $transition-fast;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba($primary-color, 0.1);
      color: $primary-color;
    }

    &--delete {
      &:hover {
        background: rgba($error-color, 0.1);
        color: $error-color;
      }
    }
  }

  &__content {
    margin-bottom: $spacing-sm;
  }

  &__text {
    line-height: 1.4;
    color: $primary-color;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.9rem;
  }

  &__mention {
    color: $accent-color;
    font-weight: $font-weight-medium;
    font-size: 0.85rem;
    background: rgba($accent-color, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: $spacing-xs;
    display: inline-block;
  }

  &__edit-form {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__edit-textarea {
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.4;

    &:focus {
      outline: none;
    }
  }

  &__edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-xs;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  &__actions-right {
    display: flex;
    gap: $spacing-sm;
  }

  &__like-btn,
  &__reply-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: 4px $spacing-sm;
    border-radius: 12px;
    font-size: 0.8rem;
    color: rgba($primary-color, 0.6);
    transition: all $transition-fast;

    &:hover {
      background: rgba($primary-color, 0.05);
      color: $primary-color;
    }

    &--active {
      color: $accent-color;
      background: rgba($accent-color, 0.1);

      &:hover {
        background: rgba($accent-color, 0.15);
      }
    }
  }

  &__like-btn {
    &--active {
      color: $error-color;
      background: rgba($error-color, 0.1);

      &:hover {
        background: rgba($error-color, 0.15);
      }
    }
  }

  &__reply-form {
    margin-top: $spacing-sm;
  }
}

// 모바일 최적화
@media (max-width: $breakpoint-md) {
  .comment-item {
    &__card {
      padding: $spacing-sm;
    }

    &__avatar {
      width: 28px;
      height: 28px;
    }

    &__author-name {
      font-size: 0.85rem;
    }

    &__mention {
      font-size: 0.8rem;
      padding: 1px 4px;
    }

    &__date,
    &__edited {
      font-size: 0.7rem;
    }

    &__text {
      font-size: 0.85rem;
    }

    &__actions {
      gap: 2px;
    }

    &__action-btn {
      padding: 4px;
    }

    &__stats {
      gap: $spacing-xs;
    }

    &__like-btn,
    &__reply-btn {
      font-size: 0.75rem;
      padding: 3px $spacing-xs;
    }
  }
}
</style>
