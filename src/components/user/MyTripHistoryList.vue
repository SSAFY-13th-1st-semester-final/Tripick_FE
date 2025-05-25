<template>
  <div class="my-trip-history-container">
    <div class="my-trip-history glass-card">
      <!-- 헤더 -->
      <div class="my-trip-history__header">
        <h3 class="my-trip-history__title">내 여행 기록</h3>
        <div class="my-trip-history__stats">
          <span class="trip-count">{{ totalElements }}개</span>
        </div>
      </div>

      <!-- 여행 기록 목록 -->
      <div class="my-trip-history__list" ref="tripsContainer">
        <div
          v-for="trip in props.trips"
          :key="trip.id"
          class="trip-card glass-card"
          @click="handleTripClick(trip.id)"
        >
          <!-- 여행 기록 정보 -->
          <div class="trip-card__content">
            <div class="trip-card__main">
              <div class="trip-card__info">
                <span class="trip-card__region">{{ trip.region }}</span>
                <h4 class="trip-card__title">{{ trip.title }}</h4>
              </div>

              <div class="trip-card__description-row">
                <p class="trip-card__description">
                  {{ trip.description || "설명 없음" }}
                </p>
              </div>
            </div>

            <div class="trip-card__footer">
              <div class="trip-card__meta">
                <span class="trip-card__date">{{
                  formatDateRange(trip.startDate, trip.endDate)
                }}</span>
                <span class="trip-card__duration">{{
                  formatTripDuration(trip.startDate, trip.endDate)
                }}</span>
              </div>

              <div class="trip-card__action">
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
                  class="trip-card__arrow"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div
          v-if="props.loading && props.trips.length === 0"
          class="loading-container"
        >
          <div class="loading-spinner"></div>
          <p>여행 기록을 불러오는 중...</p>
        </div>

        <!-- 무한스크롤 로딩 (하단에 더 보기) -->
        <div
          v-if="props.loading && props.trips.length > 0"
          class="loading-more"
        >
          <div class="loading-spinner-small"></div>
          <p>더 많은 여행 기록을 불러오는 중...</p>
        </div>

        <!-- 더 이상 데이터가 없을 때 -->
        <div
          v-if="!props.hasMore && props.trips.length > 0"
          class="no-more-data"
        >
          <p>모든 여행 기록을 불러왔습니다.</p>
        </div>

        <!-- 여행 기록이 없을 때 -->
        <div
          v-if="!props.loading && props.trips.length === 0"
          class="empty-state"
        >
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
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            ></path>
          </svg>
          <h3>여행 기록이 없습니다</h3>
          <p>첫 번째 여행을 계획해보세요!</p>
        </div>

        <!-- 무한 스크롤 트리거 -->
        <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import travelService from "@/services/travel.service";

// Props 정의
const props = defineProps({
  trips: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: true,
  },
  totalElements: {
    type: Number,
    default: 0,
  },
});

// 이벤트 정의
const emit = defineEmits(["loadMore", "tripClicked"]);

// 라우터 및 스토어
const router = useRouter();
const notificationStore = useNotificationStore();

// DOM 참조
const tripsContainer = ref(null);
const infiniteScrollTrigger = ref(null);

// Intersection Observer
let observer = null;

// 여행 기록 클릭 처리
const handleTripClick = async (tripId) => {
  try {
    emit("tripClicked", tripId);

    // 부모에서 제공된 메서드 로직
    const result = await travelService.searchTripInfo(tripId);

    if (result.success) {
      router.push({ name: "travel-planner" });
    } else {
      notificationStore.showError("여행 정보를 불러오는데 실패했습니다.");
    }
  } catch (error) {
    console.error("여행 지도 이동 실패 : ", error);
    notificationStore.showError("여행 지도로 이동하는 중 오류가 발생했습니다.");
  }
};

// 날짜 범위 포맷팅
const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatted = start.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  const endFormatted = end.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return `${startFormatted} ~ ${endFormatted}`;
};

// 여행 기간 계산
const formatTripDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return `${diffDays}일`;
};

