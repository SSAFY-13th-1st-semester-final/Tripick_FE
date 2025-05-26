<template>
  <div class="post-comments glass-card">
    <div class="post-comments__header">
      <h3 class="post-comments__title">
        댓글 {{ formatCount(totalComments) }}개
      </h3>
    </div>

    <!-- 댓글 작성 폼 -->
    <div v-if="authStore.isAuthenticated" class="post-comments__form-wrapper">
      <CommentForm
        :post-id="postId"
        :parent-id="null"
        placeholder="댓글을 작성해보세요..."
        @comment-created="handleCommentCreated"
      />
    </div>

    <div v-else class="post-comments__login-prompt">
      <p>댓글을 작성하려면 로그인이 필요합니다.</p>
      <AppButton @click="goToLogin" variant="primary" size="sm">
        로그인하기
      </AppButton>
    </div>

    <!-- 댓글 목록 (고정 높이 스크롤 컨테이너) -->
    <div class="post-comments__container">
      <div v-if="isInitialLoading" class="post-comments__loading">
        <div class="loading-spinner"></div>
        <p>댓글을 불러오는 중...</p>
      </div>

      <div v-else-if="error" class="post-comments__error">
        <p>{{ error }}</p>
        <AppButton @click="loadComments" variant="outline" size="sm">
          다시 시도
        </AppButton>
      </div>

      <div v-else-if="comments.length === 0" class="post-comments__empty">
        <p>아직 댓글이 없습니다.</p>
        <p class="post-comments__empty-sub">첫 번째 댓글을 작성해보세요!</p>
      </div>

      <div
        v-else
        class="post-comments__list"
        ref="commentsList"
        @scroll="handleScroll"
      >
        <!-- 댓글 스레드 구조 -->
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="post-comments__thread"
        >
          <!-- 루트 댓글 -->
          <CommentItem
            :comment="comment"
            :post-id="postId"
            :is-root="true"
            @comment-updated="handleCommentUpdated"
            @comment-deleted="handleCommentDeleted"
            @reply-created="handleReplyCreated"
          />

          <!-- 모든 대댓글들을 하나의 깊이로 표시 -->
          <div
            v-if="flattenReplies(comment.children).length > 0"
            class="post-comments__replies"
          >
            <CommentItem
              v-for="reply in flattenReplies(comment.children)"
              :key="reply.id"
              :comment="reply"
              :post-id="postId"
              :parent-comment="comment"
              :is-root="false"
              @comment-updated="handleCommentUpdated"
              @comment-deleted="handleCommentDeleted"
              @reply-created="handleReplyCreated"
            />
          </div>
        </div>

        <!-- 무한스크롤 로딩 -->
        <div v-if="isLoadingMore" class="post-comments__loading-more">
          <div class="loading-spinner-small"></div>
          <p>더 많은 댓글을 불러오는 중...</p>
        </div>

        <!-- 무한스크롤 트리거 -->
        <div
          ref="infiniteScrollTrigger"
          class="post-comments__scroll-trigger"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import PostService from "@/services/post.service";
import AppButton from "@/components/common/shared/AppButton.vue";
import CommentItem from "./CommentItem.vue";
import CommentForm from "./CommentForm.vue";

// Props
const props = defineProps({
  postId: {
    type: Number,
    required: true,
  },
});

// Emits 정의 - 댓글 관련 이벤트 추가
const emit = defineEmits(["comment-posted", "comment-changed"]);

// 라우터 및 스토어
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 상태 정의
const comments = ref([]);
const totalComments = ref(0);
const pagination = ref(null);
const isInitialLoading = ref(false);
const isLoadingMore = ref(false);
const error = ref(null);
const currentPage = ref(0);
const commentsList = ref(null);
const infiniteScrollTrigger = ref(null);
const observer = ref(null);

// 더 많은 댓글이 있는지 확인
const hasMoreComments = computed(() => {
  if (!pagination.value) return false;
  return (
    !pagination.value.last &&
    pagination.value.number < pagination.value.totalPages - 1
  );
});

// 중첩된 댓글들을 flat하게 만드는 함수 (모든 깊이를 하나의 배열로)
const flattenReplies = (children) => {
  if (!children || children.length === 0) return [];

  const flattened = [];

  const flatten = (comments) => {
    comments.forEach((comment) => {
      flattened.push(comment);
      if (comment.children && comment.children.length > 0) {
        flatten(comment.children);
      }
    });
  };

  flatten(children);
  return flattened;
};

