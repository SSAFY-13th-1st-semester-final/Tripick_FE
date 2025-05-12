<template>
  <div class="flex h-screen relative">
    <!-- 스텝 탭 + 생성 버튼 -->
    <div class="w-24 flex flex-col justify-between items-center border-r border-gray-300 bg-white">
      <div class="pt-4 flex flex-col gap-2">
        <div
          v-for="step in steps"
          :key="step.id"
          @click="currentStep = step.id"
          :class="[
            'w-16 h-16 text-center flex flex-col justify-center items-center text-xs font-medium rounded transition cursor-pointer',
            currentStep === step.id ? 'text-gray-800' : 'text-gray-400'
          ]"
        >
          <span class="font-bold">Step{{ step.id }}</span>
          <span>{{ step.label }}</span>
        </div>
      </div>
      <button class="mb-4 w-16 h-16 bg-gray-300 text-white text-xs font-semibold rounded hover:bg-gray-500 transition">
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
      <div v-else-if="currentStep === 2">
        <PlaceSearch
          :scrollTarget="scrollContainer"
          @add-place="addPlaceToMap"
          @clear-markers="clearAllMarkers"
        />
      </div>
      <div v-else-if="currentStep === 3">
        <p>숙소 정보를 선택하거나 검색할 수 있게 하세요.</p>
      </div>
    </div>

    <!-- 사이드 패널 -->
    <transition name="slide-width">
      <div
        v-if="currentStep === 2 || currentStep === 3"
        :style="{ width: isSidePanelExpanded ? '25%' : '60px' }"
        class="relative transition-all duration-300 ease-in-out flex-shrink-0 overflow-visible"
      >
        <div v-if="!isSidePanelExpanded"
          class="absolute top-4 left-0 right-0 flex flex-col items-center gap-3 z-10">
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
          @click="isSidePanelExpanded = !isSidePanelExpanded"
          class="absolute -right-6 top-1/2 transform -translate-y-1/2 z-50 w-6 h-10 bg-white flex items-center justify-center text-sm"
          style="border-top-right-radius: 10px; border-bottom-right-radius: 10px;"
        >
          {{ isSidePanelExpanded ? '❮' : '❯' }}
        </button>

        <div v-show="isSidePanelExpanded" class="p-4">
          <div v-if="currentStep === 2">
            <div class="flex items-center gap-2 mb-4">
              <div class="text-3xl font-semibold">
                <span>{{ selectedPlaces.length }}</span>
              </div>
              <div class="text-xs text-gray-500 pb-1">
                <span>{{ formattedTotalStayTime }}</span>
              </div>
            </div>
            <div v-if="selectedPlaces.length" class="space-y-2">
              <div
                v-for="(place, index) in selectedPlaces"
                :key="'card-' + index"
                class="flex items-center mb-4"
              >
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-full bg-pink-400 text-white text-xs font-bold flex-shrink-0 ml-1 mr-2"
                >
                  {{ index + 1 }}
                </div>

                <transition name="fade">
                  <div
                    v-show="isSidePanelExpanded"
                    class="flex justify-between items-center flex-grow bg-white text-sm border rounded-lg px-3 py-4 shadow-sm"
                  >
                    <!-- 비편집 모드 -->
                    <div v-if="!place.isEditingStayTime" class="flex-grow pr-2">
                      <div class="flex justify-between items-center">
                        <div>
                          <div class="text-base font-bold">{{ place.placeName }}</div>
                          <div class="text-xs text-sky-500/70">
                            {{ place.categoryGroupName }} &nbsp;
                            <span class="text-gray-500">{{ place.addressName }}</span>
                          </div>
                        </div>
                        
                        <!-- 시간과 삭제 버튼을 수평 정렬 -->
                        <div class="flex items-center ">
                          <div class="time-sum-label cursor-pointer" @click="toggleStayTimeEdit(place)">
                            {{ formattedStayTime(place.stayTime) }}
                          </div>
                          
                          <!-- 삭제 버튼 -->
                          <button @click="handleRemovePlace(place)"
                            class="text-gray-600 w-10 flex items-center justify-center rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                              stroke="currentColor" class="w-4 h-4">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7H5M10 7V3M14 7V3M3 7H21L19.2 20.4a2 2 0 0 1-2 1.6H6a2 2 0 0 1-2-1.6L3 7Z" />
                            </svg>
                          </button>

                        </div>
                      </div>
                    </div>

                    <!-- 편집 모드 -->
                    <div v-else class="flex-grow">
                      <div class="flex justify-between items-center gap-4">
                        <!-- 머무르는 시간 설정 텍스트 -->
                        <div class="text-xs font-semibold">머무르는 시간 설정</div>

                        <!-- 시간 입력 영역 -->
                        <div class="flex items-center gap-2 text-sm">
                          <input type="number" v-model.number="place.stayTime.hours" min="0" max="23"
                            class="w-12 border-0 text-center text-lg font-semibold focus:ring-0" /> 
                          <span class="text-xs">시간</span>
                          <input type="number" v-model.number="place.stayTime.minutes" min="0" max="59"
                            class="w-12 border-0 text-center text-lg font-semibold focus:ring-0" /> 
                          <span class="text-xs">분</span>
                        </div>
                        
                        <!-- 완료 버튼 -->
                        <button @click="saveStayTimeEdit(place)"
                          class="text-blue-600 w-10 flex items-center justify-center rounded"
                        >
                          완료
                        </button>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
            <div v-else class="text-gray-400">선택된 장소가 없습니다.</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 지도 -->
    <div class="flex-grow h-full relative z-0" id="map"></div>

    <!-- 캘린더 팝업 -->
    <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <CalendarPopup @confirm="handleCalendarConfirm" @cancel="toggleCalendar" />
    </div>
  </div>
