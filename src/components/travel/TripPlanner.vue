<template>
  <div class="trip-plan-container" :class="{ 'modal-mode': isModal }">
    <div v-if="!isModal" class="app-background"></div>
    <div v-if="!isModal" class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <div class="container" :class="{ 'container-modal': isModal }">
      <div
        class="trip-form-container glass-card"
        :class="{ 'modal-form': isModal }"
      >
        <button v-if="isModal" class="modal-close" @click="$emit('close')">
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
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressWidth }"></div>
          </div>
          <div class="progress-steps">
            <div
              class="progress-step"
              :class="{ active: currentStep >= 1, completed: currentStep > 1 }"
            >
              <div class="step-number">1</div>
              <span class="step-label">여행 지역</span>
            </div>
            <div
              class="progress-step"
              :class="{ active: currentStep >= 2, completed: currentStep > 2 }"
            >
              <div class="step-number">2</div>
              <span class="step-label">여행 날짜</span>
            </div>
          </div>
        </div>

        <div class="trip-form">
          <!-- 1단계: 여행 지역 선택 -->
          <div v-if="currentStep === 1" class="trip-step">
            <div class="form-group">
              <label class="form-label">여행 제목</label>
              <input
                type="text"
                class="glass-input"
                v-model="tripTitle"
                placeholder="여행 제목을 입력하세요"
              />
            </div>

            <div class="form-group">
              <label class="form-label">여행할 지역을 선택하세요</label>
              <RegionSelector
                v-model="selectedRegion"
                @region-selected="onRegionSelected"
              />
            </div>

            <div class="form-group">
              <label class="form-label">메모 (선택사항)</label>
              <textarea
                class="glass-input"
                v-model="tripMemo"
                placeholder="여행에 대한 메모를 입력하세요"
                rows="3"
              ></textarea>
            </div>

            <div class="action-buttons" :class="{ 'with-cancel': isModal }">
              <button v-if="isModal" class="glass-btn" @click="$emit('close')">
                취소
              </button>
              <button
                class="glass-btn primary"
                :disabled="!selectedRegion || !tripTitle.trim()"
                @click="goToNextStep"
              >
                다음
              </button>
            </div>
          </div>

          <!-- 2단계: 여행 날짜 선택 -->
          <div v-if="currentStep === 2" class="trip-step">
            <h2 class="step-title">언제 떠나시나요?</h2>
            <div class="form-group">
              <label class="form-label">여행 일정을 선택하세요</label>
              <DatePicker v-model="dateRange" @date-selected="onDateSelected" />
            </div>

            <div
              v-if="dateRange.startDate && dateRange.endDate"
              class="trip-duration"
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
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>여행 기간: {{ tripDuration }}일</span>
            </div>

            <div class="trip-summary glass-card">
              <div class="summary-item">
                <div class="summary-label">여행 제목</div>
                <div class="summary-value">{{ tripTitle }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">여행 지역</div>
                <div class="summary-value">{{ getRegionName() }}</div>
              </div>
              <div v-if="tripMemo" class="summary-item">
                <div class="summary-label">메모</div>
                <div class="summary-value">{{ tripMemo }}</div>
              </div>
            </div>

            <div class="action-buttons">
              <button class="glass-btn" @click="goToPrevStep">이전</button>
              <button
                class="glass-btn primary"
                :disabled="!isDateValid"
                @click.prevent="createTripPlan"
              >
                여행 계획 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 인디케이터 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>여행 계획을 생성하는 중입니다...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { useTravelStore } from "@/stores/travel";
import RegionSelector from "@/components/travel/RegionSelector.vue";
import DatePicker from "@/components/common/utils/DatePicker.vue";

// Props 정의
const props = defineProps({
  isModal: {
    type: Boolean,
    default: false,
  },
});

// Emits 정의
const emit = defineEmits(["close", "trip-created"]);

const router = useRouter();
const notificationStore = useNotificationStore();
const travelStore = useTravelStore();

// 상태
const currentStep = ref(1);
const selectedRegion = ref(null);
const dateRange = ref({ startDate: null, endDate: null });
const tripTitle = ref(""); // 여행 제목 추가
const tripMemo = ref(""); // 여행 메모 추가
const isLoading = ref(false);

// 계산된 속성
const progressWidth = computed(() => {
  return `${(currentStep.value / 2) * 100}%`; // 2단계로 변경
});

const isDateValid = computed(() => {
  return dateRange.value.startDate && dateRange.value.endDate;
});

const tripDuration = computed(() => {
  if (!dateRange.value.startDate || !dateRange.value.endDate) return 0;

  const start = new Date(dateRange.value.startDate);
  const end = new Date(dateRange.value.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // 출발일과 도착일 포함
});

// 입력 데이터 유효성 체크
const isFormValid = computed(() => {
  // 제목 입력 여부와 지역 선택 여부, 날짜 선택 여부를 확인
  return (
    tripTitle.value.trim() !== "" &&
    selectedRegion.value !== null &&
    isDateValid.value
  );
});

// 메서드
const goToNextStep = () => {
  if (currentStep.value < 2) {
    // 2단계로 변경
    currentStep.value++;
  }
};

const goToPrevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const onRegionSelected = (region) => {
  selectedRegion.value = region;
};

const onDateSelected = (range) => {
  dateRange.value = range;
};

const getRegionName = () => {
  if (!selectedRegion.value) return "";

  if (!selectedRegion.value.districtName) {
    return `${selectedRegion.value.provinceName}`;
  }
  return `${selectedRegion.value.provinceName} ${selectedRegion.value.districtName}`;
};

const getFormattedDateRange = () => {
  if (!dateRange.value.startDate || !dateRange.value.endDate) return "";

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];

    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  return `${formatDate(dateRange.value.startDate)} ~ ${formatDate(
    dateRange.value.endDate
  )}`;
};

const createTripPlan = () => {
  // 입력 데이터 유효성 확인
  if (!isFormValid.value) {
    notificationStore.showWarning("여행 제목, 지역, 날짜를 모두 입력해주세요.");
    return;
  }

  isLoading.value = true;

  try {
    // 여행 정보를 travel.js 스토어에 저장
    travelStore.setTripInfo({
      title: tripTitle.value,
      region: selectedRegion.value,
      startDate: dateRange.value.startDate,
      endDate: dateRange.value.endDate,
      memo: tripMemo.value,
    });

    // 로딩 효과를 위한 짧은 지연 (실제 앱에서는 API 호출 등의 실제 작업으로 대체)
    setTimeout(() => {
      isLoading.value = false;

      // 성공 알림 표시
      notificationStore.showSuccess("여행 계획이 성공적으로 생성되었습니다!");

      // 모달 모드인 경우 이벤트 발생
      if (props.isModal) {
        emit("trip-created");
        // 모달 닫기 이벤트 발생
        emit("close");
      }

      // TripPlannerView로 라우팅 (모달 모드에 관계없이)
      router.push({ name: "travel-planner" });
    }, 800);
  } catch (error) {
    console.error("여행 계획 생성 오류:", error);
    isLoading.value = false;
    notificationStore.showError("여행 계획 생성 중 오류가 발생했습니다.");
  }
};

const resetForm = () => {
  currentStep.value = 1;
  selectedRegion.value = null;
  dateRange.value = { startDate: null, endDate: null };
  tripTitle.value = "";
  tripMemo.value = "";
};

onMounted(() => {
  // 컴포넌트 마운트 후 필요한 초기화 작업
});

// 모달 모드 변경 감지
watch(
  () => props.isModal,
  (newValue) => {
    if (newValue) {
      // 모달 모드로 전환 시 초기화 작업이 필요하면 여기에 추가
      resetForm();
    }
  }
);
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.trip-plan-container {
  min-height: 100vh;
  position: relative;

  &.modal-mode {
    height: 100%; /* 높이를 100%로 설정하여 부모 컨테이너를 채우도록 함 */
    min-height: auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    background-color: transparent;
    overflow: auto;
  }
}

.container {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-md;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &.container-modal {
    max-width: none;
    margin: 0;
    padding: 0;
  }

  @media (max-width: $breakpoint-md) {
    padding: 0 $spacing-sm;

    &.container-modal {
      padding: 0;
    }
  }
}

.modal-close {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  z-index: 1;
  background: transparent;
  border: none;
  color: $dark-gray;
  padding: 4px;
  margin: 0;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($primary-color, 0.1);
    color: $primary-color;
  }
}

