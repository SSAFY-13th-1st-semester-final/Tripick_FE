<template>
  <div class="date-picker-container">
    <div class="date-picker-input glass-card" @click="toggleCalendar" ref="datePickerRef">
      <div class="date-range-display">
        <div class="date-range-item">
          <p class="date-label">출발일</p>
          <p class="date-value">{{ formattedStartDate }}</p>
        </div>
        <div class="date-separator">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
    </div>

    <transition name="calendar-fade">
      <div v-if="showCalendar" class="calendar-container glass-card">
        <div class="calendar-header">
          <button class="nav-btn" @click="prevMonth">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>
          <h3>{{ currentMonthYear }}</h3>
          <button class="nav-btn" @click="nextMonth">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              'today': isToday(day),
              'disabled': !isValidDate(day)
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
          <button class="glass-btn primary" @click="closeCalendarManual">닫기</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useNotificationStore } from '@/stores/notification';

// Notification store
const notificationStore = useNotificationStore();

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ startDate: null, endDate: null })
  },
  minDate: {
    type: Date,
    default: () => new Date()
  },
  maxDays: {
    type: Number,
    default: 30 // 최대 30일까지 선택 가능
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'date-selected']);

// Refs
const datePickerRef = ref(null);
const showCalendar = ref(false);
const currentDate = ref(new Date());
const selectedStartDate = ref(props.modelValue.startDate ? new Date(props.modelValue.startDate) : null);
const selectedEndDate = ref(props.modelValue.endDate ? new Date(props.modelValue.endDate) : null);
const hoverDate = ref(null);
const selectionMode = ref(selectedStartDate.value ? 'end' : 'start');

// Constants
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

// Computed
const formattedStartDate = computed(() => {
  if (!selectedStartDate.value) return '날짜 선택';
  return formatDate(selectedStartDate.value);
});

const formattedEndDate = computed(() => {
  if (!selectedEndDate.value) return '날짜 선택';
  return formatDate(selectedEndDate.value);
});

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
const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value;
};

const closeCalendarManual = () => {
  showCalendar.value = false;
};

const closeCalendar = (e) => {
  if (datePickerRef.value && !datePickerRef.value.contains(e.target) && showCalendar.value) {
    showCalendar.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  
  return `${month}월 ${day}일 (${dayOfWeek})`;
};

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

const selectDate = (day) => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const selectedDate = new Date(year, month, day);
  
  if (!isValidDate(day)) return;

  if (selectionMode.value === 'start' || (selectedStartDate.value && selectedEndDate.value)) {
    // 시작일 선택 또는 재선택
    selectedStartDate.value = new Date(selectedDate);
    selectedEndDate.value = null;
    selectionMode.value = 'end';
    
    // 새 시작일을 선택하면 바로 업데이트
    emitSelectedDates();

    // 시작일 선택 알림
    notificationStore.showInfo('출발일이 선택되었습니다. 도착일을 선택해주세요.');
  } else {
    // 종료일 선택
    if (selectedDate < selectedStartDate.value) {
      // 종료일이 시작일보다 앞서면 시작일을 새로 설정
      selectedEndDate.value = new Date(selectedStartDate.value);
      selectedStartDate.value = new Date(selectedDate);
    } else {
      selectedEndDate.value = new Date(selectedDate);
    }
    selectionMode.value = 'start';
    
    // 종료일 선택 시 바로 emit 하고 캘린더 닫기
    emitSelectedDates();
    showCalendar.value = false;
    
    // 날짜 선택 완료 알림
    notificationStore.showSuccess('여행 일정이 선택되었습니다.');
  }
};

const onHoverDate = (day) => {
  if (selectionMode.value === 'end' && selectedStartDate.value) {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    hoverDate.value = new Date(year, month, day);
  }
};

const isStartDate = (day) => {
  if (!selectedStartDate.value) return false;
  
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);
  
  return date.getFullYear() === selectedStartDate.value.getFullYear() &&
         date.getMonth() === selectedStartDate.value.getMonth() &&
         date.getDate() === selectedStartDate.value.getDate();
};

const isEndDate = (day) => {
  if (!selectedEndDate.value) return false;
  
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);
  
  return date.getFullYear() === selectedEndDate.value.getFullYear() &&
         date.getMonth() === selectedEndDate.value.getMonth() &&
         date.getDate() === selectedEndDate.value.getDate();
};

const isInRange = (day) => {
  if (!selectedStartDate.value || (!selectedEndDate.value && !hoverDate.value)) return false;
  
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);
  
  const endDate = selectedEndDate.value || hoverDate.value;
  
  return date > selectedStartDate.value && date < endDate;
};

const isToday = (day) => {
  const today = new Date();
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);
  
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};

const isValidDate = (day) => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, day);
  
  // 최소 날짜 검사 (오늘 또는 설정된 최소 날짜보다 크거나 같아야 함)
  return date >= props.minDate;
};

const resetDates = () => {
  selectedStartDate.value = null;
  selectedEndDate.value = null;
  selectionMode.value = 'start';
  
  // 초기화 후 바로 emit
  emitSelectedDates();
  
  // 초기화 알림
  notificationStore.showInfo('날짜 선택이 초기화되었습니다.');
};

const emitSelectedDates = () => {
  emit('update:modelValue', {
    startDate: selectedStartDate.value,
    endDate: selectedEndDate.value
  });
  emit('date-selected', {
    startDate: selectedStartDate.value,
    endDate: selectedEndDate.value
  });
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', closeCalendar);
  
  // Set current date to the selected start date month if exists
  if (selectedStartDate.value) {
    currentDate.value = new Date(
      selectedStartDate.value.getFullYear(),
      selectedStartDate.value.getMonth(),
      1
    );
  }
});

onUnmounted(() => {
  document.removeEventListener('click', closeCalendar);
});

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue.startDate) {
    selectedStartDate.value = new Date(newValue.startDate);
    selectionMode.value = 'end';
  } else {
    selectedStartDate.value = null;
    selectionMode.value = 'start';
  }
  
  if (newValue.endDate) {
    selectedEndDate.value = new Date(newValue.endDate);
    selectionMode.value = 'start';
  } else {
    selectedEndDate.value = null;
  }
}, { deep: true });
</script>

<style lang="scss" scoped>
@use '@/assets/styles' as *;

.date-picker-container {
  position: relative;
  width: 100%;
  max-width: 420px;
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

.date-range-display {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.date-range-item {
  .date-label {
    font-size: 12px;
    color: $dark-gray;
    margin-bottom: 2px;
  }
  
  .date-value {
    font-weight: $font-weight-medium;
    font-size: 15px;
    color: $primary-color;
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

.calendar-container {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  padding: $spacing-md;
  z-index: $z-index-dropdown;
  @include glassmorphism(0.7, 12px);
  border-radius: 16px;
  box-shadow: $shadow-lg;
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
  font-size: 13px;
  font-weight: $font-weight-medium;
  color: $dark-gray;
  margin-bottom: $spacing-sm;
  
  span {
    padding: $spacing-xs 0;
    
    &:first-child {
      color: $error-color;
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
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: all $transition-fast;
  position: relative;
  
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
    color: $white;
    font-weight: $font-weight-medium;
    z-index: 1;
  }
  
  &.in-range {
    background-color: rgba($accent-color, 0.15);
  }
  
  &.disabled {
    color: $medium-gray;
    cursor: not-allowed;
    text-decoration: line-through;
    opacity: 0.6;
  }
  
  // For the range effect
  &.selected-start:not(.selected-end) {
    &::after {
      content: '';
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
      content: '';
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
  
  .calendar-container {
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