</template>

<script>
import DatePicker from '@/components/date/DatePicker.vue';
import CalendarPopup from '@/components/date/CalendarPopup.vue';
import PlaceSearch from '@/components/place/PlaceSearch.vue';

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
      selectedPlaces: [],
      isSidePanelExpanded: true,
    };
  },
  computed: {
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
      this.infoWindow = new window.kakao.maps.InfoWindow({ zIndex: 3 });
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
      const isPlaceExists = this.selectedPlaces.some(p => p.placeName === place.placeName);
      if (isPlaceExists) {
        alert('이미 추가된 장소입니다.');
        return;
      }

      const x = place.x;
      const y = place.y;
      if (!x || !y) return;

      const latLng = new window.kakao.maps.LatLng(y, x);
      const marker = new window.kakao.maps.Marker({ position: latLng, title: place.placeName });
      marker.setMap(this.map);
      this.markers.push(marker);

      const content = `
        <div style="padding:15px; font-size:16px;">
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
      place.stayTime = { hours: 2, minutes: 0 };
      place.isEditingStayTime = false;
      this.selectedPlaces.push(place);
    },
    recalculateMapBounds() {
      if (!this.markers.length) return;
      const bounds = new window.kakao.maps.LatLngBounds();
      this.markers.forEach(marker => bounds.extend(marker.getPosition()));
      this.map.setBounds(bounds);
    },
    clearAllMarkers() {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
      this.infoWindow.close();
    },
    handleRemovePlace(place) {
      this.selectedPlaces = this.selectedPlaces.filter(p => p !== place);
      const markerIndex = this.markers.findIndex(marker => marker.getTitle() === place.placeName);
      if (markerIndex !== -1) {
        this.markers[markerIndex].setMap(null);
        this.markers.splice(markerIndex, 1);
      }
      this.recalculateMapBounds();
    },
    toggleStayTimeEdit(place) {
      this.selectedPlaces.forEach(p => p.isEditingStayTime = false);
      place.isEditingStayTime = true;
    },
    saveStayTimeEdit(place) {
      place.isEditingStayTime = false;
    },
    formattedStayTime(stayTime) {
      return `${stayTime.hours}시간 ${stayTime.minutes}분`;
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
