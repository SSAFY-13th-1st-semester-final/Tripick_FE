<template>
  <div class="place-search-container">
    <div class="search-header glass-card">
      <!-- 현재 선택된 일차 표시 -->
      <div v-if="hasTripPlan" class="current-day-indicator">
        <span>{{ currentDay + 1 }}일차 일정 작성 중</span>
        <button
          class="day-change-btn"
          @click="showDaySelector = !showDaySelector"
        >
          변경
        </button>

        <!-- 일차 선택 드롭다운 -->
        <div v-if="showDaySelector" class="day-selector glass-card">
          <div class="day-selector-header">일차 선택</div>
          <div class="day-list">
            <button
              v-for="day in tripDuration"
              :key="day - 1"
              class="day-item"
              :class="{ active: currentDay === day - 1 }"
              @click="selectDay(day - 1)"
            >
              {{ day }}일차 ({{ formatDate(getDayDate(day - 1)) }})
            </button>
          </div>
        </div>
      </div>

      <!-- 카테고리 선택 -->
      <div class="category-selector">
        <button
          v-for="category in categories"
          :key="category.name"
          class="category-btn"
          :class="{ active: selectedCategory === category.name }"
          @click="selectCategory(category.name)"
        >
          {{ category.description }}
        </button>
      </div>

      <!-- 검색 입력창 -->
      <div class="search-input-wrapper">
        <input
          type="text"
          class="search-input glass-input"
          v-model="searchQuery"
          placeholder="검색어를 입력하세요"
          @keyup.enter="searchPlaces(true)"
        />
        <button
          class="search-btn glass-btn primary"
          @click="searchPlaces(true)"
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
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- 검색 결과 -->
    <div class="search-results">
      <div v-if="isLoading && !places.length" class="loading-state">
        <div class="loading-spinner"></div>
        <p>장소를 검색하고 있습니다...</p>
      </div>

      <template v-else>
        <div
          v-if="places.length === 0 && hasSearched"
          class="no-results glass-card"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <p>검색 결과가 없습니다.</p>
          <p class="sub-message">다른 검색어나 카테고리로 다시 시도해보세요.</p>
        </div>

        <div v-else class="place-list">
          <div
            v-for="place in places"
            :key="place.id"
            class="place-item glass-card"
            :class="{ 'place-added': isPlaceAdded(place.id) }"
            @click="selectPlace(place)"
          >
            <div class="place-content">
              <h3 class="place-name">{{ place.placeName }}</h3>
              <div class="place-category">{{ place.categoryName }}</div>
              <div class="place-address">
                {{ place.roadAddressName || place.addressName }}
              </div>
              <div v-if="place.phone" class="place-phone">
                {{ place.phone }}
              </div>
            </div>
            <div class="place-actions">
              <!-- 이미 추가된 장소인 경우 배지 표시 -->
              <span v-if="isPlaceAdded(place.id)" class="place-added-badge">
                추가됨
              </span>

              <!-- 아직 추가되지 않은 장소인 경우 추가 버튼 -->
              <button
                v-else-if="hasTripPlan"
                class="add-place-btn"
                @click.stop="selectPlace(place)"
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </button>

              <a
                :href="place.placeUrl"
                target="_blank"
                class="place-link"
                @click.stop="showPlaceDetail(place)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                  ></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                상세보기
              </a>
            </div>
          </div>

          <div v-if="isLoading" class="loading-more">
            <div class="loading-spinner"></div>
            <p>더 불러오는 중...</p>
          </div>

          <div v-if="noMoreResults && places.length > 0" class="end-message">
            모든 검색 결과를 불러왔습니다.
          </div>

          <!-- 무한 스크롤을 위한 옵저버 타겟 요소 -->
          <div ref="observerTarget" class="observer-target"></div>
        </div>
      </template>
    </div>

    <!-- 여행 계획이 없는 경우 알림 -->
    <div
      v-if="!hasTripPlan && places.length > 0"
      class="no-trip-warning glass-card"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>여행 날짜를 먼저 설정해야 장소를 추가할 수 있습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import travelService from "@/services/travel.service";
import { useNotificationStore } from "@/stores/notification";
import { useTravelStore } from "@/stores/travel";
import { storeToRefs } from "pinia";
import infoWindowRenderer from "@/utils/InfoWindowRenderer";

// 상태 변수
const categories = ref([]);
const selectedCategory = ref("");
const searchQuery = ref("");
const places = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const isLoading = ref(false);
const hasSearched = ref(false);
const showDaySelector = ref(false);
const meta = ref({
  isEnd: false,
  totalCount: 0,
  pageableCount: 0,
});

