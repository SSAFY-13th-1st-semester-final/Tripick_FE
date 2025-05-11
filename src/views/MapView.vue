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
      placeResults: []  // 장소 검색 결과 데이터를 저장할 배열
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
      this.showCalendar = !this.showCalendar;
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
      this.showCalendar = false;
      this.$emit("update-dates", {
        startDate: this.selectedStartDate,
        endDate: this.selectedEndDate,
      });
    },

    // 자식 컴포넌트로부터 받은 장소 검색 결과 처리
    handleUpdatePlaceResults(results) {
      // 부모에서 받은 장소 결과를 저장
      this.placeResults = results;
      console.log('받은 장소 검색 결과:', this.placeResults);

      // 필요한 경우, 지도에 장소들을 마커로 표시할 수도 있음
      this.placeResults.forEach(place => {
        this.addPlaceToMap(place);
      });
    },

    addPlaceToMap(place) {
      // TM 좌표 (x, y)
      const x = place.x;
      const y = place.y;

      if (!x || !y) {
        console.error('x 또는 y 좌표가 없습니다:', place);
        return;
      }

      // 카카오맵의 TM 좌표를 위도, 경도로 변환
      const latLng = new window.kakao.maps.LatLng(y, x); // 위도(y), 경도(x)
      
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: latLng,
        title: place.placeName, // 장소 이름
      });

      // 지도에 마커 추가
      marker.setMap(this.map);

      // 마커 위치로 지도 중심 이동 (필요시)
      this.map.setCenter(latLng);
    }
  },
};
</script>

<style scoped>
/* 스타일을 추가하세요 */
</style>
