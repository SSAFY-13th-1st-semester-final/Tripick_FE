<template>
  <div
    class="flex items-center justify-between border rounded px-4 py-3 text-sm text-black"
  >
    <!-- 일자 -->
    <div class="w-24 text-left">
      <div class="text-xs text-gray-500">일자</div>
      <div class="text-base font-bold">{{ displayDate }}</div>
    </div>

    <!-- 시작시간 -->
    <div class="flex flex-col items-center">
      <div class="text-xs text-gray-500">시작시간</div>
      <input
        type="time"
        v-model="startTimeStr"
        @input="onTimeChange"
        class="text-base font-bold"
      />
    </div>

    <!-- 화살표 -->
    <div class="text-gray-400 text-xl">→</div>

    <!-- 종료시간 -->
    <div class="flex flex-col items-center">
      <div class="text-xs text-gray-500">종료시간</div>
      <input
        type="time"
        v-model="endTimeStr"
        @input="onTimeChange"
        class="text-base font-bold"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "StayTimeEditor",
  props: {
    stayTime: {
      type: Object,
      required: true,
    },
    dateInfo: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      startTimeStr: this.toTimeString(
        this.stayTime.startHours ?? 10,
        this.stayTime.startMinutes ?? 0
      ),
      endTimeStr: this.toTimeString(
        this.stayTime.endHours ?? 22,
        this.stayTime.endMinutes ?? 0
      ),
    };
  },
  computed: {
    displayDate() {
      return this.dateInfo;
    },
  },
  methods: {
    toTimeString(hours, minutes) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    },
    parseTimeString(timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      return { hours: h, minutes: m };
    },
    onTimeChange() {
      const start = this.parseTimeString(this.startTimeStr);
      const end = this.parseTimeString(this.endTimeStr);

      // 종료시간 - 시작시간 계산 (분 단위)
      let diffMinutes =
        end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
      if (diffMinutes < 0) diffMinutes = 0; // 음수 방지

      // 시, 분 나누기
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      // Vuex에 보낼 때는 차이 시간만 보냄
      this.$emit("save", { hours, minutes });
    },
  },
});
</script>
