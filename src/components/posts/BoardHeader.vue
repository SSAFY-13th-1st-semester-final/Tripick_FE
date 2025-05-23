<template>
  <div class="board-header">
    <!-- 게시판 종류 탭 -->
    <div class="board-tabs" v-if="boardStore.boards.length > 0">
      <button
        v-for="board in boardStore.boards"
        :key="board.id"
        :class="['board-tab', { active: selectedBoardType === board.name }]"
        @click="changeBoardType(board.name)"
      >
        {{ getBoardType(board.name) }}
      </button>
    </div>

    <!-- 로딩 중일 때 스켈레톤 -->
    <div v-else-if="boardStore.isLoading" class="board-tabs-skeleton">
      <div class="board-tab-skeleton" v-for="i in 4" :key="i"></div>
    </div>

    <!-- 검색 영역 -->
    <div class="search-area">
      <!-- 검색 컨테이너 (카테고리+입력창+돋보기만 묶어서 밑줄) -->
      <div class="search-container">
        <!-- 검색 카테고리 토글 -->
        <div class="search-category">
          <button
            class="search-category-toggle"
            @click="toggleSearchCategory"
            :class="{ active: showCategoryDropdown }"
          >
            {{ getCategoryLabel(searchCategory) }}
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
              class="chevron-icon"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>

          <!-- 카테고리 드롭다운 -->
          <div v-if="showCategoryDropdown" class="search-category-dropdown">
            <button
              v-for="option in searchOptions"
              :key="option.value"
              @click="selectSearchCategory(option.value)"
              :class="[
                'category-option',
                { active: searchCategory === option.value },
              ]"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- 검색 입력창 -->
        <div class="search-input-container">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="검색어를 입력하세요"
            class="search-input"
            @keyup.enter="handleSearch"
            @input="onSearchInput"
          />
          <button
            class="search-btn"
            @click="handleSearch"
            :disabled="!searchKeyword.trim()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- 검색 초기화 버튼 (검색 중일 때만 표시) -->
      <button
        v-if="isSearching"
        class="search-clear-btn"
        @click="clearSearch"
        title="검색 초기화"
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
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- 게시글 작성 버튼 -->
      <button
        class="create-post-btn"
        @click="navigateToCreate"
        title="게시글 작성"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from "vue";

// Props 정의
const props = defineProps({
  boardStore: {
    type: Object,
    required: true,
  },
  selectedBoardType: {
    type: String,
    required: true,
  },
  searchKeyword: {
    type: String,
    required: true,
  },
  searchCategory: {
    type: String,
    required: true,
  },
  isSearching: {
    type: Boolean,
    required: true,
  },
  showCategoryDropdown: {
    type: Boolean,
    required: true,
  },
});

// Emits 정의
const emit = defineEmits([
  "changeBoardType",
  "handleSearch",
  "clearSearch",
  "toggleSearchCategory",
  "selectSearchCategory",
  "navigateToCreate",
  "searchInput",
  "update:searchKeyword",
]);

// 게시판 타입 매핑
const boardTypeMap = {
  GENERAL_FORUM: "자유게시판",
  NOTICE: "공지사항",
  QNA_FORUM: "Q&A",
  TRIP_FORUM: "여행후기",
};

// 검색 카테고리 옵션
const searchOptions = [
  { value: "title_content", label: "제목+내용" },
  { value: "title", label: "제목" },
  { value: "content", label: "내용" },
  { value: "nickname", label: "작성자" },
];

// 게시판 이름으로 타입 가져오기
const getBoardType = (boardName) => {
  return boardTypeMap[boardName] || "자유게시판";
};

// 검색 카테고리 라벨 가져오기
const getCategoryLabel = (value) => {
  const option = searchOptions.find((opt) => opt.value === value);
  return option ? option.label : "제목+내용";
};

// 검색 키워드 v-model 처리
const searchKeyword = computed({
  get: () => props.searchKeyword,
  set: (value) => emit("update:searchKeyword", value),
});

// 이벤트 핸들러들
const changeBoardType = (boardType) => {
  emit("changeBoardType", boardType);
};

const handleSearch = () => {
  emit("handleSearch");
};

const clearSearch = () => {
  emit("clearSearch");
};

const toggleSearchCategory = () => {
  emit("toggleSearchCategory");
};

const selectSearchCategory = (value) => {
  emit("selectSearchCategory", value);
};

const navigateToCreate = () => {
  emit("navigateToCreate");
};

const onSearchInput = () => {
  emit("searchInput");
};

// 외부 클릭 시 드롭다운 닫기
const handleClickOutside = (event) => {
  const searchCategory = event.target.closest(".search-category");
  if (!searchCategory && props.showCategoryDropdown) {
    emit("toggleSearchCategory"); // 드롭다운 닫기
  }
};

