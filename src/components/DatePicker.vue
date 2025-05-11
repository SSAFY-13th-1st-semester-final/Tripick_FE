<template>
  <div class="relative w-full max-w-3xl p-4 bg-white">
    <div class="flex items-center gap-2 mb-4">
        <h2 class="text-lg font-semibold">
            {{ formattedStart || '출발일 미선택' }} - {{ formattedEnd || '도착일 미선택' }}
        </h2>
        <button @click="$emit('toggle-calendar')" class="p-1">
            <img src="@/assets/icons/icon_calendar.svg" alt="달력 아이콘" class="w-4 h-4 mb-1" />
        </button>
    </div>
    <!-- 시간 상세 설정 영역 -->
    <div v-if="startDate && endDate">
      <!-- 1. 요약 라인 -->
      <div class="flex items-center justify-between text-sm font-medium mb-2">
        <span>여행 시간 상세 설정</span>
        <span class="text-gray-500 text-xs">총 {{ totalDuration.hours }}시간 {{ totalDuration.minutes }}분</span>
      </div>

      <!-- 2. 안내 문구 -->
      <p class="text-xs text-gray-500 mb-4 leading-relaxed">
        여행 기간과 일정 시간을 시차를 고려해 현지시간으로 설정하세요.<br />
        기본 일정 시간은 <b>오전 10시부터 오후 10시까지 총 12시간</b>입니다.
      </p>

      <!-- 3. 날짜별 시간 설정 -->
      <div
        v-for="(date, index) in travelDates"
        :key="index"
        class="mb-3 border border-gray-300 rounded-lg p-2 text-sm font-bold"
      >
        <div class="flex gap-x-2">
          <div class="flex flex-col w-[30%]">
            <span class="text-gray-500 text-[11px] mb-1">일자</span>
            <span class="text-sm p-1 text-gray-700">{{ formatShortDate(date) }}</span>
          </div>

          <div class="flex flex-col w-[35%]">
            <span class="text-gray-500 text-[11px] mb-1">시작시간</span>
            <input
              type="time"
              v-model="timeSettings[index].start"
              class="text-sm p-1 rounded"
            />
          </div>

          <div class="flex flex-col w-[35%]">
            <span class="text-gray-500 text-[11px] mb-1">종료시간</span>
            <input
              type="time"
              v-model="timeSettings[index].end"
              class="text-sm p-1 rounded"
            />
          </div>
        </div>
      </div>

      <!-- 4. 완료 버튼 -->
      <div>
        <button
          class="w-full text-sm px-4 py-4 mt-4 bg-black text-white rounded hover:bg-gray-800"
          @click="emitComplete"
        >
          시간 설정 완료
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DatePicker",
  props: {
    startDate: {
      type: [String, Date],
      default: null,
    },
    endDate: {
      type: [String, Date],
      default: null,
    },
  },
  data() {
    return {
      timeSettings: [],
    };
  },
  computed: {
    formattedStart() {
      return this.startDate ? this.formatDate(this.startDate) : null;
    },
    formattedEnd() {
      return this.endDate ? this.formatDate(this.endDate) : null;
    },
    travelDates() {
      const dates = [];
      if (!this.startDate || !this.endDate) return dates;
      const current = new Date(this.startDate);
      while (current <= new Date(this.endDate)) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      // 초기값 설정
      if (this.timeSettings.length !== dates.length) {
        this.timeSettings = dates.map(() => ({
          start: "10:00",
          end: "22:00",
        }));
      }
      return dates;
    },
    totalDuration() {
      let minutes = 0;
      this.timeSettings.forEach(({ start, end }) => {
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        minutes += (eh * 60 + em) - (sh * 60 + sm);
      });
      return {
        hours: Math.floor(minutes / 60),
        minutes: minutes % 60,
      };
    },
  },
  methods: {
    formatDate(date) {
      const d = new Date(date);
      return `${d.getFullYear()}.${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
    },
    formatShortDate(date) {
      const d = new Date(date);
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      return `${d.getMonth() + 1}/${d.getDate()} ${weekdays[d.getDay()]}`;
    },
    emitComplete() {
      this.$emit("complete-times", this.timeSettings);
    },
  },
};
</script>
