<template>
  <div class="flex h-screen">
    <!-- 스텝 탭 + 생성 버튼 -->
    <div
      class="w-20 flex flex-col justify-between items-center border-r border-gray-300 bg-white"
    >
      <div class="pt-4 flex flex-col gap-2">
        <div
          v-for="step in steps"
          :key="step.id"
          @click="currentStep = step.id"
          :class="[
            'w-16 h-16 text-center flex flex-col justify-center items-center text-xs font-medium rounded transition cursor-pointer',
            currentStep === step.id ? 'text-gray-800' : 'text-gray-400',
          ]"
        >
          <span class="font-bold">Step{{ step.id }}</span>
          <span>{{ step.label }}</span>
        </div>
      </div>
      <button
        class="mb-4 w-16 h-16 bg-gray-300 text-white text-xs font-semibold rounded hover:bg-gray-500 transition"
      >
        생성
      </button>
    </div>

    <!-- 스텝 상세 영역 -->
    <div class="w-[20%] overflow-y-auto p-4" ref="scrollContainer">
      <div v-if="currentStep === 1">
        <DatePicker
          @toggle-calendar="toggleCalendar"
          @date-select="onDateSelect"
          :startDate="selectedStartDate"
          :endDate="selectedEndDate"
        />
      </div>
      <div v-if="currentStep === 2">
        <PlaceSearch :scrollTarget="scrollContainer" />
      </div>
      <div v-else-if="currentStep === 3">
        <PlaceSearch :scrollTarget="scrollContainer" />
      </div>
    </div>

    <!-- 사이드 패널 -->
    <transition name="slide-width">
      <div
        v-if="currentStep === 2 || currentStep === 3"
        class="relative transition-all duration-300 ease-in-out flex-shrink-0 overflow-visible"
        :class="isSidePanelExpanded ? 'w-[20%]' : 'w-[60px]'"
      >
        <div
          v-if="!isSidePanelExpandedProxy"
          class="absolute top-4 left-0 right-0 flex flex-col items-center gap-3 z-10"
        >
          <div class="text-3xl font-semibold">
            {{ selectedPlaces.length }}
          </div>
          <div
            v-for="(place, index) in selectedPlaces"
            :key="'index-only-' + index"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-pink-400 text-white text-xs font-bold mx-auto"
          >
            {{ index + 1 }}
          </div>
        </div>

        <button
          @click="toggleSidePanel"
          class="absolute -right-6 top-1/2 transform -translate-y-1/2 z-50 w-6 h-10 bg-white flex items-center justify-center text-sm"
          style="
            border-top-right-radius: 10px;
            border-bottom-right-radius: 10px;
          "
        >
          {{ isSidePanelExpanded ? "❮" : "❯" }}
        </button>

        <div v-show="isSidePanelExpandedProxy" class="p-4">
          <div v-if="currentStep === 2">
            <AddPlaceList :isSidePanelExpanded="isSidePanelExpandedProxy" />
          </div>
          <div v-if="currentStep == 3">
            <AddPlaceList :isSidePanelExpanded="isSidePanelExpandedProxy" />
          </div>
        </div>
      </div>
    </transition>

    <!-- 지도 영역: 분리된 컴포넌트 사용 -->
    <div class="flex-grow h-full relative z-0">
      <MapContainer :side-panel-expanded="isSidePanelExpandedProxy" />
    </div>

    <!-- 캘린더 팝업 -->
    <div
      v-if="showCalendar"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <CalendarPopup
        @confirm="handleCalendarConfirm"
        @cancel="toggleCalendar"
      />
    </div>
  </div>
</template>

<script>
import DatePicker from "@/components/date/DatePicker.vue";
import CalendarPopup from "@/components/date/CalendarPopup.vue";
import PlaceSearch from "@/components/place/PlaceSearch.vue";
import AddPlaceList from "@/components/place/AddPlaceList.vue";
import MapContainer from "@/components/place/MapContainer.vue";

import { mapState } from "vuex";

export default {
  name: "MapView",
  components: {
    DatePicker,
    CalendarPopup,
    PlaceSearch,
    AddPlaceList,
    MapContainer,
  },
  data() {
    return {
      currentStep: 1,
      steps: [
        { id: 1, label: "날짜 확인" },
        { id: 2, label: "장소 선택" },
        { id: 3, label: "숙소 선택" },
      ],
      showCalendar: false,
      selectedStartDate: null,
      selectedEndDate: null,
      isSidePanelExpanded: true,
    };
  },
  computed: {
    ...mapState("places", ["selectedPlaces"]),
    isSidePanelExpandedProxy() {
      return this.isSidePanelExpanded; // ✅ data를 computed로 proxy
    },
    scrollContainer() {
      return this.$refs.scrollContainer;
    },
    formattedTotalStayTime() {
      const totalMinutes = this.selectedPlaces.reduce((total, place) => {
        return total + place.stayTime.hours * 60 + place.stayTime.minutes;
      }, 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}시간 ${minutes}분`;
    },
  },
  methods: {
    toggleCalendar() {
      this.showCalendar = !this.showCalendar;
    },
    onDateSelect({ start, end }) {
      this.selectedStartDate = start;
      this.selectedEndDate = end;
    },
    handleCalendarConfirm(dates) {
      this.selectedStartDate = dates.startDate;
      this.selectedEndDate = dates.endDate;
      this.showCalendar = false;
      this.$emit("update-dates", {
        startDate: this.selectedStartDate,
        endDate: this.selectedEndDate,
      });
    },
    toggleSidePanel() {
      this.isSidePanelExpanded = !this.isSidePanelExpanded;

      this.$nextTick(() => {
        this.$refs.mapRef?.triggerMapResize?.();
      });
    },
  },
};
</script>

<style scoped>
.slide-width-enter-active,
.slide-width-leave-active {
  transition: max-width 1s ease;
}
.slide-width-enter-from,
.slide-width-leave-to {
  max-width: 0;
}
.slide-width-enter-to,
.slide-width-leave-from {
  max-width: 100%;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}
.time-sum-label {
  background-color: #f0f0f0;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 12px;
}
</style>