// 컴포넌트 마운트/언마운트 시 이벤트 리스너 관리
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles/glassmorphism" as *;

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
  padding: $spacing-xs 0;

  @media (max-width: $breakpoint-md) {
    flex-direction: column;
    gap: $spacing-lg;
    align-items: stretch;
    padding: $spacing-lg 0;
  }
}

// 게시판 탭 스타일
.board-tabs {
  display: flex;
  gap: $spacing-xs;
  align-items: center;

  @media (max-width: $breakpoint-md) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: $spacing-md;
  }
}

.board-tab {
  position: relative;
  background: none;
  border: none;
  font-size: 0.9rem;
  font-weight: $font-weight-medium; // NavBar와 동일한 기본 폰트 굵기
  color: $primary-color;
  cursor: pointer;
  padding: $spacing-xs 0; // NavBar와 동일한 패딩
  display: inline-block;
  line-height: 1.5; // NavBar와 동일한 line-height
  margin: 0 $spacing-sm; // 좌우 간격
  transition: all $transition-fast;
  white-space: nowrap;

  // NavBar와 동일한 밑줄 애니메이션
  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0;
    height: 2px;
    background-color: $accent-color;
    transition: width $transition-fast;
  }

  &:hover {
    color: $primary-color;

    &::after {
      width: 100%; // 호버 시 밑줄 나타남
    }
  }

  &.active {
    font-weight: $font-weight-bold; // NavBar active와 동일
    color: $accent-color; // NavBar active와 동일

    &::after {
      width: 100%; // 활성 상태에서 밑줄 표시
    }
  }
}

// 게시판 탭 스켈레톤
.board-tabs-skeleton {
  display: flex;
  gap: $spacing-lg;
  align-items: center;
}

.board-tab-skeleton {
  width: 80px;
  height: 24px;
  background: rgba($primary-color, 0.1);
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

// 검색 영역 스타일
.search-area {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  @media (max-width: $breakpoint-md) {
    width: 100%;
    justify-content: flex-end;
    gap: $spacing-sm;
    flex-wrap: wrap;
    margin-top: $spacing-md;
  }
}

// 검색 컨테이너 (카테고리+입력창+돋보기만)
.search-container {
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 2px solid rgba($primary-color, 0.15);
  transition: border-color $transition-fast;

  &:focus-within {
    border-bottom-color: $accent-color;
  }
}

// 검색 카테고리 토글
.search-category {
  position: relative;
}

.search-category-toggle {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  font-size: 0.9rem;
  font-weight: $font-weight-medium;
  color: $primary-color;
  cursor: pointer;
  transition: all $transition-fast;
  min-width: 120px;
  justify-content: space-between;

  &:hover {
    color: $accent-color;
  }

  &.active {
    color: $accent-color;

    .chevron-icon {
      transform: rotate(180deg);
    }
  }

  .chevron-icon {
    transition: transform $transition-fast;
    flex-shrink: 0;
  }
}

.search-category-dropdown {
  @include glassmorphism(0.9, 12px);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  border-radius: 8px;
  z-index: $z-index-dropdown;
  overflow: hidden;
  animation: dropdown-appear 0.2s ease-out;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

@keyframes dropdown-appear {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.category-option {
  width: 100%;
  background: none;
  border: none;
  padding: $spacing-sm $spacing-md;
  text-align: left;
  font-size: 0.9rem;
  color: $primary-color;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: rgba($accent-color, 0.1);
  }

  &.active {
    background: rgba($accent-color, 0.15);
    color: $accent-color;
    font-weight: $font-weight-medium;
  }
}

// 검색 입력창
.search-input-container {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  transition: all $transition-fast;
}

.search-input {
  background: none;
  border: none;
  padding: $spacing-sm $spacing-lg;
  font-size: 0.95rem;
  color: $primary-color;
  width: 220px;
  outline: none;

  &::placeholder {
    color: rgba($primary-color, 0.5);
  }

  @media (max-width: $breakpoint-md) {
    width: 160px;
  }
}

.search-btn {
  background: none;
  border: none;
  padding: $spacing-sm;
  color: rgba($primary-color, 0.6);
  cursor: pointer;
  transition: all $transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    color: $accent-color;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

// 검색 초기화 버튼
.search-clear-btn {
  background: none;
  border: none;
  padding: $spacing-sm;
  color: $error-color;
  cursor: pointer;
  transition: all $transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: color.adjust($error-color, $lightness: -10%);
    transform: scale(1.1);
  }
}

// 게시글 작성 버튼
.create-post-btn {
  background: none;
  border: none;
  padding: $spacing-sm;
  color: $accent-color;
  cursor: pointer;
  transition: all $transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: color.adjust($accent-color, $lightness: -10%);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
  }
}

// 반응형 미디어 쿼리
@media (max-width: $breakpoint-md) {
  .search-container {
    flex: 1;
    min-width: 240px;
  }

  .search-category-toggle {
    font-size: 0.8rem;
    padding: $spacing-xs $spacing-md;
    min-width: 100px;
  }

  .search-input {
    width: 140px;
  }
}
</style>
