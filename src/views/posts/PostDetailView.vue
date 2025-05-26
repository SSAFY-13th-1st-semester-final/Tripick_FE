<template>
  <div class="post-detail">
    <div v-if="isLoading" class="post-detail__loading">
      <div class="loading-spinner"></div>
      <p>게시글을 불러오는 중...</p>
    </div>

    <div v-else-if="error" class="post-detail__error">
      <p>{{ error }}</p>
      <AppButton @click="navigateToList" variant="outline">
        게시판으로 돌아가기
      </AppButton>
    </div>

    <template v-else>
      <div class="post-detail__layout">
        <!-- 1열: 게시글 + 댓글 영역 -->
        <div class="post-detail__main">
          <!-- 게시글 영역 - PostContent 컴포넌트 사용 -->
          <PostContent
            :post="post"
            :is-liked="isLiked"
            :is-like-loading="isLikeLoading"
            :is-authenticated="authStore.isAuthenticated"
            :current-user="authStore.currentUser"
            :is-admin="authStore.isAdmin"
            @navigate-to-list="navigateToList"
            @edit-post="editPost"
            @confirm-delete="confirmDelete"
            @toggle-like="toggleLike"
            @image-error="handleImageError"
            @profile-error="handleProfileError"
          />

          <!-- 댓글 영역 -->
          <div class="post-detail__comments">
            <PostComments
              :post-id="post.postId"
              @comment-posted="handleCommentPosted"
              @comment-changed="handleCommentChanged"
            />
          </div>
        </div>

        <!-- 2열: AI 요약 영역 -->
        <div class="post-detail__sidebar">
          <AiPostSummaryCard
            ref="summaryCardRef"
            :post-id="post.postId"
            @summary-requested="handleSummaryRequest"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import PostService from "@/services/post.service";
import AiService from "@/services/ai.service";
import AppButton from "@/components/common/shared/AppButton.vue";
import AiPostSummaryCard from "@/components/posts/AiPostSummaryCard.vue";
import PostComments from "@/components/posts/PostComments.vue";
import PostContent from "@/components/posts/PostContent.vue";

// 라우터 및 스토어
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 상태 정의
const post = ref({});
const isLoading = ref(true);
const error = ref(null);

// 좋아요 관련 상태
const isLiked = ref(false);
const isLikeLoading = ref(false);

// AI 요약 관련 참조
const summaryCardRef = ref(null);

// 게시글 로드
const loadPost = async () => {
  const postId = parseInt(route.params.id);

  if (isNaN(postId)) {
    error.value = "유효하지 않은 게시글 ID입니다.";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // 1. 게시글 기본 정보 조회 (인증 불필요)
    const response = await PostService.getPostById(postId);

    if (response && response.data) {
      post.value = response.data;
    } else {
      throw new Error("게시글 데이터를 찾을 수 없습니다.");
    }

    // 2. 로그인된 사용자인 경우 좋아요 여부 확인 (인증 필요)
    if (authStore.isAuthenticated) {
      await checkLikeStatus(postId);
    }
  } catch (err) {
    console.error("게시글 로드 오류:", err);

    // 게시글 조회는 인증 불필요하므로 일반적인 에러만 처리
    if (err.response && err.response.status === 404) {
      error.value = "존재하지 않는 게시글입니다.";
    } else if (err.response && err.response.status === 500) {
      error.value = "서버 오류가 발생했습니다.";
    } else {
      error.value = "게시글을 불러오는 중 오류가 발생했습니다.";
    }

    notificationStore.showError(error.value, { duration: 5000 });
  } finally {
    isLoading.value = false;
  }
};

// 좋아요 상태 확인
const checkLikeStatus = async (postId) => {
  try {
    const response = await PostService.checkPostLiked(postId);

    if (response && response.data && response.data.data) {
      isLiked.value = response.data.data.isLiked;
    }

    console.log(response.data.data.isLiked);
  } catch (error) {
    console.error("좋아요 상태 확인 실패:", error);
    isLiked.value = false;

    if (error.response && error.response.status === 401) {
      // 인증 오류는 조용히 처리 (로그인하지 않은 상태에서 정상)
      console.log("로그인되지 않은 사용자입니다.");
    }
  }
};

