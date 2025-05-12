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
        <div v-else-if="currentStep === 2" class="flex flex-col gap-4">
          <div class="flex gap-4">
            <!-- 장소 검색 컴포넌트 -->
            <PlaceSearch
              :scrollTarget="scrollContainer"
              @add-place="addPlaceToMap"
              @clear-markers="clearAllMarkers"
            />

            <!-- 추가된 장소 목록 영역 -->
            <div class="w- p-4">
              <h3 class="text-sm font-semibold mb-2">추가된 장소 목록</h3>
              <div v-if="selectedPlaces.length" class="space-y-2">
                <div
                  v-for="(place, index) in selectedPlaces"
                  :key="index"
                  class="flex justify-between items-stretch border rounded-lg px-3 py-4 shadow-sm bg-white text-sm mb-4"
                >
                  <!-- 장소 정보 -->
                  <div class="flex-grow">
                    <div class="font-semibold">{{ place.placeName }}</div>
                    <div class="text-gray-500">{{ place.addressName }}</div>
                    <div class="text-xs text-gray-400">{{ place.phone }}</div>
                  </div>

                  <!-- 오른쪽: - 버튼 -->
                  <div class="flex items-stretch">
                    <button
                      @click="handleRemovePlace(place)"
                      class="bg-gray-100 hover:bg-gray-200 text-gray-600 w-10 flex items-center justify-center rounded-r"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        class="w-5 h-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-400">선택된 장소가 없습니다.</div>
            </div>
          </div>
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
      markers: [],
      infoWindow: null,
      selectedPlaces: [],  // 추가된 장소 목록 관리
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

      this.infoWindow = new window.kakao.maps.InfoWindow({
        zIndex: 3,
        removable: false,
      });
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
    addPlaceToMap(place) {
      // 이미 목록에 있는지 확인
      const isPlaceExists = this.selectedPlaces.some(p => p.placeName === place.placeName);
      if (isPlaceExists) {
        alert('이미 추가된 장소입니다.');
        return;  // 이미 있으면 추가하지 않음
      }

      const x = place.x;
      const y = place.y;
      if (!x || !y) return;

      const latLng = new window.kakao.maps.LatLng(y, x);

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: latLng,
        title: place.placeName,
      });

      marker.setMap(this.map);
      this.markers.push(marker);

      // 정보창 내용
      const content = `
        <div style="padding:15px; font-size:16px; width:230px; height:auto; white-space: normal; word-break: break-word;">
          <strong style="font-size:18px;">${place.placeName}</strong><br/>
          <span>${place.addressName || ''}</span><br/>
          <span>${place.phone || ''}</span>
        </div>
      `;

      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
      });

      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        this.infoWindow.close();
      });

      this.recalculateMapBounds();

      // 새로운 장소 목록에 추가
      this.selectedPlaces.push(place);
    },

    // 지도 범위 재계산 함수
    recalculateMapBounds() {
      if (!this.markers.length) return;

      const bounds = new window.kakao.maps.LatLngBounds();

      this.markers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });

      this.map.setBounds(bounds);
    },
    clearAllMarkers() {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
      this.infoWindow.close();
    },

    handleRemovePlace(place) {
      // 장소 목록에서 제거
      this.selectedPlaces = this.selectedPlaces.filter(p => p !== place);

      // 마커를 찾아서 지도에서 제거
      const markerIndex = this.markers.findIndex(marker => marker.getTitle() === place.placeName);
      if (markerIndex !== -1) {
        const markerToRemove = this.markers[markerIndex];
        markerToRemove.setMap(null); // 지도에서 마커 제거
        this.markers.splice(markerIndex, 1); // 마커 목록에서 제거
      }

      // 지도 범위 재계산
      this.recalculateMapBounds();
    },
  },
};
</script>

<style scoped>
/* 필요에 따라 스타일을 추가할 수 있습니다. */
</style>