// IntersectionObserver 참조
const observerTarget = ref(null);
const observer = ref(null);

// 알림 스토어
const notificationStore = useNotificationStore();

// 여행 스토어
const travelStore = useTravelStore();
const {
  currentDay,
  tripInfo,
  currentDayPlaces,
  currentDayHotel,
  searchMode,
  tripDuration,
  getDayDate,
  formatDate,
} = storeToRefs(travelStore);

const showDetailModal = ref(false);
const selectedDetailPlace = ref(null);
const detailModalContent = ref("");

// 계산된 속성
const noMoreResults = computed(() => {
  return meta.value.isEnd || places.value.length >= meta.value.pageableCount;
});

// 현재 일차에 이미 추가된 장소 ID 목록
const addedPlaceIds = computed(() => {
  if (!currentDayPlaces.value) return [];
  return currentDayPlaces.value.map((place) => place.id);
});

// 현재 일차의 숙소 ID
const currentHotelId = computed(() => {
  return currentDayHotel.value ? currentDayHotel.value.id : null;
});

// 여행 계획 여부 확인
const hasTripPlan = computed(() => {
  return tripInfo.value.startDate && tripInfo.value.endDate;
});

// IntersectionObserver 설정
const setupIntersectionObserver = () => {
  // 이전 옵저버가 있으면 해제
  if (observer.value) {
    observer.value.disconnect();
  }

  // 새 IntersectionObserver 생성
  observer.value = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;

      // 타겟 요소가 화면에 보이고, 로딩 중이 아니고, 더 불러올 결과가 있으면 추가 로드
      if (
        entry.isIntersecting &&
        !isLoading.value &&
        !noMoreResults.value &&
        hasSearched.value
      ) {
        loadMorePlaces();
      }
    },
    {
      root: null, // 뷰포트 기준
      rootMargin: "0px 0px 200px 0px", // 하단에서 200px 떨어진 지점에서 발동
      threshold: 0.1, // 10% 이상 보이면 콜백 실행
    }
  );

  // 타겟 요소가 있으면 관찰 시작
  if (observerTarget.value) {
    observer.value.observe(observerTarget.value);
  }
};

// 카테고리 로딩
const loadCategories = async () => {
  try {
    isLoading.value = true;
    const response = await travelService.getPlaceCategories();

    if (response.status === 200 && response.data) {
      categories.value = response.data;
    } else {
      notificationStore.showError("카테고리를 불러오는데 실패했습니다.");
    }
  } catch (error) {
    notificationStore.showError("카테고리를 불러오는데 실패했습니다.");
  } finally {
    isLoading.value = false;
  }
};

// 장소 상세 정보 표시
const showPlaceDetail = (place) => {
  selectedDetailPlace.value = place;

  // InfoWindowRenderer를 사용하여 상세 정보 HTML 생성
  const placeWithDay = {
    ...place,
    day: currentDay.value + 1,
    type: searchMode.value === "hotel" ? "hotel_start" : "place",
  };

  detailModalContent.value = infoWindowRenderer.createInfoWindowContent(
    placeWithDay,
    1, // markerNumber
    null // legData
  );

  showDetailModal.value = true;

  // 모달 표시 후 스타일 적용
  setTimeout(() => {
    infoWindowRenderer.addInfoWindowStyles();
  }, 50);
};

// 상세 정보 모달 닫기
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedDetailPlace.value = null;
  detailModalContent.value = "";
};

// 카테고리 선택
const selectCategory = (categoryCode) => {
  if (selectedCategory.value === categoryCode) {
    // 같은 카테고리 다시 클릭하면 선택 해제
    selectedCategory.value = "";
  } else {
    selectedCategory.value = categoryCode;
  }
};

// 일차 선택
const selectDay = (day) => {
  travelStore.setCurrentDay(day);
  showDaySelector.value = false;
};

// 장소 검색
const searchPlaces = async (isNewSearch = false) => {
  if (!searchQuery.value.trim()) {
    notificationStore.showWarning("검색어를 입력해주세요.");
    return;
  }

  try {
    if (isNewSearch) {
      // 새 검색이면 결과 초기화
      places.value = [];
      currentPage.value = 1;
      meta.value = {
        isEnd: false,
        totalCount: 0,
        pageableCount: 0,
      };
    }
    //AD5
    isLoading.value = true;
    hasSearched.value = true;

    const response = await travelService.searchPlaces({
      query: searchQuery.value,
      categoryGroupCode: selectedCategory.value ? selectedCategory.value : null,
      page: currentPage.value,
      size: pageSize.value,
    });

    if (response.status === 200 && response.data) {
      if (isNewSearch) {
        places.value = response.data.places;
      } else {
        places.value = [...places.value, ...response.data.places];
      }

      meta.value = response.data.meta;

      // 다음 페이지 준비
      currentPage.value++;

      // 새 검색 후 IntersectionObserver 재설정
      if (isNewSearch) {
        setupIntersectionObserver();
      }
    } else {
      notificationStore.showError("검색 결과를 불러오는데 실패했습니다.");
    }
  } catch (error) {
    notificationStore.showError("장소 검색에 실패했습니다.");
  } finally {
    isLoading.value = false;
  }
};

