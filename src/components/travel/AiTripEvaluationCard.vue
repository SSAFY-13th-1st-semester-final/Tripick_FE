<template>
  <div
    ref="cardRef"
    class="ai-trip-evaluation-card glass-card draggable"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @mousedown="startDrag"
  >
    <!-- 드래그 핸들 -->
    <div class="drag-handle">
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
        class="drag-icon"
      >
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
      </svg>
    </div>

    <!-- 헤더 -->
    <div class="ai-evaluation-card__header">
      <div class="ai-evaluation-card__title">
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
          class="ai-evaluation-card__icon"
        >
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
          <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
        </svg>
        <span>AI 일정 평가</span>
      </div>

      <AppButton
        @click="requestEvaluation"
        :disabled="isLoading || selectedDay === '' || selectedDay === null"
        variant="accent"
        size="sm"
        class="ai-evaluation-card__button"
      >
        <svg
          v-if="isLoading"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="ai-evaluation-card__spinner"
        >
          <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="ai-evaluation-card__icon-small"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        {{ isLoading ? "평가 중..." : "평가 시작" }}
      </AppButton>
    </div>

    <!-- 일차 선택 -->
    <div class="ai-evaluation-card__day-selector">
      <label class="day-selector-label">평가할 일차 선택:</label>
      <select v-model="selectedDay" class="day-selector" :disabled="isLoading">
        <option value="">일차를 선택하세요</option>
        <option
          v-for="(day, index) in availableDays"
          :key="index"
          :value="index"
        >
          {{ index + 1 }}일차 ({{ formatDate(day.date) }})
          {{
            day.placeCount > 0 ? `- ${day.placeCount}개 장소` : "- 장소 없음"
          }}
        </option>
      </select>
    </div>

    <!-- 컨텐츠 -->
    <div class="ai-evaluation-card__content">
      <div
        v-if="!evaluationData && !isLoading && !error"
        class="ai-evaluation-card__placeholder"
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
          class="ai-evaluation-card__placeholder-icon"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>AI가 선택한 일차의 여행 일정을 평가해드립니다.</p>
        <p class="ai-evaluation-card__sub-text">
          일차를 선택하고 평가를 시작해주세요.
        </p>
      </div>

      <div v-if="isLoading" class="ai-evaluation-card__loading">
        <div class="ai-evaluation-card__loading-spinner"></div>
        <p>AI가 {{ selectedDay + 1 }}일차 일정을 분석하고 있습니다...</p>
      </div>

      <div v-if="error" class="ai-evaluation-card__error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="ai-evaluation-card__error-icon"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <p>{{ error }}</p>
        <AppButton
          @click="requestEvaluation"
          variant="outline"
          size="sm"
          class="ai-evaluation-card__retry-button"
        >
          다시 시도
        </AppButton>
      </div>

      <div v-if="evaluationData" class="ai-evaluation-card__evaluation">
        <div class="ai-evaluation-card__evaluation-header">
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
            class="ai-evaluation-card__evaluation-icon"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            ></path>
          </svg>
          <span>{{ selectedDay + 1 }}일차 AI 평가 결과</span>
        </div>

        <div class="ai-evaluation-card__evaluation-content">
          <div class="evaluation-text">
            {{ evaluationData }}
          </div>
        </div>

        <div class="ai-evaluation-card__evaluation-footer">
          <span class="ai-evaluation-card__generated-time">
            {{ formatTimestamp(generatedAt) }}
          </span>
          <AppButton
            @click="requestEvaluation"
            variant="ghost"
            size="sm"
            class="ai-evaluation-card__regenerate-button"
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
              class="ai-evaluation-card__icon-small"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              ></path>
            </svg>
            다시 평가
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useNotificationStore } from "@/stores/notification";
import { useTravelStore } from "@/stores/travel";
import AppButton from "@/components/common/shared/AppButton.vue";

// Props 정의
const props = defineProps({
  initialPosition: {
    type: Object,
    default: () => ({ x: 50, y: 50 }),
  },
});

// Emits 정의
const emit = defineEmits(["evaluation-requested", "close"]);

