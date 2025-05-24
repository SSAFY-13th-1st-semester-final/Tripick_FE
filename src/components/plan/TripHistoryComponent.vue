<template>
  <div class="trip-history-section glass-card">
    <div class="section-header">
      <h3>{{ region }} 여행 기록</h3>
      <p>다른 여행자들의 {{ region }} 여행 기록을 확인해보세요</p>
    </div>

    <!-- 로딩 상태 -->
    <div
      v-if="tripHistoryLoading && tripHistory.length === 0"
      class="loading-state"
    >
      <div class="loading-spinner small"></div>
      <p>여행 기록을 불러오는 중...</p>
    </div>

    <!-- 데이터 없음 -->
    <div
      v-else-if="!tripHistoryLoading && tripHistory.length === 0"
      class="empty-state"
    >
      <div class="empty-icon">📍</div>
      <h4>아직 여행 기록이 없습니다</h4>
      <p>{{ region }}의 첫 번째 여행 기록을 작성해보세요!</p>
    </div>

    <!-- 여행 기록 목록 -->
    <div v-else class="trip-history-list" ref="tripHistoryContainer">
      <div
        v-for="trip in tripHistory"
        :key="trip.tripId"
        class="trip-card glass-card"
        @click="loadTripHistoryDetail(trip.tripId)"
      >
        <div class="trip-header">
          <div class="user-info">
            <img
              :src="trip.profileImageUrl || '/images/default-avatar.png'"
              :alt="trip.nickname"
              class="user-avatar"
              @error="handleImageError"
            />
            <span class="user-nickname">{{ trip.nickname }}</span>
          </div>
          <div class="trip-dates">
            {{ formatDateRange(trip.startDate, trip.endDate) }}
          </div>
        </div>

        <div class="trip-content">
          <h4 class="trip-title">{{ trip.title }}</h4>
          <p class="trip-description">{{ trip.description }}</p>
          <div class="trip-meta">
            <span class="trip-region glass-tag">{{ trip.region }}</span>
          </div>
        </div>
      </div>

      <!-- 더 불러오기 로딩 -->
      <div
        v-if="tripHistoryLoading && tripHistory.length > 0"
        class="load-more-loading"
      >
        <div class="loading-spinner small"></div>
        <p>더 많은 기록을 불러오는 중...</p>
      </div>

      <!-- 더 이상 데이터 없음 -->
      <div
        v-if="!hasMoreTripHistory && tripHistory.length > 0"
        class="no-more-data"
      >
        <p>모든 여행 기록을 확인했습니다</p>
      </div>

      <!-- 무한스크롤 감지 요소 -->
      <div ref="scrollTrigger" class="scroll-trigger"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import postService from "@/services/post.service";
import travelService from "@/services/travel.service";


// Props
const props = defineProps({
  region: {
    type: String,
    required: true,
  },
});

// 반응형 상태
const tripHistoryContainer = ref(null);
const scrollTrigger = ref(null);
const tripHistory = ref([]);
const tripHistoryLoading = ref(false);
const currentPage = ref(0);
const hasMoreTripHistory = ref(true);
const pageSize = 10;
const intersectionObserver = ref(null);
const isMounted = ref(true); // 마운트 상태 추적

// 알림 스토어
const notificationStore = useNotificationStore();
const router = useRouter();

// 여행 기록 초기화
const resetTripHistory = () => {
  tripHistory.value = [];
  currentPage.value = 0;
  hasMoreTripHistory.value = true;
};

// 여행 기록 로드
const loadTripHistory = async (region, isLoadMore = false) => {
  if (
    !isMounted.value ||
    tripHistoryLoading.value ||
    (!hasMoreTripHistory.value && isLoadMore)
  ) {
    return;
  }

  tripHistoryLoading.value = true;

  try {
    const response = await postService.getAllTripHistoryByRegion(
      currentPage.value,
      pageSize,
      region
    );

    // 컴포넌트가 언마운트되었다면 작업 중단
    if (!isMounted.value) {
      return;
    }

    // 응답 데이터 처리
    if (
      response.status === 200 &&
      response.data &&
      response.data.data.totalElements !== 0
    ) {
      const { content, totalElements, totalPages, last } = response.data.data;

      if (isLoadMore) {
        tripHistory.value.push(...content);
      } else {
        tripHistory.value = content;
      }

      hasMoreTripHistory.value = !last;
      currentPage.value += 1;

      // 사용자에게 필요한 정보만 알림 (데이터 없음)
      if (totalElements === 0 && !isLoadMore) {
        notificationStore.showInfo(`${region}의 여행 기록이 없습니다`);
      }
    } else {
      // 데이터 로드 실패 시 사용자에게 알림
      if (isMounted.value) {
        notificationStore.showError("여행 기록을 불러오는데 실패했습니다");
      }
      hasMoreTripHistory.value = false;
    }
  } catch (error) {
    // 사용자 액션으로 인한 데이터 로드 실패만 알림
    if (isMounted.value) {
      notificationStore.showError("여행 기록을 불러오는데 실패했습니다");
    }
    hasMoreTripHistory.value = false;
  } finally {
    if (isMounted.value) {
      tripHistoryLoading.value = false;
    }
  }
};

