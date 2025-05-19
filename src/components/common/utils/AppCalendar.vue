<template>
  <div class="calendar-container glass-card">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">
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
          <path d="m15 18-6-6 6-6"></path>
        </svg>
      </button>
      <h3>{{ currentMonthYear }}</h3>
      <button class="nav-btn" @click="nextMonth">
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
          <path d="m9 18 6-6-6-6"></path>
        </svg>
      </button>
    </div>

    <div class="weekdays">
      <span v-for="day in weekDays" :key="day">{{ day }}</span>
    </div>

    <div class="calendar-grid">
      <!-- 이전 달의 날짜들 -->
      <div
        v-for="day in prevMonthDays"
        :key="`prev-${day}`"
        class="calendar-day prev-month-day"
      >
        {{ day }}
      </div>

      <!-- 현재 달의 날짜들 -->
      <div
        v-for="day in daysInMonth"
        :key="`curr-${day}`"
        class="calendar-day"
        :class="{
          'selected-start': isStartDate(day),
          'selected-end': isEndDate(day),
          'in-range': isInRange(day),
          today: isToday(day),
          disabled: !isValidDate(day),
        }"
        @click="selectDate(day)"
        @mouseenter="onHoverDate(day)"
      >
        {{ day }}
      </div>

      <!-- 다음 달의 날짜들 -->
      <div
        v-for="day in nextMonthDays"
        :key="`next-${day}`"
        class="calendar-day next-month-day"
      >
        {{ day }}
      </div>
    </div>

    <div class="calendar-footer">
      <button class="glass-btn" @click="resetDates">초기화</button>
      <button class="glass-btn primary" @click="$emit('close')">닫기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// Props
const props = defineProps({
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  minDate: {
    type: Date,
    default: () => new Date(),
  },
});

// Emits
const emit = defineEmits(["update-dates", "close", "reset"]);

// Refs
const currentDate = ref(new Date());
const hoverDate = ref(null);

// Constants
const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

// Computed
const currentMonthYear = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  return `${year}년 ${month + 1}월`;
});

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  return new Date(year, month + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  return new Date(year, month, 1).getDay();
});

const prevMonthDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let i = firstDayOfMonth.value - 1; i >= 0; i--) {
    days.push(daysInPrevMonth - i);
  }

  return days;
});

const nextMonthDays = computed(() => {
  const remainingCells = 42 - (prevMonthDays.value.length + daysInMonth.value);
  const days = [];

  for (let i = 1; i <= remainingCells; i++) {
    days.push(i);
  }

  return days;
});

// Methods
const prevMonth = () => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  currentDate.value = new Date(year, month - 1, 1);
};

const nextMonth = () => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  currentDate.value = new Date(year, month + 1, 1);
};

// 날짜 선택 로직
const selectDate = (day) => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const selectedDate = new Date(year, month, day);

  if (!isValidDate(day)) return;

  // 둘 다 선택되지 않았거나 둘 다 선택되었으면, 시작일로 새로 설정
  if (!props.startDate || (props.startDate && props.endDate)) {
    emit("update-dates", {
      startDate: new Date(selectedDate),
      endDate: null,
      isComplete: false,
    });
  }
  // 시작일만 선택된 상태에서 두 번째 날짜 선택
  else {
    let newStartDate = props.startDate;
    let newEndDate = selectedDate;

    // 선택된 날짜가 시작일보다 이전이면
    if (selectedDate < props.startDate) {
      // 선택된 날짜를 시작일로, 기존 시작일을 종료일로 설정
      newStartDate = new Date(selectedDate);
      newEndDate = new Date(props.startDate);
    }

    emit("update-dates", {
      startDate: newStartDate,
      endDate: newEndDate,
      isComplete: true,
    });
  }
};

const onHoverDate = (day) => {
  if (props.startDate && !props.endDate) {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    hoverDate.value = new Date(year, month, day);
  }
};

const isStartDate = (day) => {
  if (!props.startDate) return false;

  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);

  return (
    date.getFullYear() === props.startDate.getFullYear() &&
    date.getMonth() === props.startDate.getMonth() &&
    date.getDate() === props.startDate.getDate()
  );
};