// 상태 정의
const evaluationData = ref(null);
const isLoading = ref(false);
const error = ref(null);
const generatedAt = ref(null);
const selectedDay = ref("");

// 드래그 관련 상태
const cardRef = ref(null);
const position = ref({ ...props.initialPosition });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// 스토어
const notificationStore = useNotificationStore();
const travelStore = useTravelStore();

// 사용 가능한 일차 목록 계산
const availableDays = computed(() => {
  const days = [];
  const itinerary = travelStore.itinerary || [];

  for (let i = 0; i < itinerary.length; i++) {
    const dayItinerary = itinerary[i] || [];
    const placeCount = dayItinerary.filter(
      (place) => place && place.id != null
    ).length;

    // 여행 시작일로부터 날짜 계산
    const tripStartDate = new Date(travelStore.tripInfo.startDate);
    const currentDate = new Date(tripStartDate);
    currentDate.setDate(currentDate.getDate() + i);

    days.push({
      date: currentDate,
      placeCount: placeCount,
    });
  }

  return days;
});

// 평가 요청 함수
const requestEvaluation = async () => {
  if (selectedDay.value === "" || selectedDay.value == null) {
    notificationStore.showWarning("평가할 일차를 선택해주세요.");
    return;
  }

  if (isLoading.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    // 부모 컴포넌트에 평가 요청 이벤트 emit
    await emit("evaluation-requested", {
      dayIndex: parseInt(selectedDay.value),
    });
  } catch (err) {
    error.value = "평가 생성 중 오류가 발생했습니다.";
    notificationStore.showError("AI 평가 서비스 오류가 발생했습니다.");
  } finally {
    isLoading.value = false;
  }
};

// 평가 데이터 설정 (부모 컴포넌트에서 호출)
const setEvaluationData = (data) => {
  if (data && data.response) {
    evaluationData.value = data.response;
    generatedAt.value = new Date();
    error.value = null;
  } else {
    error.value = "평가 데이터를 가져올 수 없습니다.";
  }
  isLoading.value = false;
};

// 에러 설정 (부모 컴포넌트에서 호출)
const setEvaluationError = (errorMessage) => {
  error.value = errorMessage || "평가 생성에 실패했습니다.";
  evaluationData.value = null;
  isLoading.value = false;
};

// 로딩 상태 설정 (부모 컴포넌트에서 호출)
const setLoading = (loading) => {
  isLoading.value = loading;
  if (loading) {
    error.value = null;
  }
};

// 날짜 포맷팅
const formatDate = (date) => {
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
};

// 생성 시간 포맷팅
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "방금 생성됨";
  } else if (minutes < 60) {
    return `${minutes}분 전 생성됨`;
  } else {
    return (
      timestamp.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " 생성됨"
    );
  }
};

// 드래그 기능
const startDrag = (event) => {
  // 드래그 핸들 영역에서만 드래그 시작
  if (!event.target.closest(".drag-handle")) return;

  isDragging.value = true;
  const rect = cardRef.value.getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
  event.preventDefault();
};