const loadTripHistoryDetail = async (tripId) => {
  try {
    const result = await travelService.searchTripInfo(tripId);
    if (result.success) {
      router.push({ name: "travel-planner" });
    }
  } catch (error) {
    console.error("여행 지도 이동 실패 : ", error);
  }
}



// 무한 스크롤 설정
const setupInfiniteScroll = () => {
  if (!isMounted.value || !scrollTrigger.value) return;

  // 기존 observer 정리
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect();
  }

  intersectionObserver.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (
        entry.isIntersecting &&
        hasMoreTripHistory.value &&
        !tripHistoryLoading.value &&
        isMounted.value
      ) {
        loadTripHistory(props.region, true);
      }
    },
    {
      root: tripHistoryContainer.value,
      rootMargin: "100px",
      threshold: 0.1,
    }
  );

  intersectionObserver.value.observe(scrollTrigger.value);
};

// 유틸리티 함수들
const formatDateRange = (startDate, endDate) => {
  if (startDate === endDate) {
    return new Date(startDate).toLocaleDateString("ko-KR");
  }
  return `${new Date(startDate).toLocaleDateString("ko-KR")} - ${new Date(
    endDate
  ).toLocaleDateString("ko-KR")}`;
};

const handleImageError = (event) => {
  event.target.src = "/images/default-avatar.png";
};

// region 변경 감시
watch(
  () => props.region,
  async (newRegion, oldRegion) => {
    // 빈 문자열이나 null인 경우 처리 안함
    if (!newRegion || newRegion === oldRegion) {
      return;
    }

    resetTripHistory();
    await nextTick();
    await loadTripHistory(newRegion);
  },
  { immediate: false }
);

// 무한스크롤 설정 (데이터 로드 후)
watch(
  () => tripHistory.value.length,
  async () => {
    await nextTick();
    setupInfiniteScroll();
  }
);

onMounted(async () => {
  isMounted.value = true;
  // region이 유효한 경우에만 로드
  if (props.region && props.region.trim() !== "") {
    await loadTripHistory(props.region);
  }
});

onUnmounted(() => {
  // 마운트 상태 변경
  isMounted.value = false;

  // Observer 정리
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect();
    intersectionObserver.value = null;
  }

  // 상태 초기화
  tripHistory.value = [];
  currentPage.value = 0;
  hasMoreTripHistory.value = true;
  tripHistoryLoading.value = false;
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

/* 여행 기록 섹션 */
.trip-history-section {
  animation: slideIn 300ms ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  margin-bottom: $spacing-lg;

  h3 {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    margin-bottom: $spacing-sm;
  }

  p {
    opacity: 0.7;
    margin: 0;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($accent-color, 0.3);
  border-top: 3px solid $accent-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: $spacing-md;

  &.small {
    width: 24px;
    height: 24px;
    border-width: 2px;
    margin-bottom: $spacing-sm;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  .empty-icon {
    font-size: 3rem;
    margin-bottom: $spacing-md;
    opacity: 0.5;
  }

  h4 {
    font-size: 1.125rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    margin-bottom: $spacing-sm;
  }

  p {
    opacity: 0.7;
    margin: 0;
  }
}

.trip-history-list {
  display: grid;
  gap: $spacing-md;
  max-height: 600px;
  overflow-y: auto;
  position: relative;
}

.trip-card {
  padding: $spacing-md;
  transition: transform $transition-fast;

  &:hover {
    transform: translateY(-2px);
  }
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;

  @media (max-width: $breakpoint-md) {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba($accent-color, 0.2);
}

.user-nickname {
  font-weight: $font-weight-medium;
  color: $primary-color;
}

.trip-dates {
  font-size: 0.875rem;
  opacity: 0.7;
}

.trip-content {
  .trip-title {
    font-size: 1.125rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    margin-bottom: $spacing-xs;
  }

  .trip-description {
    color: $primary-color;
    opacity: 0.8;
    line-height: 1.5;
    margin-bottom: $spacing-sm;

    // -webkit-line-clamp 경고 해결: 표준 속성 사용
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }
}

.trip-meta {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.trip-region {
  font-size: 0.75rem;
  padding: 2px 8px;
}

.load-more-loading,
.no-more-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md;
  text-align: center;
}

.no-more-data p {
  opacity: 0.7;
  font-size: 0.875rem;
  margin: 0;
}

.scroll-trigger {
  height: 1px;
  background: transparent;
}
</style>