// 무한 스크롤 - 더 불러오기
const loadMorePlaces = () => {
  if (isLoading.value || noMoreResults.value || !hasSearched.value) return;

  searchPlaces(false);
};

// 장소 선택
const selectPlace = (place) => {
  // 여행 계획이 없는 경우 경고
  if (!hasTripPlan.value) {
    notificationStore.showWarning("먼저 여행 날짜를 설정해주세요.");
    return;
  }

  // 이미 추가된 장소인지 확인
  if (isPlaceAdded(place.id)) {
    const typeText = searchMode.value === "hotel" ? "숙소" : "장소";
    notificationStore.showWarning(`이미 추가된 ${typeText}입니다.`);
    return;
  }

  // 검색 모드에 따라 다른 처리
  if (searchMode.value === "hotel") {
    // 숙소 추가
    const success = travelStore.addCurrentDayHotel(place);

    if (success) {
      notificationStore.showSuccess(
        `${currentDay.value + 1}일차에 숙소가 등록되었습니다.`
      );
      // 숙소 등록 후 장소 검색 모드로 자동 전환
      travelStore.setPlaceSearchMode();
    } else {
      notificationStore.showError("숙소 등록에 실패했습니다.");
    }
  } else {
    // 일반 장소 추가
    travelStore.selectPlace(place);
    const success = travelStore.addPlace();

    if (success) {
      notificationStore.showSuccess(
        `${currentDay.value + 1}일차에 장소가 추가되었습니다.`
      );
    } else {
      notificationStore.showError("장소 추가에 실패했습니다.");
    }
  }
};

// 장소가 이미 추가되었는지 확인
const isPlaceAdded = (placeId) => {
  if (searchMode.value === "hotel") {
    // 숙소 모드일 때는 현재 일차의 숙소 ID와 비교
    return currentHotelId.value === placeId;
  } else {
    // 장소 모드일 때는 현재 일차의 장소 목록에서 확인
    return addedPlaceIds.value.includes(placeId);
  }
};

// 컴포넌트 마운트 시 카테고리 로딩 및 IntersectionObserver 설정
onMounted(() => {
  loadCategories();

  // 검색어 입력 필드에 자동 포커스
  document.querySelector(".search-input")?.focus();

  // URL 파라미터에서 검색어 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get("query");

  if (queryParam) {
    searchQuery.value = queryParam;
    searchPlaces(true);
  }

  // IntersectionObserver 설정
  setupIntersectionObserver();
});

// 컴포넌트 언마운트 시 IntersectionObserver 해제
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

// 검색어나 카테고리 변경 시 IntersectionObserver 재설정
watch([observerTarget], () => {
  if (observerTarget.value && hasSearched.value) {
    setupIntersectionObserver();
  }
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.place-search-container {
  width: 100%;
  max-width: 800px;
  margin: 0;
}

.search-title {
  font-size: 1.5rem;
  margin-bottom: $spacing-md;
  color: $primary-color;
}

/* 현재 일차 표시 */
.current-day-indicator {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background-color: rgba($accent-color, 0.1);
  border-radius: 8px;
  margin-bottom: $spacing-md;
  position: relative;

  span {
    font-weight: $font-weight-medium;
    color: $primary-color;
  }

  .day-change-btn {
    margin-left: auto;
    background-color: transparent;
    border: none;
    color: $accent-color;
    font-size: 14px;
    cursor: pointer;
    padding: $spacing-xs $spacing-sm;
    border-radius: 4px;

    &:hover {
      background-color: rgba($accent-color, 0.1);
    }
  }
}

.search-header {
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  border-radius: 12px;
}

/* 일차 선택 드롭다운 */
.day-selector {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 280px;
  max-height: 300px;
  overflow-y: auto;
  z-index: $z-index-dropdown;
  padding: $spacing-md;
  @include glassmorphism(0.8, 10px);
  border-radius: 12px;
  box-shadow: $shadow-lg;
}

.day-selector-header {
  font-weight: $font-weight-medium;
  margin-bottom: $spacing-sm;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid rgba($medium-gray, 0.3);
  color: $primary-color;
}

.day-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.day-item {
  background: transparent;
  border: none;
  text-align: left;
  padding: $spacing-sm;
  border-radius: 8px;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($accent-color, 0.1);
  }

  &.active {
    background-color: $accent-color;
    color: $white;
  }
}

.category-selector {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;

  .category-btn {
    background: transparent;
    border: 1px solid rgba($medium-gray, 0.5);
    border-radius: 20px;
    padding: $spacing-xs $spacing-sm;
    font-size: 12px;
    color: $dark-gray;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background-color: rgba($accent-color, 0.05);
      border-color: $accent-color;
      color: $accent-color;
    }

    &.active {
      background-color: $accent-color;
      border-color: $accent-color;
      color: $white;
    }
  }
}