const onDrag = (event) => {
  if (!isDragging.value) return;

  const maxX = window.innerWidth - 320; // 카드 너비 고려
  const maxY = window.innerHeight - 400; // 카드 높이 고려

  position.value = {
    x: Math.max(0, Math.min(maxX, event.clientX - dragOffset.value.x)),
    y: Math.max(0, Math.min(maxY, event.clientY - dragOffset.value.y)),
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
};

// 부모 컴포넌트에서 접근할 수 있도록 expose
defineExpose({
  setEvaluationData,
  setEvaluationError,
  setLoading,
  requestEvaluation,
});

// 컴포넌트 해제 시 이벤트 리스너 정리
onUnmounted(() => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.ai-trip-evaluation-card {
  position: fixed;
  width: 320px;
  max-height: 80vh;
  padding: $spacing-lg;
  z-index: 1055; // MapActionBar보다 위에
  overflow-y: auto;
  user-select: none;

  &.draggable {
    cursor: move;
  }
}

.drag-handle {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: rgba($primary-color, 0.4);
  transition: $transition-fast;

  &:hover {
    color: $accent-color;
  }

  &:active {
    cursor: grabbing;
  }
}

.drag-icon {
  width: 16px;
  height: 16px;
}

.ai-evaluation-card {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-weight: $font-weight-medium;
    color: $primary-color;
    font-size: 0.95rem;
  }

  &__icon {
    color: $accent-color;
    flex-shrink: 0;
  }

  &__button {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 0.85rem;
    padding: $spacing-xs $spacing-sm;
    white-space: nowrap;
  }

  &__day-selector {
    margin-bottom: $spacing-lg;
  }

  &__content {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__placeholder {
    text-align: center;
    padding: $spacing-lg 0;
    color: rgba($primary-color, 0.6);

    p {
      margin: $spacing-sm 0;
      font-size: 0.9rem;
    }
  }

  &__sub-text {
    font-size: 0.8rem !important;
    color: rgba($primary-color, 0.5) !important;
  }

  &__placeholder-icon {
    color: rgba($primary-color, 0.3);
    margin-bottom: $spacing-md;
  }

  &__loading {
    text-align: center;
    padding: $spacing-lg 0;

    p {
      margin-top: $spacing-md;
      color: rgba($primary-color, 0.7);
      font-size: 0.9rem;
    }
  }

  &__loading-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid rgba($accent-color, 0.2);
    border-top-color: $accent-color;
    border-radius: 50%;
    animation: ai-spin 1s linear infinite;
    margin: 0 auto;
  }

  &__error {
    text-align: center;
    padding: $spacing-lg 0;
    color: $error-color;

    p {
      margin: $spacing-sm 0;
      font-size: 0.9rem;
    }
  }

  &__error-icon {
    color: $error-color;
    margin-bottom: $spacing-sm;
  }

  &__retry-button {
    margin-top: $spacing-sm;
  }

  &__evaluation {
    padding: $spacing-sm 0;
  }

  &__evaluation-header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    color: $accent-color;
    font-weight: $font-weight-medium;
    font-size: 0.9rem;
  }

  &__evaluation-icon {
    color: $accent-color;
    flex-shrink: 0;
  }

  &__evaluation-content {
    margin-bottom: $spacing-md;
  }

  &__evaluation-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-md;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba($primary-color, 0.1);
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__generated-time {
    font-size: 0.75rem;
    color: rgba($primary-color, 0.5);
  }

  &__regenerate-button {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 0.8rem;
    padding: $spacing-xs $spacing-sm;
  }

  &__icon-small {
    flex-shrink: 0;
  }

  &__spinner {
    animation: ai-spin 1s linear infinite;
  }
}

.day-selector-label {
  display: block;
  margin-bottom: $spacing-xs;
  font-size: 0.9rem;
  font-weight: $font-weight-medium;
  color: $primary-color;
}

.day-selector {
  width: 100%;
  padding: $spacing-sm;
  border: 1px solid rgba($primary-color, 0.2);
  border-radius: 8px;
  background-color: rgba($white, 0.8);
  color: $primary-color;
  font-size: 0.9rem;
  transition: $transition-fast;

  &:focus {
    outline: none;
    border-color: $accent-color;
    box-shadow: 0 0 0 2px rgba($accent-color, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.evaluation-text {
  background-color: rgba($accent-color, 0.05);
  padding: $spacing-md;
  border-radius: 8px;
  border-left: 3px solid $accent-color;
  line-height: 1.6;
  font-size: 0.9rem;
  color: $primary-color;
  white-space: pre-wrap;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

// 모바일 대응
@media (max-width: $breakpoint-md) {
  .ai-trip-evaluation-card {
    width: calc(100% - #{$spacing-lg * 2});
    max-width: 320px;

    &__header {
      flex-direction: column;
      align-items: stretch;
      gap: $spacing-sm;
    }

    &__button {
      justify-content: center;
    }

    &__evaluation-footer {
      flex-direction: column;
      align-items: stretch;
      gap: $spacing-sm;
    }

    &__generated-time {
      text-align: center;
    }

    &__regenerate-button {
      justify-content: center;
    }
  }
}
</style>
