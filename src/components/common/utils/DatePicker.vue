<template>
  <div class="date-picker-container">
    <div
      class="date-picker-input glass-card"
      @click="toggleCalendar"
      ref="datePickerRef"
    >
      <div class="date-range-display">
        <div class="date-range-item">
          <p class="date-label">출발일</p>
          <p class="date-value">{{ formattedStartDate }}</p>
        </div>
        <div class="date-separator">
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
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </div>
        <div class="date-range-item">
          <p class="date-label">도착일</p>
          <p class="date-value">{{ formattedEndDate }}</p>
        </div>
      </div>
      <div class="date-icon">
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
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
    </div>

    <transition name="calendar-fade">
      <Calendar
        v-if="showCalendar"
        :start-date="selectedStartDate"
        :end-date="selectedEndDate"
        :min-date="minDate"
        @update-dates="handleDateUpdate"
        @close="closeCalendar"
        @reset="resetDates"
        class="date-picker-calendar"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useNotificationStore } from "@/stores/notification";
import Calendar from "@/components/common/utils/AppCalendar.vue";

// Notification store
const notificationStore = useNotificationStore();

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ startDate: null, endDate: null }),
  },
  minDate: {
    type: Date,
    default: () => new Date(),
  },
  maxDays: {
    type: Number,
    default: 30, // 최대 30일까지 선택 가능
  },
});

// Emits
const emit = defineEmits(["update:modelValue", "date-selected"]);

// Refs
const datePickerRef = ref(null);
const showCalendar = ref(false);
const selectedStartDate = ref(
  props.modelValue.startDate ? new Date(props.modelValue.startDate) : null
);
const selectedEndDate = ref(
  props.modelValue.endDate ? new Date(props.modelValue.endDate) : null
);

// Computed
const formattedStartDate = computed(() => {
  if (!selectedStartDate.value) return "날짜 선택";
  return formatDate(selectedStartDate.value);
});

const formattedEndDate = computed(() => {
  if (!selectedEndDate.value) return "날짜 선택";
  return formatDate(selectedEndDate.value);
});

// Methods
const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value;
};

const closeCalendar = () => {
  showCalendar.value = false;
};

const handleClickOutside = (e) => {
  if (
    datePickerRef.value &&
    !datePickerRef.value.contains(e.target) &&
    showCalendar.value &&
    !e.target.closest(".date-picker-calendar") // 캘린더 내부 클릭은 무시
  ) {
    showCalendar.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return `${month}월 ${day}일 (${dayOfWeek})`;
};

// 날짜 업데이트 핸들러
const handleDateUpdate = ({ startDate, endDate, isComplete }) => {
  selectedStartDate.value = startDate;
  selectedEndDate.value = endDate;

  // 업데이트 emit
  emitSelectedDates();

  // 알림 표시
  if (!endDate) {
    notificationStore.showInfo(
      "출발일이 선택되었습니다. 도착일을 선택해주세요."
    );
  }

  // 날짜 선택이 완료되면 캘린더 닫기
  if (isComplete) {
    showCalendar.value = false;
    notificationStore.showSuccess("여행 일정이 선택되었습니다.");
  }
};

const resetDates = () => {
  selectedStartDate.value = null;
  selectedEndDate.value = null;

  // 초기화 후 emit
  emitSelectedDates();

  // 초기화 알림
  notificationStore.showInfo("날짜 선택이 초기화되었습니다.");
};

const emitSelectedDates = () => {
  console.log("startDate: ", selectedStartDate.value)
  console.log("endDate: ", selectedEndDate.value)
  emit("update:modelValue", {
    startDate: selectedStartDate.value,
    endDate: selectedEndDate.value,
  });
  emit("date-selected", {
    startDate: selectedStartDate.value,
    endDate: selectedEndDate.value,
  });
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue.startDate) {
      selectedStartDate.value = new Date(newValue.startDate);
    } else {
      selectedStartDate.value = null;
    }

    if (newValue.endDate) {
      selectedEndDate.value = new Date(newValue.endDate);
    } else {
      selectedEndDate.value = null;
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.date-picker-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  font-family: $font-family;
}

.date-picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  cursor: pointer;
  transition: all $transition-normal;
  border-radius: 12px;
  width: 100%; /* 전체 너비 사용 */

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

.date-range-display {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%; /* 전체 너비 사용 */
}

.date-range-item {
  flex: 1; /* 가능한 공간 모두 차지 */
  min-width: 110px; /* 최소 너비 설정 */

  .date-label {
    font-size: 12px;
    color: $dark-gray;
    margin-bottom: 2px;
  }

  .date-value {
    font-weight: $font-weight-medium;
    font-size: 15px;
    color: $primary-color;
    white-space: nowrap; /* 텍스트 줄바꿈 방지 */
    overflow: hidden;
    text-overflow: ellipsis; /* 필요시 말줄임표 표시 */
  }
}

.date-separator {
  color: $dark-gray;
  padding: 0 $spacing-xs;
}

.date-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary-color;
}

.date-picker-calendar {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  z-index: $z-index-dropdown;

  background-color: rgba(255, 255, 255, 1); /* 배경색 추가, 투명도 0.4로 설정 */
  backdrop-filter: blur(12px); /* 블러 효과 추가 */
  -webkit-backdrop-filter: blur(12px); /* Safari 지원 */
}

// 애니메이션
.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.calendar-fade-enter-from,
.calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: $breakpoint-md) {
  .date-picker-container {
    max-width: 100%;
  }

  .date-picker-calendar {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 350px;
    z-index: $z-index-modal;
  }

  .calendar-fade-enter-from,
  .calendar-fade-leave-to {
    transform: translate(-50%, -45%);
    opacity: 0;
  }
}
</style>
