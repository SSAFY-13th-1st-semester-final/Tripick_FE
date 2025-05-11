<template>
  <div class="flex h-screen">
    <!-- 좌측 영역 -->
    <div class="w-2/5 flex border-r border-gray-300">
      <!-- 스텝 탭 -->
      <div class="w-24 flex flex-col justify-between items-center bg-white pt-4 pb-4 relative">
        <div class="flex flex-col gap-2">
          <div
            v-for="step in steps"
            :key="step.id"
            @click="currentStep = step.id"
            :class="[
              'w-20 h-20 text-center flex flex-col justify-center items-center text-xs font-medium rounded transition cursor-pointer',
              currentStep === step.id ? 'text-gray-800' : 'text-gray-400'
            ]"
          >
            <span class="font-bold">Step{{ step.id }}</span>
            <span>{{ step.label }}</span>
          </div>
        </div>

        <div class="absolute bottom-4">
          <button
            class="w-20 h-20 bg-gray-300 text-white text-xs font-semibold rounded transition hover:bg-gray-500"
          >
            생성
          </button>
        </div>
      </div>

      <!-- 스텝 내용 -->
      <div class="flex-grow p-4 overflow-y-auto">
        <div v-if="currentStep === 1">
          <!-- 날짜 선택 버튼을 누르면 CalendarPopup이 활성화됨 -->
          <DatePicker 
            @toggle-calendar="toggleCalendar" 
            @date-select="onDateSelect" 
            :startDate="selectedStartDate" 
            :endDate="selectedEndDate" 
          />
        </div>
        <div v-else-if="currentStep === 2">
          <p>장소 검색 및 선택 UI를 여기에 구현하세요.</p>
        </div>
        <div v-else-if="currentStep === 3">
          <p>숙소 정보를 선택하거나 검색할 수 있게 하세요.</p>
        </div>
      </div>
    </div>

    <!-- 지도 영역 -->
    <div id="map" class="w-full h-full"></div>

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
import DatePicker from '@/components/DatePicker.vue';
import CalendarPopup from '@/components/CalendarPopup.vue';

export default {
  name: "MapView",
  components: {
    DatePicker,
    CalendarPopup,
  },
  data() {
    return {
      map: null,
      currentStep: 1,
      steps: [
        { id: 1, label: "날짜 확인" },
        { id: 2, label: "장소 선택" },
        { id: 3, label: "숙소 선택" },
      ],
      showCalendar: false,  // 팝업을 띄울지 여부
      selectedStartDate: null, // 선택된 시작일
      selectedEndDate: null,   // 선택된 종료일
    };
  },
  mounted() {
    if (window.kakao && window.kakao.maps) {
      this.loadMap();
    } else {
      this.loadScript();
    }
  },
  methods: {
    loadScript() {
      const script = document.createElement("script");
      script.src =
        "//dapi.kakao.com/v2/maps/sdk.js?appkey=e275d3ecdc79f7233649e9ee24d2e982&autoload=false";
      script.onload = () => window.kakao.maps.load(this.loadMap);
      document.head.appendChild(script);
    },
    loadMap() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.initMap(lat, lng);
        },
        () => {
          this.initMap(33.450701, 126.570667);
        }
      );
    },
    initMap(lat, lng) {
      const container = document.getElementById("map");
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3,
      };
      this.map = new window.kakao.maps.Map(container, options);
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
      });
      marker.setMap(this.map);
    },
    toggleCalendar() {
      this.showCalendar = !this.showCalendar;  // 팝업 열기 / 닫기
    },
    onDateSelect({ start, end }) {
      this.selectedStartDate = start;
      this.selectedEndDate = end;
      console.log("선택된 날짜 범위:", start, end);
    },
    handleCalendarConfirm(dates) {
      console.log("확정된 날짜:", dates);
      this.selectedStartDate = dates.startDate;
      this.selectedEndDate = dates.endDate;
      this.showCalendar = false;  // 팝업 닫기
      // 선택된 날짜를 다른 컴포넌트로 전달하려면 여기에서 이벤트를 발생시킬 수 있습니다.
      this.$emit("update-dates", {
        startDate: this.selectedStartDate,
        endDate: this.selectedEndDate,
      });
    },
  },
};
</script>

<style scoped>
#map {
  width: 100%;
}
</style>
