<template>
  <div class="trip-planner-content">
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
            :value="tripTitle"
            @input="$emit('update:title', $event.target.value)"
            placeholder="여행 제목을 입력하세요"
          />
        </div>

        <div class="form-group">
          <label class="form-label">여행할 지역을 선택하세요</label>
          <RegionSelector
            :model-value="selectedRegion"
            @region-selected="$emit('region-selected', $event)"
          />
        </div>

        <div class="form-group">
          <label class="form-label">메모 (선택사항)</label>
          <textarea
            class="glass-input"
            :value="tripMemo"
            @input="$emit('update:memo', $event.target.value)"
            placeholder="여행에 대한 메모를 입력하세요"
            rows="3"
          ></textarea>
        </div>

        <div class="action-buttons" :class="{ 'with-cancel': isModal }">
          <button v-if="isModal" class="glass-btn" @click="$emit('cancel')">
            취소
          </button>
          <button
            class="glass-btn primary"
            :disabled="!selectedRegion || !tripTitle.trim()"
            @click="$emit('next-step')"
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
          <DatePicker 
            :model-value="dateRange" 
            @date-selected="$emit('date-selected', $event)" 
          />
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
          <button class="glass-btn" @click="$emit('prev-step')">이전</button>
          <button
            class="glass-btn primary"
            :disabled="!isDateValid"
            @click="$emit('create-trip')"
          >
            여행 계획 시작하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import RegionSelector from "@/components/travel/RegionSelector.vue";
import DatePicker from "@/components/common/utils/DatePicker.vue";

// Props 정의
const props = defineProps({
  currentStep: {
    type: Number,
    required: true,
  },
  selectedRegion: {
    type: Object,
    default: null,
  },
  dateRange: {
    type: Object,
    required: true,
  },
  tripTitle: {
    type: String,
    required: true,
  },
  tripMemo: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  progressWidth: {
    type: String,
    required: true,
  },
  isDateValid: {
    type: Boolean,
    default: false,
  },
  tripDuration: {
    type: Number,
    default: 0,
  },
  isModal: {
    type: Boolean,
    default: false,
  },
});

// Emits 정의
const emit = defineEmits([
  "next-step",
  "prev-step", 
  "region-selected",
  "date-selected",
  "create-trip",
  "cancel",
  "update:title",
  "update:memo"
]);

// 메서드
const getRegionName = () => {
  if (!props.selectedRegion) return "";

  if (!props.selectedRegion.districtName) {
    return `${props.selectedRegion.provinceName}`;
  }
  return `${props.selectedRegion.provinceName} ${props.selectedRegion.districtName}`;
};
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.trip-planner-content {
  padding: $spacing-lg $spacing-xl;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: $breakpoint-md) {
    padding: $spacing-md $spacing-lg;
  }
}

.progress-container {
  margin-bottom: $spacing-xl;
  width: 100%;
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
  flex: 1;
  display: flex;
  flex-direction: column;
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
  margin-bottom: $spacing-md;
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

input.glass-input {
  height: 50px;
  padding: $spacing-md;
  font-size: 1rem;
}

textarea.glass-input {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
  padding: $spacing-md;
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
  margin-top: auto;
  padding-top: $spacing-lg;
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