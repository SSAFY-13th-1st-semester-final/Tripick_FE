<template>
  <div class="posts-list">
    <div class="posts-list__container">
      <!-- 게시판 헤더 컴포넌트 -->
      <BoardHeader
        :board-store="boardStore"
        :selected-board-type="selectedBoardType"
        v-model:search-keyword="searchKeyword"
        :search-category="searchCategory"
        :is-searching="isSearching"
        :show-category-dropdown="showCategoryDropdown"
        @change-board-type="changeBoardType"
        @handle-search="handleSearch"
        @clear-search="clearSearch"
        @toggle-search-category="toggleSearchCategory"
        @select-search-category="selectSearchCategory"
        @navigate-to-create="navigateToCreate"
        @search-input="onSearchInput"
      />

      <!-- 검색 결과 표시 -->
      <div v-if="isSearching" class="search-result-info">
        <span class="search-keyword">"{{ currentSearchKeyword }}"</span> 검색
        결과
        <span class="search-count">({{ posts.length }}개)</span>
      </div>

      <!-- 로딩 상태 (초기 로드) -->
      <div v-if="isLoading && posts.length === 0" class="posts-list__loading">
        <div class="loading-spinner"></div>
        <p>게시글을 불러오는 중...</p>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="posts.length === 0" class="posts-list__empty">
        <div class="empty-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            ></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
        </div>
        <p>
          {{ isSearching ? "검색 결과가 없습니다." : "게시글이 없습니다." }}
        </p>
        <button
          v-if="!isSearching"
          class="glass-btn primary"
          @click="navigateToCreate"
        >
          첫 게시글 작성하기
        </button>
      </div>

      <!-- 게시글 그리드 -->
      <div v-else ref="postsContainer" class="posts-list__grid">
        <PostCard
          v-for="post in posts"
          :key="post.postId"
          :post="post"
          class="posts-list__card"
        />

        <!-- 추가 로딩 (무한스크롤) -->
        <div v-if="isLoading && posts.length > 0" class="posts-list__loader">
          <div class="loading-spinner"></div>
          <p>더 불러오는 중...</p>
        </div>

        <!-- 마지막 페이지 (게시글 그리드 내부 하단) -->
        <div
          v-if="!isLoading && !hasMore && posts.length > 0"
          class="posts-list__end"
        >
          <p>모든 게시글을 불러왔습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { useBoardStore } from "@/stores/board";
import PostService from "@/services/post.service";
import PostCard from "@/components/posts/PostCard.vue";
import BoardHeader from "@/components/posts/BoardHeader.vue";

// 라우터 및 스토어
const router = useRouter();
const notificationStore = useNotificationStore();
const boardStore = useBoardStore();

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

// 검색 관련 상태
const searchKeyword = ref("");
const currentSearchKeyword = ref("");
const searchCategory = ref("title_content");
const isSearching = ref(false);
const searchDebounceTimer = ref(null);
const showCategoryDropdown = ref(false);

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
const loadPosts = async (isNewSearch = false) => {
  if (isLoading.value || (!hasMore.value && !isNewSearch)) return;

  isLoading.value = true;

  try {
    let response;

    if (isSearching.value && currentSearchKeyword.value.trim()) {
      // 검색 모드
      response = await PostService.searchPosts(currentSearchKeyword.value, {
        page: page.value,
        size: size.value,
        boardType: selectedBoardType.value,
        searchType: searchCategory.value,
      });
    } else {
      // 일반 목록 조회
      response = await PostService.getPosts({
        page: page.value,
        size: size.value,
        boardType: selectedBoardType.value,
      });
    }

    // API 응답 구조: { posts: [...], maxPage: number }
    if (
      response.data &&
      response.data.data.content &&
      response.data.data.content.numberOfElements !== 0
    ) {
      // 새로운 검색이거나 게시판 변경인 경우 기존 데이터 초기화
      if (isNewSearch) {
        posts.value = [...response.data.data.content];
      } else {
        posts.value = [...posts.value, ...response.data.data.content];
      }

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

// 검색 실행
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return;

  currentSearchKeyword.value = searchKeyword.value.trim();
  isSearching.value = true;
  resetPosts();

  await loadPosts(true);

  // 옵저버 재초기화
  if (postsContainer.value) {
    setTimeout(() => {
      initIntersectionObserver();
    }, 300);
  }
};

// 검색 초기화
const clearSearch = async () => {
  searchKeyword.value = "";
  currentSearchKeyword.value = "";
  isSearching.value = false;
  resetPosts();

  await loadPosts(true);

  // 옵저버 재초기화
  if (postsContainer.value) {
    setTimeout(() => {
      initIntersectionObserver();
    }, 300);
  }
};

// 검색 입력 시 디바운스 처리
const onSearchInput = () => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }

  // 입력이 비어있으면 검색 초기화
  if (!searchKeyword.value.trim() && isSearching.value) {
    searchDebounceTimer.value = setTimeout(() => {
      clearSearch();
    }, 500);
  }
};

// 검색 카테고리 토글
const toggleSearchCategory = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value;
};

// 검색 카테고리 선택
const selectSearchCategory = (value) => {
  searchCategory.value = value;
  showCategoryDropdown.value = false;

  if (isSearching.value && currentSearchKeyword.value.trim()) {
    handleSearch();
  }
};

// 게시판 타입 변경
const changeBoardType = async (boardType) => {
  if (selectedBoardType.value === boardType) return;
  selectedBoardType.value = boardType;
  resetPosts();

  // 새로운 게시글 로드
  await loadPosts(true);

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
    await loadPosts(true);

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

  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.posts-list {
  padding: $spacing-lg;
  min-height: 100vh;

  &__container {
    max-width: 1480px;
    margin: 0 auto;
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
  &__empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: $spacing-2xl;
    text-align: center;
    @include glassmorphism(0.7, 12px);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    p {
      margin: $spacing-md 0;
      color: rgba($primary-color, 0.7);
    }

    .empty-icon {
      margin-bottom: $spacing-lg;
      opacity: 0.5;

      svg {
        color: $primary-color;
      }
    }
  }

  &__loader {
    grid-column: 1 / -1; // 전체 열에 걸쳐 표시
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $spacing-xl 0;
    text-align: center;

    p {
      margin: $spacing-md 0;
      color: rgba($primary-color, 0.7);
    }
  }

  &__end {
    grid-column: 1 / -1; // 전체 열에 걸쳐 표시
    padding: $spacing-xl 0;
    text-align: center;
    color: rgba($primary-color, 0.5);
    font-size: 0.9rem;
    border-top: 1px solid rgba($primary-color, 0.1);
    margin-top: $spacing-lg;

    p {
      margin: 0;
      position: relative;

      &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        background: radial-gradient(
          circle,
          rgba($accent-color, 0.1) 0%,
          transparent 70%
        );
        border-radius: 50%;
        z-index: -1;
      }
    }
  }
}

// 검색 결과 정보
.search-result-info {
  @include glassmorphism(0.7, 12px);
  margin-bottom: $spacing-lg;
  padding: $spacing-md $spacing-lg;
  border-left: 4px solid $accent-color;
  border-radius: 0 12px 12px 0;
  font-size: 0.9rem;
  color: rgba($primary-color, 0.8);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .search-keyword {
    font-weight: $font-weight-bold;
    color: $accent-color;
  }

  .search-count {
    color: rgba($primary-color, 0.6);
    margin-left: $spacing-xs;
  }
}

// 로딩 스피너
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

// 반응형 미디어 쿼리
@media (max-width: $breakpoint-md) {
  .posts-list {
    padding: $spacing-md;
  }
}
</style>