const isEndDate = (day) => {
  if (!props.endDate) return false;

  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);

  return (
    date.getFullYear() === props.endDate.getFullYear() &&
    date.getMonth() === props.endDate.getMonth() &&
    date.getDate() === props.endDate.getDate()
  );
};

const isInRange = (day) => {
  if (!props.startDate || (!props.endDate && !hoverDate.value)) return false;

  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);

  const endDate = props.endDate || hoverDate.value;

  return date > props.startDate && date < endDate;
};

const isToday = (day) => {
  const today = new Date();
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const isValidDate = (day) => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);

  // 최소 날짜 검사 (오늘 또는 설정된 최소 날짜보다 크거나 같아야 함)
  return date >= props.minDate;
};

const resetDates = () => {
  emit("reset");
};

// Lifecycle hooks
onMounted(() => {
  // Set current date to the selected start date month if exists
  if (props.startDate) {
    currentDate.value = new Date(
      props.startDate.getFullYear(),
      props.startDate.getMonth(),
      1
    );
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.calendar-container {
  padding: $spacing-md;
  border-radius: 16px;
  box-shadow: $shadow-lg;
  background-color: rgba(
    255,
    255,
    255,
    0.4
  ); /* 배경색 추가, 투명도 0.4로 설정 */
  backdrop-filter: blur(12px); /* 블러 효과 추가 */
  -webkit-backdrop-filter: blur(12px); /* Safari 지원 */
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;

  h3 {
    font-size: 16px;
    margin: 0;
  }

  .nav-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-xs;
    border-radius: 50%;
    color: $primary-color;
    transition: all $transition-fast;

    &:hover {
      background-color: rgba($primary-color, 0.1);
    }
  }
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 14px;
  font-weight: $font-weight-bold; /* 글꼴 굵기 변경: 더 굵게 */
  color: $dark-gray;
  margin-bottom: $spacing-sm;

  span {
    padding: $spacing-xs 0;

    &:first-child {
      color: $error-color; /* 일요일 색상: 빨간색 */
    }

    &:last-child {
      color: $accent-color; /* 토요일 색상: 파란색 */
    }
  }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px; /* 가로 너비를 고정해서 원형으로 유지 */
  height: 50px;
  border-radius: 50%; /* 완전한 원형으로 변경 */
  margin: 0 auto; /* 중앙 정렬을 위해 자동 마진 추가 */
  cursor: pointer;
  font-size: 14px;
  transition: all $transition-fast;
  position: relative;

  /* 일요일 날짜 (첫 번째 열) */
  &:nth-child(7n + 1) {
    color: $error-color; /* 빨간색 */
  }

  /* 토요일 날짜 (7번째 열) */
  &:nth-child(7n) {
    color: $accent-color; /* 파란색 */
  }

  &:hover:not(.prev-month-day, .next-month-day, .disabled) {
    background-color: rgba($accent-color, 0.1);
  }

  &.prev-month-day,
  &.next-month-day {
    color: $medium-gray;
    cursor: default;
  }

  &.today {
    font-weight: $font-weight-bold;
    border: 1px solid rgba($accent-color, 0.5);
  }

  &.selected-start,
  &.selected-end {
    background-color: $accent-color;
    color: $white !important; /* 선택 시 항상 흰색 (토/일요일 색상 오버라이드) */
    font-weight: $font-weight-medium;
    z-index: 1;
  }

  &.in-range {
    background-color: rgba($accent-color, 0.15);
  }

  &.disabled {
    color: $medium-gray !important; /* 비활성화 시 회색 (토/일요일 색상 오버라이드) */
    cursor: not-allowed;
    text-decoration: line-through;
    opacity: 0.6;
  }

  // For the range effect
  &.selected-start:not(.selected-end) {
    &::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 50%;
      background-color: rgba($accent-color, 0.15);
      z-index: -1;
    }
  }

  &.selected-end:not(.selected-start) {
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 50%;
      background-color: rgba($accent-color, 0.15);
      z-index: -1;
    }
  }
}

.calendar-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid rgba($medium-gray, 0.3);
}
</style>