// 댓글 목록 로드
const loadComments = async (page = 0, append = false) => {
  if (!props.postId) return;

  if (page === 0) {
    isInitialLoading.value = true;
  } else {
    isLoadingMore.value = true;
  }

  error.value = null;

  try {
    const response = await PostService.getComments(props.postId, {
      page: page,
      size: 10,
    });

    if (response && response.data && response.data.data) {
      const newComments = response.data.data.content || [];

      if (append) {
        comments.value = [...comments.value, ...newComments];
      } else {
        comments.value = newComments;
      }

      // API 응답 구조에 맞게 페이지네이션 정보 설정
      pagination.value = {
        number: response.data.data.number || 0,
        totalPages: response.data.data.totalPages || 1,
        totalElements: response.data.data.totalElements || 0,
        numberOfElements: response.data.data.numberOfElements || 0,
        first: response.data.data.first !== false,
        last: response.data.data.last === true,
        size: response.data.data.size || 10,
        empty: response.data.data.empty === true,
      };

      // 총 댓글 수는 totalElements 사용 (실제 서버의 전체 댓글 수)
      totalComments.value = pagination.value.totalElements;
      currentPage.value = page;

      // 디버깅용 로그
      console.log("댓글 로드 완료:", {
        루트댓글수: comments.value.length,
        전체댓글수: totalComments.value,
        현재페이지: pagination.value.number,
        전체페이지: pagination.value.totalPages,
        더있음: hasMoreComments.value,
      });

      // 각 루트 댓글의 flatten된 대댓글 수 확인
      comments.value.forEach((comment, index) => {
        const flatReplies = flattenReplies(comment.children);
        if (flatReplies.length > 0) {
          console.log(
            `루트댓글 ${index + 1}: ${flatReplies.length}개의 대댓글`
          );
        }
      });

      // 데이터 로드 후 무한스크롤 재설정 (append 모드에서)
      if (append && hasMoreComments.value) {
        setTimeout(() => {
          setupInfiniteScroll();
        }, 100);
      }
    }
  } catch (err) {
    console.error("댓글 로드 오류:", err);
    error.value = "댓글을 불러오는 중 오류가 발생했습니다.";

    if (err.response && err.response.status === 404) {
      error.value = "게시글을 찾을 수 없습니다.";
    }
  } finally {
    isInitialLoading.value = false;
    isLoadingMore.value = false;
  }
};

// 더 많은 댓글 로드
const loadMoreComments = async () => {
  if (!hasMoreComments.value || isLoadingMore.value) {
    console.log("Load more blocked:", {
      hasMore: hasMoreComments.value,
      isLoading: isLoadingMore.value,
      currentPage: currentPage.value,
      totalPages: pagination.value?.totalPages,
    });
    return;
  }

  console.log("Loading more comments - page:", currentPage.value + 1);
  await loadComments(currentPage.value + 1, true);
};

// 스크롤 이벤트 처리 (무한스크롤)
const handleScroll = () => {
  const container = commentsList.value;
  if (!container || isLoadingMore.value || !hasMoreComments.value) return;

  const { scrollTop, scrollHeight, clientHeight } = container;
  const threshold = 100;
  const remaining = scrollHeight - scrollTop - clientHeight;

  if (remaining < threshold) {
    console.log("Triggering load more from scroll");
    loadMoreComments();
  }
};

// 무한스크롤 설정
const setupInfiniteScroll = () => {
  if (!infiniteScrollTrigger.value || !commentsList.value) {
    console.log("Cannot setup infinite scroll:", {
      hasTrigger: !!infiniteScrollTrigger.value,
      hasContainer: !!commentsList.value,
    });
    return;
  }

  // 기존 observer가 있다면 정리
  if (observer.value) {
    observer.value.disconnect();
  }

  console.log("Setting up infinite scroll observer");

  observer.value = new IntersectionObserver(
    (entries) => {
      const target = entries[0];
      console.log("Intersection observer triggered:", {
        isIntersecting: target.isIntersecting,
        hasMore: hasMoreComments.value,
        isLoading: isLoadingMore.value,
      });

      if (
        target.isIntersecting &&
        hasMoreComments.value &&
        !isLoadingMore.value
      ) {
        console.log("Triggering load more from intersection observer");
        loadMoreComments();
      }
    },
    {
      root: commentsList.value,
      threshold: 0.1,
      rootMargin: "50px",
    }
  );

  observer.value.observe(infiniteScrollTrigger.value);
};

// 댓글 생성 처리 - 상위 컴포넌트에 이벤트 전달 추가
const handleCommentCreated = async (newComment) => {
  notificationStore.showSuccess("댓글이 작성되었습니다.");
  await loadComments(0, false);

  // 댓글 목록 상단으로 스크롤
  setTimeout(() => {
    if (commentsList.value) {
      commentsList.value.scrollTop = 0;
    }
  }, 100);

  // 상위 컴포넌트에 댓글 작성 이벤트 전달
  emit("comment-posted", {
    type: "comment",
    postId: props.postId,
    comment: newComment,
  });
};

// 대댓글 생성 처리 - 상위 컴포넌트에 이벤트 전달 추가
const handleReplyCreated = async (parentCommentId, newReply) => {
  notificationStore.showSuccess("답글이 작성되었습니다.");
  await loadComments(0, false);

  // 상위 컴포넌트에 대댓글 작성 이벤트 전달
  emit("comment-posted", {
    type: "reply",
    postId: props.postId,
    parentCommentId,
    reply: newReply,
  });
};