// 좋아요 토글
const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    notificationStore.showWarning("로그인이 필요한 기능입니다.");
    return;
  }

  console.log("초기 좋아요 상태 : ", isLiked.value);

  const postId = parseInt(route.params.id);
  if (isNaN(postId)) return;

  isLikeLoading.value = true;

  try {
    let response;

    if (isLiked.value) {
      response = await PostService.unlikePost(postId);
    } else {
      response = await PostService.likePost(postId);
    }

    if (
      response &&
      (response.data.status === 200 || response.data.status === 201)
    ) {
      isLiked.value = !isLiked.value;
      console.log("수정 후 좋아요 상태 : ", isLiked.value);

      // 좋아요 수 업데이트
      if (
        response.data &&
        response.data.data &&
        response.data.data.likeCount !== undefined
      ) {
        console.log(post.value.likeCount);
        console.log(response.data.data.likeCount);
        post.value.likeCount = response.data.data.likeCount;
      } else {
        if (post.value.likeCount !== undefined) {
          post.value.likeCount += isLiked.value ? 1 : -1;
        }
      }

      const message = isLiked.value
        ? "좋아요를 눌렀습니다."
        : "좋아요를 취소했습니다.";
      notificationStore.showSuccess(message, { duration: 2000 });
    }
  } catch (error) {
    console.error("좋아요 토글 오류:", error);

    if (error.response && error.response.status === 401) {
      notificationStore.showError("로그인이 필요하거나 세션이 만료되었습니다.");
      authStore.logout();
    } else if (error.response && error.response.status === 403) {
      notificationStore.showError("이 작업을 수행할 권한이 없습니다.");
    } else if (error.response && error.response.status === 404) {
      notificationStore.showError("게시글을 찾을 수 없습니다.");
    } else {
      notificationStore.showError("좋아요 처리 중 오류가 발생했습니다.");
    }
  } finally {
    isLikeLoading.value = false;
  }
};

// AI 요약 요청 처리
const handleSummaryRequest = async (postId) => {
  if (!summaryCardRef.value) return;

  // 로딩 상태 설정
  summaryCardRef.value.setLoading(true);

  try {
    // 인증 상태 확인
    if (!authStore.isAuthenticated) {
      notificationStore.showWarning(
        "AI 요약 서비스를 사용하려면 로그인이 필요합니다."
      );
      summaryCardRef.value.setSummaryError("로그인이 필요한 서비스입니다.");
      return;
    }

    // 토큰 갱신
    await authStore.refreshUserData();

    // AI 요약 API 호출
    const response = await AiService.getPostSummary(postId);

    // 응답 처리
    if (response && response.data && response.data.data) {
      summaryCardRef.value.setSummaryData(response.data.data);
      notificationStore.showSuccess("AI 요약이 생성되었습니다!");
    } else {
      summaryCardRef.value.setSummaryError("요약 데이터를 가져올 수 없습니다.");
      notificationStore.showError("AI 요약 생성에 실패했습니다.");
    }
  } catch (err) {
    // 오류 처리
    let errorMessage = "AI 요약 서비스 오류가 발생했습니다.";

    if (err.response && err.response.status === 401) {
      errorMessage = "세션이 만료되었습니다. 다시 로그인해주세요.";
      authStore.logout();
      router.push({ name: "login", query: { redirect: route.fullPath } });
    } else if (err.response && err.response.status === 403) {
      errorMessage = "AI 요약 서비스 이용 권한이 없습니다.";
    } else if (err.response && err.response.status === 429) {
      errorMessage = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    } else if (err.response && err.response.status >= 500) {
      errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }

    summaryCardRef.value.setSummaryError(errorMessage);
    notificationStore.showError(errorMessage, {
      duration: 5000,
      closable: true,
    });
  }
};

// 댓글 작성/변경 이벤트 처리 - 게시글 새로고침
const handleCommentPosted = async (eventData) => {
  console.log("댓글 작성 이벤트:", eventData);
  // 게시글 데이터 새로고침 (댓글 수 업데이트를 위해)
  await refreshPostData();
};

const handleCommentChanged = async (eventData) => {
  console.log("댓글 변경 이벤트:", eventData);
  // 게시글 데이터 새로고침 (댓글 수 업데이트를 위해)
  await refreshPostData();
};