.trip-header {
  text-align: center;
  margin-bottom: $spacing-2xl;
}

.trip-title {
  font-size: 2.5rem;
  color: $primary-color;
  margin-bottom: $spacing-sm;

  @media (max-width: $breakpoint-md) {
    font-size: 2rem;
  }
}

.trip-subtitle {
  font-size: 1.1rem;
  color: $dark-gray;
  max-width: 600px;
  margin: 0 auto;
}

.trip-form-container {
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  padding: $spacing-xl;
  border-radius: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;

  &.modal-form {
    max-width: none;
    width: 100%;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    padding: 0;

    /* 모달 모드일 때는 카드 효과 제거 */
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  @media (max-width: $breakpoint-md) {
    padding: $spacing-lg;

    &.modal-form {
      padding: 0;
    }
  }
}

.progress-container {
  margin-bottom: $spacing-xl;
  width: 100%;
  padding: $spacing-xl $spacing-xl 0;
}

.progress-bar {
  height: 6px;
  background-color: rgba($medium-gray, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: $spacing-md;
}

.progress-fill {
  height: 100%;
  background-color: $accent-color;
  transition: width 0.3s ease;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;

  .step-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: $light-gray;
    color: $dark-gray;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: $font-weight-medium;
    font-size: 14px;
    margin-bottom: $spacing-xs;
    transition: all $transition-normal;
  }

  .step-label {
    font-size: 14px;
    color: $dark-gray;
    transition: color $transition-normal;
  }

  &.active {
    .step-number {
      background-color: rgba($accent-color, 0.15);
      color: $accent-color;
    }

    .step-label {
      color: $primary-color;
      font-weight: $font-weight-medium;
    }
  }

  &.completed {
    .step-number {
      background-color: $accent-color;
      color: $white;
    }
  }
}

.trip-form {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 $spacing-xl;
}

.trip-step {
  animation: fadeIn 0.5s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.step-title {
  font-size: 1.5rem;
  margin-bottom: $spacing-lg;
  color: $primary-color;
}

.form-group {
  margin-bottom: $spacing-lg;
  width: 100%;
}

.form-label {
  display: block;
  margin-bottom: $spacing-sm;
  font-weight: $font-weight-medium;
  color: $primary-color;
}

.glass-input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  font-family: $font-family;
  border: none;
  border-radius: 8px;
  background-color: rgba($white, 0.7);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: $shadow-sm;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba($accent-color, 0.3);
  }
}

