<template>
  <div class="ai-summary-card glass-card">
    <div class="ai-summary-card__header">
      <div class="ai-summary-card__title">
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
          class="ai-summary-card__icon"
        >
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
          <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
        </svg>
        <span>AI 요약 서비스</span>
      </div>

      <AppButton
        @click="requestSummary"
        :disabled="isLoading"
        variant="accent"
        size="sm"
        class="ai-summary-card__button"
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
          class="ai-summary-card__spinner"
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
          class="ai-summary-card__icon-small"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        {{ isLoading ? "요약 중..." : "요약 생성" }}
      </AppButton>
    </div>

    <div class="ai-summary-card__content">
      <div
        v-if="!summaryData && !isLoading && !error"
        class="ai-summary-card__placeholder"
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
          class="ai-summary-card__placeholder-icon"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          ></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <p>AI가 이 게시글을 세 줄로 요약해드립니다.</p>
        <p class="ai-summary-card__sub-text">요약 생성 버튼을 클릭해주세요.</p>
      </div>

      <div v-if="isLoading" class="ai-summary-card__loading">
        <div class="ai-summary-card__loading-spinner"></div>
        <p>AI가 게시글을 분석하고 있습니다...</p>
      </div>

      <div v-if="error" class="ai-summary-card__error">
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
          class="ai-summary-card__error-icon"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <p>{{ error }}</p>
        <AppButton
          @click="requestSummary"
          variant="outline"
          size="sm"
          class="ai-summary-card__retry-button"
        >
          다시 시도
        </AppButton>
      </div>

      <div v-if="summaryData" class="ai-summary-card__summary">
        <div class="ai-summary-card__summary-header">
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
            class="ai-summary-card__summary-icon"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            ></path>
          </svg>
          <span>AI 요약 결과</span>
        </div>

        <div class="ai-summary-card__summary-content">
          <p
            v-for="(line, index) in formattedSummary"
            :key="index"
            class="ai-summary-card__summary-line"
          >
            <span class="ai-summary-card__line-number">{{ index + 1 }}.</span>
            {{ line }}
          </p>
        </div>

        <div class="ai-summary-card__summary-footer">
          <span class="ai-summary-card__generated-time">
            {{ formatTimestamp(generatedAt) }}
          </span>
          <AppButton
            @click="requestSummary"
            variant="ghost"
            size="sm"
            class="ai-summary-card__regenerate-button"
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
              class="ai-summary-card__icon-small"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              ></path>
            </svg>
            다시 생성
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useNotificationStore } from "@/stores/notification";
import AppButton from "@/components/common/shared/AppButton.vue";

// Props 정의
const props = defineProps({
  postId: {
    type: Number,
    required: true,
  },
});

// Emits 정의
const emit = defineEmits(["summary-requested"]);

// 상태 정의
const summaryData = ref(null);
const isLoading = ref(false);
const error = ref(null);
const generatedAt = ref(null);

// 스토어
const notificationStore = useNotificationStore();

// 요약 요청 함수
const requestSummary = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    // 부모 컴포넌트에 요약 요청 이벤트 emit
    const response = await emit("summary-requested", props.postId);

    // 실제 API 호출은 부모 컴포넌트에서 처리하고 결과를 받아옴
    // 이 부분은 부모에서 setSummaryData 메소드를 통해 데이터를 설정받음
  } catch (err) {
    error.value = "요약 생성 중 오류가 발생했습니다.";
    notificationStore.showError("AI 요약 서비스 오류가 발생했습니다.");
  } finally {
    isLoading.value = false;
  }
};

// 요약 데이터 설정 (부모 컴포넌트에서 호출)
const setSummaryData = (data) => {
  if (data && data.response) {
    summaryData.value = data.response;
    generatedAt.value = new Date();
    error.value = null;
  } else {
    error.value = "요약 데이터를 가져올 수 없습니다.";
  }
  isLoading.value = false;
};

// 에러 설정 (부모 컴포넌트에서 호출)
const setSummaryError = (errorMessage) => {
  error.value = errorMessage || "요약 생성에 실패했습니다.";
  summaryData.value = null;
  isLoading.value = false;
};

// 로딩 상태 설정 (부모 컴포넌트에서 호출)
const setLoading = (loading) => {
  isLoading.value = loading;
  if (loading) {
    error.value = null;
  }
};

// 요약 내용을 줄 단위로 분할
const formattedSummary = computed(() => {
  if (!summaryData.value) return [];

  // 문자열을 줄바꿈으로 분할하고 빈 줄 제거
  return summaryData.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 3); // 최대 3줄만 표시
});

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

// 부모 컴포넌트에서 접근할 수 있도록 expose
defineExpose({
  setSummaryData,
  setSummaryError,
  setLoading,
  requestSummary,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.ai-summary-card {
  width: 100%;
  max-width: 320px;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;

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

  &__summary {
    padding: $spacing-sm 0;
  }

  &__summary-header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    color: $accent-color;
    font-weight: $font-weight-medium;
    font-size: 0.9rem;
  }

  &__summary-icon {
    color: $accent-color;
    flex-shrink: 0;
  }

  &__summary-content {
    margin-bottom: $spacing-md;
  }

  &__summary-line {
    margin-bottom: $spacing-sm;
    line-height: 1.5;
    font-size: 0.9rem;
    color: $primary-color;
    display: flex;
    align-items: flex-start;
    gap: $spacing-xs;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__line-number {
    color: $accent-color;
    font-weight: $font-weight-medium;
    flex-shrink: 0;
    margin-top: 1px;
  }

  &__summary-footer {
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

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

// 모바일 대응
@media (max-width: $breakpoint-md) {
  .ai-summary-card {
    max-width: 100%;

    &__header {
      flex-direction: column;
      align-items: stretch;
      gap: $spacing-sm;
    }

    &__button {
      justify-content: center;
    }

    &__summary-footer {
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
