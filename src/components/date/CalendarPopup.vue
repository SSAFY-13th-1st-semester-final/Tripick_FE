<template>
  <div
    class="relative bg-white p-4 rounded z-10 w-full"
    style="max-width: 800px"
  >
    <!-- 여행 일정 안내 텍스트 -->
    <div class="text-center mb-10">
      <p class="text-sm text-gray-500 mt-2 underline">
        현지 여행 기간<span class="font-bold"
          >(여행지 도착날짜, 여행지 출발날짜)</span
        >으로 입력해주세요.
      </p>
    </div>

    <!-- 달력 컨테이너 -->
    <div class="flex justify-center gap-8">
      <!-- 현재 월 달력 -->
      <div class="w-96">
        <div class="flex items-center justify-between mb-4">
          <button @click="changeMonth(-1)" class="text-lg font-bold px-4">
            ◀
          </button>
          <span class="text-lg font-semibold mx-auto">
            {{ getYear(0) }}년 {{ getMonth(0) }}월
          </span>
        </div>

        <div class="grid grid-cols-7 text-center mb-2">
          <div v-for="day in daysOfWeek" :key="day" class="text-xl">
            {{ day }}
          </div>
        </div>
        <div class="grid grid-cols-7 text-center">
          <div v-for="n in firstDayOfMonth(0)" :key="'blank1-' + n"></div>
          <div
            v-for="day in daysInMonth(0)"
            :key="'day1-' + day"
            class="p-3 m-2 rounded cursor-pointer text-xl aspect-square flex items-center justify-center"
            :class="getDayClass(0, day)"
            @click="handleDateClick(0, day)"
            style="width: 50px; height: 50px"
          >
            {{ day }}
          </div>
        </div>
      </div>

      <!-- 다음 월 달력 -->
      <div class="w-96">
        <div class="flex items-center justify-between mb-4">
          <span class="text-lg font-semibold mx-auto">
            {{ getYear(1) }}년 {{ getMonth(1) }}월
          </span>
          <button @click="changeMonth(1)" class="text-lg font-bold px-4">
            ▶
          </button>
        </div>

        <div class="grid grid-cols-7 text-center mb-2">
          <div v-for="day in daysOfWeek" :key="day" class="text-xl">
            {{ day }}
          </div>
        </div>
        <div class="grid grid-cols-7 text-center">
          <div v-for="n in firstDayOfMonth(1)" :key="'blank2-' + n"></div>
          <div
            v-for="day in daysInMonth(1)"
            :key="'day2-' + day"
            class="p-3 m-2 rounded cursor-pointer text-xl aspect-square flex items-center justify-center"
            :class="getDayClass(1, day)"
            @click="handleDateClick(1, day)"
            style="width: 50px; height: 50px"
          >
            {{ day }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    const today = new Date();
    return {
      month: today.getMonth(),
      year: today.getFullYear(),
      startDate: null,
      endDate: null,
      daysOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    };
  },
  methods: {
    // 표시할 월 계산 (offset: 0=현재월, 1=다음월)
    getMonth(offset) {
      const month = this.month + offset;
      if (month < 0) return 12 + month;
      if (month > 11) return month - 12;
      return month + 1;
    },
    // 표시할 연도 계산
    getYear(offset) {
      return this.year + Math.floor((this.month + offset) / 12);
    },
    // 해당 월의 일수 계산
    daysInMonth(offset) {
      const year = this.getYear(offset);
      const month = this.getMonth(offset) - 1;
      return new Date(year, month + 1, 0).getDate();
    },
    // 해당 월의 첫날 요일 계산
    firstDayOfMonth(offset) {
      const year = this.getYear(offset);
      const month = this.getMonth(offset) - 1;
      return new Date(year, month, 1).getDay();
    },
    // 날짜 선택 처리
    handleDateClick(monthOffset, day) {
      const selected = new Date(
        this.getYear(monthOffset),
        this.getMonth(monthOffset) - 1,
        day
      );
      const today = new Date().setHours(0, 0, 0, 0);

      // 과거 날짜는 선택 불가
      if (selected < today) return;

      // 시작일 설정 또는 초기화
      if (!this.startDate || this.endDate) {
        this.startDate = selected;
        this.endDate = null;
        this.$store.commit("places/setTripDates", {
          startDate: this.startDate,
          endDate: null,
        });
      }
      // 종료일 설정
      else if (selected >= this.startDate) {
        this.endDate = selected;
        this.$store.commit("places/setTripDates", {
          startDate: this.startDate,
          endDate: this.endDate,
        });
      }
      // 선택된 날짜가 시작일보다 이전이면 시작일 재설정
      else {
        this.startDate = selected;
        this.endDate = null;
        this.$store.commit("places/setTripDates", {
          startDate: this.startDate,
          endDate: null,
        });
      }
    },
    // 월 이동
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
    // 두 날짜가 같은지 비교
    isSameDate(a, b) {
      return (
        a &&
        b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
      );
    },
    // 날짜가 선택 범위 내에 있는지 확인
    isInRange(date) {
      return (
        this.startDate &&
        this.endDate &&
        date > this.startDate &&
        date < this.endDate
      );
    },
    // 날짜의 스타일 클래스 계산
    getDayClass(monthOffset, day) {
      const date = new Date(
        this.getYear(monthOffset),
        this.getMonth(monthOffset) - 1,
        day
      );
      const today = new Date().setHours(0, 0, 0, 0);
      const isPast = date < today;
      const weekday = date.getDay();
      const classes = [];

      if (isPast) {
        classes.push("text-gray-300", "pointer-events-none");
      } else {
        if (
          this.isSameDate(date, this.startDate) ||
          this.isSameDate(date, this.endDate)
        ) {
          classes.push("bg-black", "text-white");
        } else if (this.isInRange(date)) {
          classes.push("bg-gray-300", "text-black");
        } else {
          if (weekday === 0) classes.push("text-red-500");
          else if (weekday === 6) classes.push("text-blue-800");
          else classes.push("text-gray-700");
        }
      }

      return classes.join(" ");
    },
  },
};
</script>

<style scoped>
/* 팝업 크기 고정 */
div.relative {
  width: 800px;
  max-width: 800px;
  height: auto;
}

/* 정사각형 날짜 영역 */
.aspect-square {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
