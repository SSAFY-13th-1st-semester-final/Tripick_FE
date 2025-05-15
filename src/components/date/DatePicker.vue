<template>
  <div class="relative w-full max-w-3xl p-4 bg-white">
    <!-- 1. 상단 지역명 표시 -->
    <h1 class="text-xl font-bold mb-2">{{ selectedRegion || '지역 미선택' }}</h1>

    <!-- 2. 출발일-도착일 표시 -->
    <h2 class="text-lg font-semibold mb-4">
      {{ formattedStart || '출발일 미선택' }} - {{ formattedEnd || '도착일 미선택' }}
    </h2>

    <!-- 3. 여행 시간 상세 설정 토글 -->
    <div
      class="flex items-center justify-between border-b pb-2 cursor-pointer"
      @click="toggleTimeSettings"
    >
      <span class="text-sm font-medium">여행 시간 상세 설정</span>
      <div class="flex items-center">
        <span class="text-blue-500 text-xs font-medium mr-2">
          총 {{ totalDuration.hours }}시간 {{ totalDuration.minutes }}분
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          :class="{ 'transform rotate-180': showTimeSettings }"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>

    <!-- 4. 시간 상세 설정 -->
    <div
      v-if="showTimeSettings && tripDates.startDate && tripDates.endDate"
      class="mt-4"
    >
      <p class="text-xs text-gray-500 mb-4 leading-relaxed">
        여행 기간과 일정 시간을 시차를 고려해 현지시간으로 설정하세요.<br />
        기본 일정 시간은 <b>오전 10시부터 오후 10시까지 총 12시간</b>입니다.
      </p>

      <!-- 5. 날짜별 설정 -->
      <div
        v-for="index in tripDates.dayCount"
        :key="index"
        class="mb-3"
      >
        <div class="flex-grow">
          <StayTimeEditor
            :stayTime="timeSettings[index - 1]"
            :dateInfo="getDayInfo(index - 1)"
            @save="updated => saveTimeSettings(index - 1, updated)"
          />
        </div>
      </div>

      <!-- 6. 완료 버튼 -->
      <button
        class="w-full text-sm px-4 py-4 mt-6 bg-black text-white rounded hover:bg-gray-800"
        @click="completeTimeSettings"
      >
        시간 설정 완료
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import StayTimeEditor from '@/components/date/StayTimeEditor.vue';

export default {
  name: "DatePicker",
  components: {
    StayTimeEditor
  },
  data() {
    return {
      showTimeSettings: false,
    };
  },
  computed: {
    ...mapGetters('places', [
      'getTripDates',
      'getSelectedRegion',
      'getTimeSettings'
    ]),
    tripDates() {
      return this.getTripDates;
    },
    selectedRegion() {
      return this.getSelectedRegion;
    },
    timeSettings() {
      return this.getTimeSettings;
    },
    formattedStart() {
      return this.tripDates.startDate ? this.formatDate(this.tripDates.startDate) : null;
    },
    formattedEnd() {
      return this.tripDates.endDate ? this.formatDate(this.tripDates.endDate) : null;
    },
    totalDuration() {
      let totalMinutes = 0;
      this.timeSettings.forEach(setting => {
        totalMinutes += (setting.hours * 60) + setting.minutes;
      });
      return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60
      };
    }
  },
  methods: {
    ...mapActions('places', [
      'initializeTimeSettings',
      'updateOneTimeSetting'
    ]),
    ...mapMutations('places', [
      'setTimeSettings'
    ]),

    formatDate(date) {
      const d = new Date(date);
      return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
    },

    getDayInfo(index) {
      if (!this.tripDates.startDate) return '';
      const date = new Date(this.tripDates.startDate);
      date.setDate(date.getDate() + index);
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
    },

    toggleTimeSettings() {
      this.showTimeSettings = !this.showTimeSettings;
    },

    saveTimeSettings(index, updated) {
      this.updateOneTimeSetting({
        index,
        hours: updated.hours,
        minutes: updated.minutes
      });
      console.log(`${index + 1}일차 시간 설정 저장:`, updated);
    },

    completeTimeSettings() {
      this.$emit("complete-times", this.timeSettings);
      this.showTimeSettings = false;
    }
  },
  watch: {
    'tripDates.dayCount': {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.initializeTimeSettings(newVal);
        }
      }
    }
  },
  created() {
    if (this.tripDates.dayCount) {
      this.initializeTimeSettings(this.tripDates.dayCount);
    }
  }
};
</script>
