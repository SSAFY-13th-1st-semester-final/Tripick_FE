<template>
  <div class="posts-list">
    <div class="posts-list__container">
      <!-- 게시판 종류 탭 -->
      <div class="posts-list__header">
        <div class="board-tabs" v-if="boardStore.boards.length > 0">
          <button
            v-for="board in boardStore.boards"
            :key="board.id"
            :class="[
              'board-tab',
              'glass-btn',
              { active: selectedBoardType === board.name },
            ]"
            @click="changeBoardType(board.name)"
          >
            {{ getBoardType(board.name) }}
          </button>
        </div>

        <!-- 로딩 중일 때 스켈레톤 -->
        <div v-else-if="boardStore.isLoading" class="board-tabs-skeleton">
          <div class="board-tab-skeleton" v-for="i in 4" :key="i"></div>
        </div>

        <div class="posts-list__actions">
          <AppButton
            variant="primary"
            size="sm"
            @click="navigateToCreate"
            class="create-post-btn"
          >
            <i class="icon-plus"></i>
            게시글 작성
          </AppButton>
        </div>
      </div>

      <!-- 로딩 상태 (초기 로드) -->
      <div v-if="isLoading && posts.length === 0" class="posts-list__loading">
        <div class="loading-spinner"></div>
        <p>게시글을 불러오는 중...</p>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="posts.length === 0" class="posts-list__empty">
        <p>게시글이 없습니다.</p>
        <AppButton variant="outline" size="sm" @click="navigateToCreate">
          첫 게시글 작성하기
        </AppButton>
      </div>

      <!-- 게시글 그리드 -->
      <div v-else ref="postsContainer" class="posts-list__grid">
        <PostCard
          v-for="post in posts"
          :key="post.postId"
          :post="post"
          class="posts-list__card"
        />
      </div>

      <!-- 추가 로딩 (무한스크롤) -->
      <div v-if="isLoading && posts.length > 0" class="posts-list__loader">
        <div class="loading-spinner"></div>
        <p>더 불러오는 중...</p>
      </div>

      <!-- 마지막 페이지 -->
      <div
        v-if="!isLoading && !hasMore && posts.length > 0"
        class="posts-list__end"
      >
        <p>모든 게시글을 불러왔습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { useBoardStore } from "@/stores/board";
import PostService from "@/services/post.service";
import PostCard from "@/components/posts/PostCard.vue";
import AppButton from "@/components/common/shared/AppButton.vue";

// 라우터 및 스토어
const router = useRouter();
const notificationStore = useNotificationStore();
const boardStore = useBoardStore();

// 게시판 타입 매핑
const boardTypeMap = {
  GENERAL_FORUM: "자유게시판",
  NOTICE: "공지사항",
  QNA_FORUM: "Q&A",
  TRIP_FORUM: "여행후기",
};

// 상태 정의
const posts = ref([]);
const page = ref(0);
const maxPage = ref(1);
const size = ref(10);
const isLoading = ref(false);
const hasMore = ref(true);
const postsContainer = ref(null);
const observer = ref(null);
const selectedBoardType = ref("GENERAL_FORUM"); // 기본값: 자유게시판

// 게시판 이름으로 타입 가져오기
const getBoardType = (boardName) => {
  return boardTypeMap[boardName] || "GENERAL_FORUM";
};

// 게시글 생성 페이지로 이동
const navigateToCreate = () => {
  router.push({ name: "post-create" });
};

// 게시글 목록 초기화
const resetPosts = () => {
  posts.value = [];
  page.value = 0;
  maxPage.value = 1;
  hasMore.value = true;

  // 기존 옵저버 해제
  if (observer.value) {
    observer.value.disconnect();
    observer.value = null;
  }
};

// 게시글 목록 로드
const loadPosts = async () => {
  if (isLoading.value || !hasMore.value) return;

  isLoading.value = true;

  try {
    const response = await PostService.getPosts(
      page.value,
      size.value,
      selectedBoardType.value
    );
    console.log(response);
    console.log(response.data.data.content);

    // API 응답 구조: { posts: [...], maxPage: number }
    if (
      response.data &&
      response.data.data.content &&
      response.data.data.content.length > 0
    ) {
      // 게시글 배열에 추가
      posts.value = [...posts.value, ...response.data.data.content];

      // 최대 페이지 정보 업데이트
      maxPage.value = response.data.data.totalPages || 1;

      // 다음 페이지 로드할 수 있는지 확인
      hasMore.value = page.value < maxPage.value;

      // 다음 페이지로 증가
      if (hasMore.value) {
        page.value++;
      }
    }
  } catch (error) {
    console.error(error);
    notificationStore.showError(
      "게시글 목록을 불러오는 중 오류가 발생했습니다."
    );
  } finally {
    isLoading.value = false;
  }
};