// 댓글 수정 처리 - 상위 컴포넌트에 이벤트 전달 추가
const handleCommentUpdated = async (commentId, updatedContent) => {
  notificationStore.showSuccess("댓글이 수정되었습니다.");
  await loadComments(0, false);

  // 상위 컴포넌트에 댓글 변경 이벤트 전달
  emit("comment-changed", {
    type: "update",
    postId: props.postId,
    commentId,
    content: updatedContent,
  });
};

// 댓글 삭제 처리 - 상위 컴포넌트에 이벤트 전달 추가
const handleCommentDeleted = async (commentId) => {
  notificationStore.showSuccess("댓글이 삭제되었습니다.");
  await loadComments(0, false);

  // 상위 컴포넌트에 댓글 변경 이벤트 전달
  emit("comment-changed", {
    type: "delete",
    postId: props.postId,
    commentId,
  });
};

// 로그인 페이지로 이동
const goToLogin = () => {
  router.push({
    name: "login",
    query: { redirect: route.fullPath },
  });
};

// 수 포맷팅
const formatCount = (count) => {
  if (!count && count !== 0) return "0";

  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }

  return count.toString();
};

// postId 변경 감지
watch(
  () => props.postId,
  async (newPostId) => {
    if (newPostId) {
      // 기존 observer 정리
      if (observer.value) {
        observer.value.disconnect();
        observer.value = null;
      }

      // 상태 초기화
      comments.value = [];
      currentPage.value = 0;
      totalComments.value = 0;

      // 새로운 게시글 댓글 로드
      await loadComments();

      // 다음 틱에서 무한스크롤 설정
      await nextTick();
      if (hasMoreComments.value) {
        setupInfiniteScroll();
      }
    }
  },
  { immediate: true }
);

// 컴포넌트 언마운트 시 observer 정리
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
    observer.value = null;
  }
});

// 컴포넌트 마운트 시 댓글 로드
onMounted(async () => {
  if (props.postId) {
    await loadComments();
    // 데이터 로드 후 무한스크롤 설정
    await nextTick();
    if (hasMoreComments.value) {
      setupInfiniteScroll();
    }
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.post-comments {
  @include glassmorphism();
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  height: 800px;
  max-height: 80vh;

  &__header {
    padding-bottom: $spacing-md;
    border-bottom: 1px solid rgba($primary-color, 0.1);
    flex-shrink: 0;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    margin: 0;
  }

  &__form-wrapper {
    margin: $spacing-md 0;
    flex-shrink: 0;
  }

  &__login-prompt {
    padding: $spacing-lg;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-md;
    flex-shrink: 0;
    background: rgba($primary-color, 0.02);
    border-radius: 8px;
    margin: $spacing-md 0;

    p {
      margin: 0;
      color: rgba($primary-color, 0.7);
    }
  }

  &__container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  &__loading,
  &__error,
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: $spacing-md;
    text-align: center;

    p {
      margin: 0;
      color: rgba($primary-color, 0.7);
    }
  }

  &__empty-sub {
    font-size: 0.9rem;
    color: rgba($primary-color, 0.5) !important;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    padding-right: $spacing-xs;

    // 커스텀 스크롤바
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba($light-gray, 0.3);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($primary-color, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba($primary-color, 0.5);
      }
    }
  }

  &__thread {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__replies {
    margin-left: $spacing-xl;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    position: relative;

    // 단일 수직선 표시
    &::before {
      content: "";
      position: absolute;
      left: -$spacing-md;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(
        to bottom,
        rgba($accent-color, 0.3) 0%,
        rgba($accent-color, 0.1) 100%
      );
      border-radius: 1px;
    }
  }

  &__loading-more {
    padding: $spacing-lg;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;

    p {
      margin: 0;
      color: rgba($primary-color, 0.6);
      font-size: 0.9rem;
    }
  }

  &__scroll-trigger {
    height: 20px;
    width: 100%;
    flex-shrink: 0;
  }
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba($primary-color, 0.1);
  border-top-color: $accent-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid rgba($primary-color, 0.1);
  border-top-color: $accent-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 모바일 최적화
@media (max-width: $breakpoint-md) {
  .post-comments {
    height: 500px;
    padding: $spacing-md;

    &__header {
      padding-bottom: $spacing-sm;
    }

    &__title {
      font-size: 1rem;
    }

    &__form-wrapper {
      margin: $spacing-sm 0;
    }

    &__login-prompt {
      margin: $spacing-sm 0;
      padding: $spacing-md;
    }

    &__list {
      gap: $spacing-md;
    }

    &__thread {
      gap: $spacing-xs;
    }

    &__replies {
      margin-left: $spacing-lg;
      gap: $spacing-sm;

      &::before {
        left: -$spacing-sm;
      }
    }

    &__loading-more {
      padding: $spacing-md;
    }
  }
}

// 태블릿 최적화
@media (max-width: $breakpoint-lg) and (min-width: $breakpoint-md) {
  .post-comments {
    height: 550px;
  }
}

// 호버 효과 추가
.post-comments__replies:hover::before {
  background: linear-gradient(
    to bottom,
    rgba($accent-color, 0.5) 0%,
    rgba($accent-color, 0.2) 100%
  );
  transition: background $transition-fast;
}

// 애니메이션 효과
.post-comments__thread {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
