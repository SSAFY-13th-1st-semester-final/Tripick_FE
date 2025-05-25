<template>
  <div class="post-detail">
    <div v-if="isLoading" class="post-detail__loading">
      <div class="loading-spinner"></div>
      <p>게시글을 불러오는 중...</p>
    </div>

    <div v-else-if="error" class="post-detail__error">
      <p>{{ error }}</p>
      <AppButton @click="navigateToList" variant="outline"
        >게시판으로 돌아가기</AppButton
      >
    </div>

    <template v-else>
      <div class="post-detail__layout">
        <!-- 메인 게시글 영역 -->
        <div class="post-detail__main">
          <div class="post-detail__card glass-card">
            <div class="post-detail__header">
              <div class="post-detail__actions">
                <AppButton
                  @click="navigateToList"
                  variant="ghost"
                  size="sm"
                  class="back-btn"
                >
                  <i class="fas fa-arrow-left"></i>
                  목록으로
                </AppButton>

                <div v-if="isAuthorOrAdmin" class="post-detail__author-actions">
                  <AppButton @click="editPost" variant="outline" size="sm">
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
                      class="post-detail__icon"
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
                    @click="confirmDelete"
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
                      class="post-detail__icon"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      ></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    삭제
                  </AppButton>
                </div>
              </div>

              <h1 class="post-detail__title">{{ post.title }}</h1>

              <div class="post-detail__meta">
                <div class="post-detail__author">
                  <div class="post-detail__author-image">
                    <img
                      :src="post.profileImageUrl || '/default-profile.jpg'"
                      :alt="post.nickname"
                      @error="handleProfileError"
                    />
                  </div>
                  <div class="post-detail__author-info">
                    <span class="post-detail__author-name">{{
                      post.nickname
                    }}</span>
                    <span class="post-detail__date">{{
                      formatDate(post.createdAt)
                    }}</span>
                  </div>
                </div>

                <div class="post-detail__stats">
                  <span class="post-detail__stat">
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
                      class="post-detail__icon"
                    >
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      ></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    {{ formatCount(post.viewCount) }}
                  </span>
                  <span class="post-detail__stat">
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
                      class="post-detail__icon"
                    >
                      <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      ></path>
                    </svg>
                    {{ formatCount(post.likeCount) }}
                  </span>
                  <span class="post-detail__stat">
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
                      class="post-detail__icon"
                    >
                      <path
                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      ></path>
                    </svg>
                    {{ formatCount(post.commentCount) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="post.thumbNail" class="post-detail__thumbnail">
              <img
                :src="post.thumbNail"
                :alt="post.title"
                @error="handleImageError"
              />
            </div>

            <div class="post-detail__content">
              <div v-if="post.description" class="post-detail__description">
                {{ post.description }}
              </div>

              <div class="post-detail__body" v-html="post.content"></div>
            </div>
          </div>

          <!-- 댓글 섹션 추가 예정 -->
        </div>

        <!-- AI 요약 사이드바 영역 -->
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
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import PostService from "@/services/post.service";
import AppButton from "@/components/common/shared/AppButton.vue";
import AiPostSummaryCard from "@/components/posts/AiPostSummaryCard.vue";

// 라우터 및 스토어
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 상태 정의
const post = ref({});
const isLoading = ref(true);
const error = ref(null);

// AI 요약 관련 참조
const summaryCardRef = ref(null);

// 현재 사용자가 작성자인지 또는 관리자인지 확인
const isAuthorOrAdmin = computed(() => {
  if (!post.value) return false;
  if (!authStore.isAuthenticated) return false;

  // 관리자인 경우 항상 수정/삭제 가능
  if (authStore.isAdmin) return true;

  // 작성자인 경우 수정/삭제 가능
  return (
    authStore.currentUser && post.value.memberId === authStore.currentUser.id
  );
});

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
    // 로그인 상태 확인 및 토큰 갱신 (필요한 경우)
    if (authStore.isAuthenticated) {
      await authStore.refreshUserData();
    }

    const response = await PostService.getPostById(postId);

    // 응답 구조 확인 및 수정
    if (response && response.data) {
      // API 응답이 중첩된 data 객체 없이 바로 게시글 데이터인 경우
      post.value = response.data;
    } else if (response && response.data && response.data.data) {
      // API 응답이 data.data 구조인 경우
      post.value = response.data.data;
    } else {
      error.value = "게시글을 불러올 수 없습니다.";
    }
  } catch (err) {
    // 콘솔 로그 대신 디버깅 정보를 저장
    notificationStore.showError("게시글 로드 오류가 발생했습니다.", {
      duration: 5000,
    });

    // 인증 관련 오류 처리
    if (err.response && err.response.status === 401) {
      error.value = "로그인이 필요하거나 세션이 만료되었습니다.";
      // 인증 만료된 경우 재로그인 필요
      if (authStore.isAuthenticated) {
        authStore.logout();
      }
    } else if (err.response && err.response.status === 403) {
      error.value = "접근 권한이 없습니다.";
    } else {
      error.value = "게시글을 불러오는 중 오류가 발생했습니다.";
    }
  } finally {
    isLoading.value = false;
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
    const response = await PostService.getPostSummary(postId);

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
  if (!isAuthorOrAdmin.value) {
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
    if (!isAuthorOrAdmin.value) {
      notificationStore.showError("게시글 삭제 권한이 없습니다.");
      return;
    }

    // 토큰 리프레시
    await authStore.refreshUserData();

    await PostService.deletePost(post.value.postId);
    notificationStore.showSuccess("게시글이 삭제되었습니다.");
    navigateToList();
  } catch (err) {
    // 에러 로그 대신 알림으로 처리

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

// 수 포맷팅 (예: 1000 -> 1k)
const formatCount = (count) => {
  if (!count && count !== 0) return "0";

  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }

  return count.toString();
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  // UTC 기준 날짜 → 한국 시간으로 변환
  const date = new Date(dateString);
  const utcToKst = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  return utcToKst.toLocaleDateString("ko-KR", {
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
  notificationStore.showInfo("썸네일 이미지를 불러올 수 없습니다.");
};

// 프로필 이미지 오류 처리
const handleProfileError = (event) => {
  event.target.src = "/default-profile.jpg";
};

// 컴포넌트 마운트 시 게시글 로드
onMounted(loadPost);
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

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
    grid-template-columns: 1fr 340px;
    gap: $spacing-xl;
    align-items: start;

    @media (max-width: $breakpoint-lg) {
      grid-template-columns: 1fr;
      gap: $spacing-lg;
    }
  }

  &__main {
    min-width: 0; // 그리드 오버플로우 방지
  }

  &__sidebar {
    position: sticky;
    top: $spacing-xl;

    @media (max-width: $breakpoint-lg) {
      position: static;
      order: -1; // 모바일에서는 상단에 배치
    }
  }

  &__card {
    padding: $spacing-xl;
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

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

  &__stats {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    @media (max-width: $breakpoint-sm) {
      gap: $spacing-sm;
    }
  }

  &__stat {
    display: flex;
    align-items: center;
    color: rgba($primary-color, 0.7);
    font-size: 0.9rem;
    transition: $transition-fast;
    padding: $spacing-xs $spacing-sm;
    border-radius: 16px;
    background-color: rgba($white, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba($white, 0.18);
    box-shadow: 0 2px 8px rgba(31, 38, 135, 0.1);

    .post-detail__icon {
      margin-right: $spacing-xs;
      width: 16px;
      height: 16px;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(31, 38, 135, 0.15);
    }

    @media (max-width: $breakpoint-sm) {
      padding: $spacing-xs;
      font-size: 0.8rem;

      .post-detail__icon {
        margin-right: 2px;
        width: 14px;
        height: 14px;
      }
    }
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

  &__content {
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

  &__body {
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

  .post-detail__icon {
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

    &__card {
      padding: $spacing-lg;
    }

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

    &__stats {
      justify-content: center;
    }
  }
}
</style>
