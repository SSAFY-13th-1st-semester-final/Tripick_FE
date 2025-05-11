<template>
  <div class="relative mt-2 bg-white p-4 shadow rounded z-10 w-full" style="max-width: 1000px;">
    <!-- 상단 텍스트 추가 -->
    <div class="text-center mt-10 mb-10">
      <h1 class="text-3xl font-bold">여행 기간이 어떻게 되시나요?</h1>
      <p class="text-sm text-gray-500 mt-2 underline">
        현지 여행 기간<span class="font-bold">(여행지 도착날짜, 여행지 출발날짜)</span>으로 입력해주세요.
      </p>
    </div>

    <!-- 달력 영역 중앙 정렬 -->
    <div class="flex justify-center gap-8 mb-10">
      <!-- 현재 월 달력 -->
      <div class="w-96">
        <div class="flex items-center justify-between mb-4">
          <!-- 화살표 버튼들 -->
          <button @click="changeMonth(-1)" class="text-lg font-bold px-4">◀</button>
          
          <!-- 현재 월 텍스트 (가운데 정렬) -->
          <span class="text-lg font-semibold mx-auto">
            {{ getYear(0) }}년 {{ getMonth(0) }}월
          </span>
        </div>

        <div class="grid grid-cols-7 text-center text-lg font-light mb-2">
          <div v-for="day in daysOfWeek" :key="day" class="text-xl">{{ day }}</div>
        </div>
        <div class="grid grid-cols-7 text-center text-lg font-light">
          <div v-for="n in firstDayOfMonth(0)" :key="'blank1-' + n"></div>
          <div
            v-for="day in daysInMonth(0)"
            :key="'day1-' + day"
            class="p-3 m-2 rounded cursor-pointer text-xl aspect-square flex items-center justify-center"
            :class="getDayClass(0, day)"
            @click="handleDateClick(0, day)"
            style="width: 40px; height: 40px;"
          >
            {{ day }}
          </div>
        </div>
      </div>

      <!-- 다음 월 달력 -->
      <div class="w-96">
        <div class="flex items-center justify-between mb-4">
          <!-- 현재 월 텍스트 (가운데 정렬) -->
          <span class="text-lg font-semibold mx-auto">
            {{ getYear(1) }}년 {{ getMonth(1) }}월
          </span>

          <!-- 화살표 버튼들 -->
          <button @click="changeMonth(1)" class="text-lg font-bold px-4">▶</button>
        </div>

        <div class="grid grid-cols-7 text-center text-lg font-light mb-2">
          <div v-for="day in daysOfWeek" :key="day" class="text-xl">{{ day }}</div>
        </div>
        <div class="grid grid-cols-7 text-center text-lg font-light">
          <div v-for="n in firstDayOfMonth(1)" :key="'blank2-' + n"></div>
          <div
            v-for="day in daysInMonth(1)"
            :key="'day2-' + day"
            class="p-3 m-2 rounded cursor-pointer text-xl aspect-square flex items-center justify-center"
            :class="getDayClass(1, day)"
            @click="handleDateClick(1, day)"
            style="width: 40px; height: 40px;"  
          >
            {{ day }}
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 버튼을 우측 하단으로 이동 -->
    <div class="absolute bottom-4 right-4 flex gap-4">
      <button @click="emitCancel" class="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm">취소</button>
      <button
        @click="emitConfirm"
        :disabled="!startDate || !endDate"
        class="px-6 py-2 rounded bg-black text-white hover:bg-gray-800 text-sm disabled:opacity-50"
      >
        선택
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    const today = new Date();
    return {
      month: today.getMonth(),  // 현재 월 (0부터 시작)
      year: today.getFullYear(), // 현재 연도
      startDate: null,
      endDate: null,
      daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    };
  },
  methods: {
    // 월 계산 (1부터 시작하도록)
    getMonth(offset) {
      const month = this.month + offset;
      if (month < 0) return 12 + month; // 12월로 넘어가는 경우
      if (month > 11) return month - 12; // 1월로 넘어가는 경우
      return month + 1; // 1부터 시작하도록 수정
    },
    getYear(offset) {
      return this.year + Math.floor((this.month + offset) / 12);
    },
    daysInMonth(offset) {
      const year = this.getYear(offset);
      const month = this.getMonth(offset) - 1; // 내부적으로 0부터 시작하는 월로 처리해야 하므로 1을 빼줍니다.
      return new Date(year, month + 1, 0).getDate();
    },
    firstDayOfMonth(offset) {
      const year = this.getYear(offset);
      const month = this.getMonth(offset) - 1; // 월을 0부터 시작하는 값으로 수정
      return new Date(year, month, 1).getDay();
    },
    handleDateClick(monthOffset, day) {
      const selected = new Date(this.getYear(monthOffset), this.getMonth(monthOffset) - 1, day);
      const today = new Date().setHours(0, 0, 0, 0);
      if (selected < today) return;

      if (!this.startDate || this.endDate) {
        this.startDate = selected;
        this.endDate = null;
      } else {
        if (selected >= this.startDate) this.endDate = selected;
        else {
          this.startDate = selected;
          this.endDate = null;
        }
      }
    },
    changeMonth(delta) {
      this.month += delta;
      if (this.month < 0) {
        this.month = 11;
        this.year--;
      } else if (this.month > 11) {
        this.month = 0;
        this.year++;
      }
    },
    isSameDate(a, b) {
      return a && b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    },
    isInRange(date) {
      return this.startDate && this.endDate && date > this.startDate && date < this.endDate;
    },
    getDayClass(monthOffset, day) {
      const date = new Date(this.getYear(monthOffset), this.getMonth(monthOffset) - 1, day);
      const today = new Date().setHours(0, 0, 0, 0);
      const isPast = date < today;
      const weekday = date.getDay();
      const classes = [];

      if (isPast) {
        classes.push('text-gray-300', 'pointer-events-none');
      } else {
        if (this.isSameDate(date, this.startDate) || this.isSameDate(date, this.endDate)) {
          classes.push('bg-black', 'text-white');
        } else if (this.isInRange(date)) {
          classes.push('bg-gray-300', 'text-black');
        } else {
          if (weekday === 0) classes.push('text-red-500');
          else if (weekday === 6) classes.push('text-blue-800');
          else classes.push('text-gray-700');
        }
      }

      return classes.join(' ');
    },
    emitConfirm() {
      this.$emit('confirm', {
        startDate: this.startDate,
        endDate: this.endDate,
      });
    },
    emitCancel() {
      this.$emit('cancel');
    },
  },
};
</script>

<style scoped>
/* 팝업 크기 고정 */
div.relative {
  width: 1000px; /* 고정된 너비 */
  max-width: 1000px; /* 최대 너비 */
  height: auto;  /* 높이는 자동으로 설정 */
}

/* 정사각형 날짜 영역 */
.aspect-square {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