// 무한 스크롤 설정
const setupInfiniteScroll = () => {
  if (!infiniteScrollTrigger.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && props.hasMore && !props.loading) {
        setTimeout(() => {
          if (props.hasMore && !props.loading) {
            emit("loadMore");
          }
        }, 100);
      }
    },
    {
      rootMargin: "50px",
      threshold: 0.1,
    }
  );

  observer.observe(infiniteScrollTrigger.value);
};

// 라이프사이클
onMounted(async () => {
  await nextTick();
  setupInfiniteScroll();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.my-trip-history-container {
  padding: $spacing-xs;
  max-width: 1000px;
  margin: 0 auto;
}

.my-trip-history {
  padding: $spacing-xl;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;
  }

  &__title {
    color: $primary-color;
    font-weight: $font-weight-medium;
    font-size: 1.1rem;
    margin: 0;
  }

  &__stats {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    max-height: 70vh;
    overflow-y: auto;
    padding-right: $spacing-xs;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba($light-gray, 0.3);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($dark-gray, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba($primary-color, 0.4);
      }
    }
  }
}

.trip-count {
  font-size: 0.9rem;
  color: rgba($primary-color, 0.7);
  background-color: rgba($accent-color, 0.1);
  padding: $spacing-xs $spacing-sm;
  border-radius: 12px;
  border: 1px solid rgba($accent-color, 0.2);
}

.trip-card {
  position: relative;
  padding: $spacing-md;
  border-radius: 8px;
  transition: all $transition-fast;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba($primary-color, 0.08);
    border-color: rgba($accent-color, 0.3);
  }

  &__content {
    width: 100%;
  }

  &__main {
    margin-bottom: $spacing-sm;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__region {
    display: inline-block;
    background-color: rgba($accent-color, 0.1);
    color: $accent-color;
    padding: 2px $spacing-xs;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: $font-weight-medium;
    flex-shrink: 0;
  }

  &__title {
    color: $primary-color;
    font-weight: $font-weight-medium;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.3;
    flex-shrink: 0;
  }

  &__description-row {
    margin-bottom: $spacing-xs;
  }

  &__description {
    color: $dark-gray;
    line-height: 1.3;
    margin: 0;
    font-size: 0.8rem;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 0.75rem;
    color: $dark-gray;
  }

  &__date {
    color: $dark-gray;
  }

  &__duration {
    color: $warning-color;
    font-size: 0.7rem;
    background-color: rgba($warning-color, 0.1);
    padding: 2px $spacing-xs;
    border-radius: 8px;
  }

  &__action {
    display: flex;
    align-items: center;
    color: rgba($primary-color, 0.4);
    transition: $transition-fast;
  }

  &__arrow {
    transition: $transition-fast;
  }

  &:hover &__arrow {
    color: $accent-color;
    transform: translateX(2px);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba($primary-color, 0.1);
    border-top-color: $accent-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-md;
  }

  p {
    color: $dark-gray;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg;

  .loading-spinner-small {
    width: 24px;
    height: 24px;
    border: 2px solid rgba($primary-color, 0.1);
    border-top-color: $accent-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-sm;
  }

  p {
    color: $dark-gray;
    margin: 0;
    font-size: 0.9rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.no-more-data {
  text-align: center;
  padding: $spacing-lg;
  color: $dark-gray;

  p {
    margin: 0;
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-3xl;
  color: $dark-gray;

  svg {
    margin-bottom: $spacing-lg;
    opacity: 0.5;
  }

  h3 {
    color: $primary-color;
    margin-bottom: $spacing-sm;
  }

  p {
    margin: 0;
  }
}

.infinite-scroll-trigger {
  height: 1px;
}

// 반응형 디자인
@media (max-width: $breakpoint-md) {
  .my-trip-history-container {
    padding: $spacing-md;
  }

  .my-trip-history {
    padding: $spacing-lg;
  }

  .trip-card {
    &__info {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-xs;
    }

    &__footer {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-xs;
    }

    &__meta {
      gap: $spacing-sm;
    }
  }
}
</style>