.search-input-wrapper {
  display: flex;
  gap: $spacing-sm;
}

.search-input {
  flex: 1;
  height: 46px;
  padding: 0 $spacing-md;
  font-size: 15px;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;

  svg {
    color: $white;
  }
}

.search-results {
  min-height: 300px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl 0;
  color: $dark-gray;

  .loading-spinner {
    margin-bottom: $spacing-md;
  }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;
  text-align: center;

  svg {
    color: $dark-gray;
    margin-bottom: $spacing-md;
  }

  p {
    margin: 0;
    color: $primary-color;
    font-weight: $font-weight-medium;
  }

  .sub-message {
    margin-top: $spacing-xs;
    color: $dark-gray;
    font-weight: normal;
    font-size: 14px;
  }
}

.place-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.place-item {
  display: flex;
  padding: $spacing-md;
  border-radius: 12px;
  transition: all $transition-normal;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &.place-added {
    border: 1px solid rgba($success-color, 0.4);
    background-color: rgba($success-color, 0.05);
  }
}

.place-content {
  flex: 1;
}

.place-name {
  font-size: 14px;
  margin: 0 0 $spacing-xs;
  color: $primary-color;
}

.place-category {
  display: inline-block;
  background-color: rgba($accent-color, 0.1);
  color: $accent-color;
  font-size: 8px;
  padding: 2px 4px;
  border-radius: 14px;
  margin-bottom: $spacing-xs;
}

.place-address {
  color: $dark-gray;
  font-size: 10px;
  margin-bottom: $spacing-xs;
}

.place-phone {
  color: $dark-gray;
  font-size: 8px;
}

.place-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  justify-content: start;
  min-width: 70px;

  .place-added-badge {
    display: inline-block;
    padding: $spacing-xs $spacing-sm;
    background-color: $success-color;
    color: $white;
    font-size: 12px;
    border-radius: 16px;
    text-align: center;
  }

  .add-place-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    background-color: $accent-color;
    color: $white;
    border: none;
    border-radius: 8px;
    padding: $spacing-xs $spacing-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background-color: color.scale($accent-color, $lightness: -5%);
    }

    svg {
      flex-shrink: 0;
    }
  }

  .place-link {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $accent-color;
    font-size: 10px;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    svg {
      flex-shrink: 0;
    }
  }
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg 0;
  color: $dark-gray;

  .loading-spinner {
    margin-bottom: $spacing-sm;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.end-message {
  text-align: center;
  padding: $spacing-lg 0;
  color: $dark-gray;
  font-size: 14px;
}

.no-trip-warning {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  margin-top: $spacing-md;
  border-radius: 12px;
  background-color: rgba($warning-color, 0.1);
  border-left: 3px solid $warning-color;

  svg {
    color: $warning-color;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    color: $primary-color;
    font-size: 14px;
  }
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba($accent-color, 0.1);
  border-top-color: $accent-color;
  animation: spinner 0.8s linear infinite;
}

/* IntersectionObserver 타겟 요소 - 눈에 보이지 않지만 옵저빙을 위해 존재 */
.observer-target {
  width: 100%;
  height: 10px;
  margin-top: $spacing-md;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

/* 모바일 반응형 */
@media (max-width: $breakpoint-md) {
  .search-header {
    padding: $spacing-md;
  }

  .search-input-wrapper {
    flex-direction: column;
  }

  .search-btn {
    height: 46px;
  }

  .place-item {
    flex-direction: column;
  }

  .place-actions {
    margin-top: $spacing-sm;
    flex-direction: row;
    justify-content: flex-start;
  }

  .day-selector {
    right: auto;
    left: 0;
    width: 100%;
  }
}
</style>