// 게시판 타입 변경
const changeBoardType = async (boardType) => {
  if (selectedBoardType.value === boardType) return;
  selectedBoardType.value = boardType;
  resetPosts();

  // 새로운 게시글 로드
  await loadPosts();

  // 옵저버 재초기화
  if (postsContainer.value) {
    setTimeout(() => {
      initIntersectionObserver();
    }, 300);
  }
};

// 교차 관찰자 초기화 (무한 스크롤)
const initIntersectionObserver = () => {
  if (observer.value) return; // 이미 초기화된 경우 중복 방지

  try {
    observer.value = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && !isLoading.value && hasMore.value) {
          loadPosts();
        }
      },
      {
        rootMargin: "0px 0px 200px 0px", // 하단에서 200px 전에 로딩 시작
        threshold: 0.1,
      }
    );

    // 관찰 요소에 옵저버 연결
    const observerTarget = document.createElement("div");
    observerTarget.classList.add("observer-target");
    postsContainer.value.appendChild(observerTarget);
    observer.value.observe(observerTarget);
  } catch (error) {
    notificationStore.showWarning(
      "무한 스크롤 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.",
      {
        duration: 5000,
        closable: true,
      }
    );
  }
};

// 컴포넌트 마운트 시 게시판 목록 및 게시글 로드
onMounted(async () => {
  try {
    // 게시판 목록 조회
    await boardStore.fetchBoards();

    // 게시글 로드
    await loadPosts();

    // 게시글 로드 후 옵저버 초기화
    if (postsContainer.value) {
      setTimeout(() => {
        initIntersectionObserver();
      }, 500);
    }
  } catch (error) {
    notificationStore.showError("초기 데이터 로드에 실패했습니다.", {
      duration: 5000,
      closable: true,
    });
  }
});

// 컴포넌트 언마운트 시 옵저버 해제
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.posts-list {
  padding: $spacing-lg;

  &__container {
    max-width: 1480px;
    margin: 0 auto;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xl;
    gap: $spacing-lg;

    @media (max-width: $breakpoint-md) {
      flex-direction: column;
      align-items: stretch;
      gap: $spacing-md;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: $spacing-lg;

    @media (min-width: $breakpoint-sm) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: $breakpoint-md) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (min-width: $breakpoint-lg) {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (min-width: $breakpoint-xl) {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  &__card {
    height: 100%;
  }

  &__loading,
  &__empty,
  &__loader,
  &__end {
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

  &__loader {
    padding: $spacing-lg 0;
  }

  &__end {
    padding: $spacing-lg 0;
    font-size: 0.9rem;
    color: rgba($primary-color, 0.5);
  }

  &__actions {
    flex-shrink: 0;
  }
}

// 게시판 탭 스타일
.board-tabs {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;

  @media (max-width: $breakpoint-md) {
    justify-content: center;
  }
}

.board-tab {
  padding: $spacing-sm $spacing-lg;
  border: none;
  cursor: pointer;
  transition: all $transition-fast;
  font-weight: $font-weight-medium;
  white-space: nowrap;

  &:not(.active) {
    background: rgba(255, 255, 255, 0.4);
    color: rgba($primary-color, 0.7);

    &:hover {
      background: rgba(255, 255, 255, 0.6);
      color: $primary-color;
    }
  }

  &.active {
    background: rgba($accent-color, 0.85);
    color: white;

    &:hover {
      background: rgba($accent-color, 0.95);
    }
  }
}

// 게시판 탭 스켈레톤
.board-tabs-skeleton {
  display: flex;
  gap: $spacing-sm;
}

.board-tab-skeleton {
  width: 80px;
  height: 36px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
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

.observer-target {
  width: 100%;
  height: 10px;
  visibility: hidden;
}

.create-post-btn {
  display: flex;
  align-items: center;

  i {
    margin-right: $spacing-xs;
  }
}
</style>
