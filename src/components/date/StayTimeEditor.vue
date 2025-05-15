<template>
  <div class="flex items-center justify-between border rounded px-4 py-3 text-sm text-black">
    <!-- 일자 -->
    <div class="w-24 text-left">
      <div class="text-xs text-gray-500">일자</div>
      <div class="text-base font-bold">{{ displayDate }}</div>
    </div>

    <!-- 시작시간 -->
    <div class="flex flex-col items-center">
      <div class="text-xs text-gray-500">시작시간</div>
      <div class="flex items-center gap-1 font-bold text-base">
        {{ formatTime(startTime.hours, startTime.minutes) }}
        <ClockIcon />
      </div>
    </div>

    <!-- 화살표 -->
    <div class="text-gray-400 text-xl">→</div>

    <!-- 종료시간 -->
    <div class="flex flex-col items-center">
      <div class="text-xs text-gray-500">종료시간</div>
      <div class="flex items-center gap-1 font-bold text-base">
        {{ formatTime(endTime.hours, endTime.minutes) }}
        <ClockIcon />
      </div>
    </div>

    <!-- 완료 버튼 -->
    <button
      @click="emitSave"
      class="ml-4 text-blue-600 text-sm font-semibold hover:underline"
    >
      완료
    </button>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

// 간단한 시계 아이콘 (inline SVG)
const ClockIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
    </svg>
  `
};

export default defineComponent({
  name: 'StayTimeEditor',
  components: {
    ClockIcon
  },
  props: {
    stayTime: {
      type: Object,
      required: true,
    },
    dateInfo: {
      // 예: "5/15목"
      type: String,
      required: true
    }
  },
  data() {
    return {
      startTime: {
        hours: this.stayTime.startHours ?? 10,
        minutes: this.stayTime.startMinutes ?? 0,
      },
      endTime: {
        hours: this.stayTime.endHours ?? 22,
        minutes: this.stayTime.endMinutes ?? 0,
      }
    };
  },
  computed: {
    displayDate() {
      return this.dateInfo;
    }
  },
  methods: {
    formatTime(hours, minutes) {
      const h = parseInt(hours);
      const m = minutes.toString().padStart(2, '0');
      const suffix = h < 12 ? '오전' : '오후';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${suffix} ${hour12}:${m}`;
    },
    emitSave() {
      this.$emit('save', {
        startHours: this.startTime.hours,
        startMinutes: this.startTime.minutes,
        endHours: this.endTime.hours,
        endMinutes: this.endTime.minutes,
      });
    }
  }
});
</script>