/* 여행 제목 입력란에 대한 추가 스타일 */
input.glass-input {
  height: 50px; /* 입력란 높이 증가 */
  padding: $spacing-md; /* 패딩 증가 */
  font-size: 1rem; /* 글자 크기 조정 (필요시) */
}

textarea.glass-input {
  resize: vertical;
  min-height: 200px; /* 기존 80px에서 120px로 높이 증가 */
  line-height: 1.5; /* 줄 간격 추가 */
  padding: $spacing-md; /* 패딩 증가 */
}

.trip-duration {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background-color: rgba($accent-color, 0.1);
  color: $primary-color;
  border-radius: 8px;
  margin-bottom: $spacing-lg;
  font-weight: $font-weight-medium;

  svg {
    color: $accent-color;
  }
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-lg;
  margin-bottom: $spacing-xl;
  width: 100%;

  &.with-cancel {
    justify-content: space-between;
  }

  button {
    padding: $spacing-sm $spacing-xl;
  }
}

.trip-summary {
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
  border-radius: 16px;
  background-color: rgba($white, 0.5);
  width: 100%;
}

.summary-item {
  display: flex;
  margin-bottom: $spacing-md;

  &:last-child {
    margin-bottom: 0;
  }
}

.summary-label {
  flex: 0 0 100px;
  font-weight: $font-weight-medium;
  color: $primary-color;
}

.summary-value {
  flex: 1;
  color: $dark-gray;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba($primary-color, 0.3);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  color: $white;

  p {
    margin-top: $spacing-md;
    font-weight: $font-weight-medium;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($white, 0.3);
  border-radius: 50%;
  border-top-color: $white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
