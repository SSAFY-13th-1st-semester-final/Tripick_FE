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
          <button class="w-20 h-20 bg-gray-300 text-white text-xs font-semibold rounded transition hover:bg-gray-500">
            생성
          </button>
        </div>
      </div>

      <!-- 스텝 내용 -->
      <div class="flex-grow p-4 overflow-y-auto" ref="scrollContainer">
        <div v-if="currentStep === 1">
          <DatePicker 
            @toggle-calendar="toggleCalendar" 
            @date-select="onDateSelect" 
            :startDate="selectedStartDate" 
            :endDate="selectedEndDate" 
          />
        </div>
        <div v-else-if="currentStep === 2">
          <PlaceSearch
            :scrollTarget="scrollContainer"
            @update-place-results="handleUpdatePlaceResults"
            @clear-markers="clearAllMarkers"
          />
        </div>
        <div v-else-if="currentStep === 3">
          <p>숙소 정보를 선택하거나 검색할 수 있게 하세요.</p>
        </div>
      </div>
    </div>

    <!-- 지도 영역 -->
    <div id="map" class="w-full h-full"></div>

    <!-- 캘린더 팝업 -->
    <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <CalendarPopup @confirm="handleCalendarConfirm" @cancel="toggleCalendar" />
    </div>
  </div>
</template>

<script>
import DatePicker from '@/components/DatePicker.vue';
import CalendarPopup from '@/components/CalendarPopup.vue';
import PlaceSearch from '@/components/PlaceSearch.vue';

export default {
  name: "MapView",
  components: {
    DatePicker,
    CalendarPopup,
    PlaceSearch,
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
      showCalendar: false,
      selectedStartDate: null,
      selectedEndDate: null,
      placeResults: [],
      markers: [], // ✅ 마커 저장용 배열 추가
    };
  },
  computed: {
    scrollContainer() {
      return this.$refs.scrollContainer;
    }
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
      script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=e275d3ecdc79f7233649e9ee24d2e982&autoload=false";
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
    handleUpdatePlaceResults(results) {
      this.placeResults = results;
      results.forEach(place => {
        this.addPlaceToMap(place);
      });
    },
    addPlaceToMap(place) {
      const x = place.x;
      const y = place.y;

      if (!x || !y) return;

      const latLng = new window.kakao.maps.LatLng(y, x);
      const marker = new window.kakao.maps.Marker({
        position: latLng,
        title: place.placeName,
      });

      marker.setMap(this.map);
      this.markers.push(marker); // ✅ 마커 저장
      this.map.setCenter(latLng);
    },
    clearAllMarkers() {
      this.markers.forEach(marker => marker.setMap(null)); // ✅ 마커 제거
      this.markers = [];
    },
  },
};
</script>

<style scoped>
/* 스타일을 추가하세요 */
</style>