// 게시글 데이터만 새로고침하는 함수 (로딩 상태 없이)
const refreshPostData = async () => {
  const postId = parseInt(route.params.id);
  if (isNaN(postId)) return;

  try {
    // 게시글 기본 정보만 조회 (로딩 UI 없이)
    const response = await PostService.getPostById(postId);

    if (response && response.data) {
      // 기존 게시글 데이터 업데이트 (댓글 수 등)
      post.value = {
        ...post.value,
        ...response.data,
        // 댓글 수가 변경되었을 수 있으므로 업데이트
        commentCount: response.data.commentCount || post.value.commentCount,
      };

      console.log(
        "게시글 데이터 새로고침 완료 - 댓글 수:",
        post.value.commentCount
      );
    }
  } catch (err) {
    console.error("게시글 새로고침 오류:", err);
    // 에러가 발생해도 사용자에게 알리지 않음 (백그라운드 업데이트)
  }
};

// 목록으로 이동
const navigateToList = () => {
  router.push({ name: "posts-list" });
};

// 게시글 수정 페이지로 이동
const editPost = () => {
  // 인증 확인
  if (!authStore.isAuthenticated) {
    notificationStore.showWarning("로그인이 필요합니다.");
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  // 권한 확인 (작성자 또는 관리자)
  const isAuthorOrAdmin =
    authStore.isAdmin ||
    (authStore.currentUser && post.value.memberId === authStore.currentUser.id);

  if (!isAuthorOrAdmin) {
    notificationStore.showError("게시글을 수정할 권한이 없습니다.");
    return;
  }

  router.push({ name: "post-edit", params: { id: post.value.postId } });
};

// 게시글 삭제 확인
const confirmDelete = () => {
  if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
    deletePost();
  }
};

// 게시글 삭제
const deletePost = async () => {
  try {
    // 인증 상태 확인
    if (!authStore.isAuthenticated) {
      notificationStore.showWarning("로그인이 필요합니다.");
      router.push({ name: "login", query: { redirect: route.fullPath } });
      return;
    }

    // 권한 확인
    const isAuthorOrAdmin =
      authStore.isAdmin ||
      (authStore.currentUser &&
        post.value.memberId === authStore.currentUser.id);

    if (!isAuthorOrAdmin) {
      notificationStore.showError("게시글 삭제 권한이 없습니다.");
      return;
    }

    // 토큰 리프레시
    await authStore.refreshUserData();

    await PostService.deletePost(post.value.postId);
    notificationStore.showSuccess("게시글이 삭제되었습니다.");
    navigateToList();
  } catch (err) {
    // 오류 응답에 따른 분기 처리
    if (err.response && err.response.status === 401) {
      notificationStore.showError(
        "세션이 만료되었습니다. 다시 로그인해주세요.",
        {
          duration: 5000,
        }
      );
      authStore.logout();
      router.push({ name: "login", query: { redirect: route.fullPath } });
    } else if (err.response && err.response.status === 403) {
      notificationStore.showError("게시글을 삭제할 권한이 없습니다.");
    } else {
      notificationStore.showError("게시글 삭제에 실패했습니다.", {
        closable: true,
        duration: 5000,
      });
    }
  }
};

// 이미지 오류 처리
const handleImageError = (event) => {
  notificationStore.showInfo("썸네일 이미지를 불러올 수 없습니다.");
};

// 프로필 이미지 오류 처리
const handleProfileError = (event) => {
  // 프로필 이미지 오류는 조용히 처리
};

// 컴포넌트 마운트 시 게시글 로드
onMounted(loadPost);
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.post-detail {
  max-width: 1400px;
  margin: 0 auto;
  padding: $spacing-lg;

  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: $spacing-2xl 0;
    text-align: center;

    p {
      margin: $spacing-md 0;
      color: rgba($primary-color, 0.7);
    }
  }

  &__layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: $spacing-xl;
    align-items: start;
    max-width: 1800px;
    margin: 0 auto;

    @media (max-width: $breakpoint-xl) {
      grid-template-columns: 1fr 360px;
      gap: $spacing-lg;
    }

    @media (max-width: $breakpoint-lg) {
      grid-template-columns: 1fr;
      gap: $spacing-lg;
    }
  }

  &__main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;

    @media (max-width: $breakpoint-lg) {
      gap: $spacing-lg;
    }
  }

  &__sidebar {
    min-width: 0;
    position: sticky;
    top: $spacing-xl;

    @media (max-width: $breakpoint-lg) {
      position: static;
      order: 2;
    }
  }

  &__comments {
    margin-top: $spacing-lg;

    @media (max-width: $breakpoint-md) {
      margin-top: $spacing-md;
    }
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($primary-color, 0.1);
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
  .post-detail {
    padding: $spacing-md;

    &__sidebar {
      gap: $spacing-lg;
    }
  }
}
</style>
