<template>
  <div class="kakao-map-container">
    <div class="map-header" v-if="title">
      <h3>{{ title }}</h3>
    </div>

    <div class="map-wrapper">
      <div ref="mapContainer" class="map-element glass-card"></div>

      <div v-if="isLoading" class="map-loading">
        <div class="loading-spinner"></div>
        <p>지도를 불러오는 중...</p>
      </div>

      <div v-if="hasError" class="map-error glass-card">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{{ errorMessage }}</p>
        <button class="glass-btn" @click="retryLoadMap">다시 시도</button>
      </div>
    </div>

    <div v-if="hasPlaces" class="place-list-preview">
      <div
        v-for="(place, index) in displayPlaces"
        :key="place.id || index"
        class="place-item"
        :class="{ active: selectedPlaceIndex === index }"
        @click="focusPlace(index)"
      >
        <div class="place-item-index">{{ index + 1 }}</div>
        <div class="place-item-content">
          <div class="place-item-name">{{ place.placeName }}</div>
          <div class="place-item-address">
            {{ place.roadAddressName || place.addressName }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useTravelStore } from "@/stores/travel";
import { useNotificationStore } from "@/stores/notification";
import kakaoMapService from "@/utils/kakaoMapService";
import regionData from "@/assets/data/regionData.json";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  usePlacesFromStore: {
    type: Boolean,
    default: true,
  },
  places: {
    type: Array,
    default: () => [],
  },
  defaultCenter: {
    type: Object,
    default: () => ({ lat: 37.566826, lng: 126.9786567 }),
  },
  defaultZoom: {
    type: Number,
    default: 5,
  },
  height: {
    type: String,
    default: "400px",
  },
  showAllDays: {
    type: Boolean,
    default: true,
  },
  showRoutes: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["map-ready", "place-focused"]);

const mapContainer = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref("");
const selectedPlaceIndex = ref(-1);
const mapInstance = ref(null);

// routeApiCallCount 변화 감지를 위한 이전 값 저장
const previousRouteApiCallCount = ref(0);
const hasRouteApiCallCountChanged = ref(false);

const travelStore = useTravelStore();
const notificationStore = useNotificationStore();

const {
  currentDayPlaces,
  currentDay,
  itinerary,
  hotels,
  routeData,
  routeApiCallCount,
  hasRouteOptimization,
} = storeToRefs(travelStore);

// 표시할 장소 데이터 계산 (스토어 또는 props 기반)
const displayPlaces = computed(() => {
  if (props.usePlacesFromStore) {
    return currentDayPlaces.value || [];
  }
  return props.places;
});

const hasPlaces = computed(() => {
  return displayPlaces.value.length > 0;
});

// 동적 경로 표시 여부 결정
const shouldShowRoutesNow = computed(() => {
  // props.showRoutes가 false이면 항상 경로 표시 안함
  if (!props.showRoutes) return false;

  // usePlacesFromStore가 false이면 단순 마커만 표시
  if (!props.usePlacesFromStore) return false;

  // routeApiCallCount가 변경되었고, 경로 최적화가 활성화된 경우에만 경로 표시
  return hasRouteApiCallCountChanged.value && hasRouteOptimization.value;
});

// 지역 정보에서 좌표 가져오기
const getRegionCoordinates = (region) => {
  if (!region) return null;

  const provinceName = region.provinceName || region.Name;
  const districtName = region.districtName;

  const province = regionData.provinces.find((p) => p.name === provinceName);
  if (!province) return null;

  // district가 없거나 찾지 못했으면 province 좌표 사용
  if (province.coordinates) {
    return {
      lat: province.coordinates.lat,
      lng: province.coordinates.lng,
    };
  }

  return null;
};

// 카카오맵 초기화 및 설정
const initializeMap = async () => {
  if (!mapContainer.value) return;

  isLoading.value = true;
  hasError.value = false;

  try {
    await kakaoMapService.loadScript();
    mapContainer.value.style.height = props.height;

    // 여행 지역 기반 초기 좌표 설정 (regionData.json 사용)
    const region = travelStore.tripInfo?.region;
    let initialCoord = props.defaultCenter;

    if (region) {
      const regionCoord = getRegionCoordinates(region);
      if (regionCoord) {
        initialCoord = regionCoord;
        travelStore.centerCoord.y = initialCoord.lat;
        travelStore.centerCoord.x = initialCoord.lng;
      }
    }

    const initialCenter = new window.kakao.maps.LatLng(
      initialCoord.lat,
      initialCoord.lng
    );

    mapInstance.value = kakaoMapService.initMap(mapContainer.value, {
      center: initialCenter,
      level: props.defaultZoom,
    });

    kakaoMapService.addMapControls(true, true);

    // 초기 로드 시 routeApiCallCount 저장
    previousRouteApiCallCount.value = routeApiCallCount.value;
    hasRouteApiCallCountChanged.value = false;

    await updateMapDisplay();

    emit("map-ready", mapInstance.value);
  } catch (error) {
    hasError.value = true;
    errorMessage.value = "지도를 불러오는데 실패했습니다.";
    notificationStore.showError("지도 로드 실패");
  } finally {
    isLoading.value = false;
  }
};

// 지도 표시 업데이트 (마커 + 경로)
const updateMapDisplay = async () => {
  if (!mapInstance.value) return;

  try {
    if (props.usePlacesFromStore) {
      if (props.showAllDays) {
        // 전체 일차 표시
        const validItinerary = await addCoordsToItinerary(itinerary.value);
        const validHotels = await addCoordsToHotels(hotels.value);

        kakaoMapService.addTravelItinerary(
          validItinerary,
          validHotels,
          shouldShowRoutesNow.value, // 동적으로 결정된 경로 표시 여부
          routeData.value
        );
      } else {
        // 현재 일차만 표시
        const currentDayItinerary = itinerary.value[currentDay.value]
          ? [itinerary.value[currentDay.value]]
          : [];
        const currentDayHotel = hotels.value[currentDay.value]
          ? [hotels.value[currentDay.value]]
          : [];

        const validItinerary = await addCoordsToItinerary(currentDayItinerary);
        const validHotels = await addCoordsToHotels(currentDayHotel);

        // 현재 일차의 경로 데이터만 전달
        const currentDayRouteData = routeData.value[currentDay.value]
          ? [routeData.value[currentDay.value]]
          : [];

        kakaoMapService.addTravelItinerary(
          validItinerary,
          validHotels,
          shouldShowRoutesNow.value, // 동적으로 결정된 경로 표시 여부
          currentDayRouteData
        );
      }
    } else {
      // props.places 사용 시 (단순 마커만 표시)
      const placesWithCoords = await addCoordsToPlaces(props.places);
      if (placesWithCoords.length > 0) {
        // 단순 마커 표시를 위한 임시 일정 생성
        const tempItinerary = [placesWithCoords];
        kakaoMapService.addTravelItinerary(tempItinerary, [], false, []);
      }
    }
  } catch (error) {
    notificationStore.showError("지도 표시 업데이트 실패");
  }
};

// 여행 일정에 좌표 정보 추가
const addCoordsToItinerary = async (itinerary) => {
  if (!itinerary || itinerary.length === 0) return [];

  const results = await Promise.allSettled(
    itinerary.map(async (dayPlaces) => {
      if (!Array.isArray(dayPlaces)) return [];

      const placesWithCoords = await addCoordsToPlaces(dayPlaces);
      return placesWithCoords;
    })
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
};

// 숙소에 좌표 정보 추가
const addCoordsToHotels = async (hotels) => {
  if (!hotels || hotels.length === 0) return [];

  const results = await Promise.allSettled(
    hotels.map(async (hotel) => {
      if (!hotel) return null;

      if (hotel.y && hotel.x) {
        return hotel;
      }

      try {
        if (hotel.roadAddressName || hotel.addressName) {
          const address = hotel.roadAddressName || hotel.addressName;
          const coord = await kakaoMapService.convertAddressToCoord(address);

          return {
            ...hotel,
            y: coord.lat,
            x: coord.lng,
          };
        }
        return hotel;
      } catch (error) {
        return hotel;
      }
    })
  );

  return results
    .filter((result) => result.status === "fulfilled" && result.value !== null)
    .map((result) => result.value);
};

// 장소 데이터에 좌표 정보 추가
const addCoordsToPlaces = async (places) => {
  if (!places || places.length === 0) return [];

  const results = await Promise.allSettled(
    places.map(async (place) => {
      if (place.y && place.x) {
        return place;
      }

      try {
        if (place.roadAddressName || place.addressName) {
          const address = place.roadAddressName || place.addressName;
          const coord = await kakaoMapService.convertAddressToCoord(address);

          return {
            ...place,
            y: coord.lat,
            x: coord.lng,
          };
        }
        return place;
      } catch (error) {
        return place;
      }
    })
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
};

const focusPlace = (index) => {
  selectedPlaceIndex.value = index;
  kakaoMapService.focusMarker(index);
  emit("place-focused", displayPlaces.value[index]);
};

const retryLoadMap = () => {
  initializeMap();
};

const handleResize = () => {
  if (mapInstance.value) {
    kakaoMapService.resizeMap();
  }
};

onMounted(() => {
  initializeMap();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  kakaoMapService.clearAll();
  window.removeEventListener("resize", handleResize);
});

// routeApiCallCount 변화 감지
watch(
  () => routeApiCallCount.value,
  (newValue, oldValue) => {
    // 값이 실제로 변경되었는지 확인
    if (newValue !== previousRouteApiCallCount.value) {
      hasRouteApiCallCountChanged.value = true;
      previousRouteApiCallCount.value = newValue;

      // 지도가 준비되어 있으면 업데이트
      if (mapInstance.value) {
        updateMapDisplay();
      }
    }
  }
);

// 기존 반응형 데이터 변경 감시 (routeApiCallCount 제외)
watch(
  [() => itinerary.value, () => hotels.value, () => routeData.value],
  () => {
    if (props.usePlacesFromStore && mapInstance.value) {
      updateMapDisplay();
    }
  },
  { deep: true }
);

watch(
  () => currentDay.value,
  () => {
    if (props.usePlacesFromStore && !props.showAllDays && mapInstance.value) {
      updateMapDisplay();
    }
  }
);

watch(
  () => props.showAllDays,
  () => {
    if (mapInstance.value) {
      updateMapDisplay();
    }
  }
);

// hasRouteOptimization 변화 감시 (경로 데이터가 있어도 최적화 상태가 변경되면 업데이트)
watch(
  () => hasRouteOptimization.value,
  () => {
    if (mapInstance.value) {
      updateMapDisplay();
    }
  }
);

watch(
  () => props.places,
  () => {
    if (!props.usePlacesFromStore && mapInstance.value) {
      updateMapDisplay();
    }
  },
  { deep: true }
);

defineExpose({
  focusPlace,
  updateMapDisplay,
  clearAll: () => kakaoMapService.clearAll(),
  retryLoadMap,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.kakao-map-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.map-header {
  margin-bottom: $spacing-md;

  h3 {
    font-size: 1.25rem;
    margin: 0;
    color: $primary-color;
  }
}

.map-wrapper {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
}

.map-element {
  width: 100%;
  height: 400px;
  border-radius: 16px;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba($white, 0.8);
  backdrop-filter: blur(5px);
  z-index: 1;

  .loading-spinner {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid rgba($accent-color, 0.1);
    border-top-color: $accent-color;
    animation: spinner 0.8s linear infinite;
    margin-bottom: $spacing-sm;
  }

  p {
    color: $primary-color;
    font-weight: $font-weight-medium;
  }
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 1;

  svg {
    color: $error-color;
    margin-bottom: $spacing-sm;
  }

  p {
    margin-bottom: $spacing-md;
    color: $primary-color;
  }
}

.place-list-preview {
  margin-top: $spacing-md;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: $spacing-sm;
  padding: $spacing-xs 0;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($dark-gray, 0.3);
    border-radius: 3px;
  }
}

.place-item {
  display: flex;
  align-items: center;
  min-width: 200px;
  max-width: 300px;
  padding: $spacing-sm $spacing-md;
  border-radius: 12px;
  background-color: rgba($white, 0.7);
  backdrop-filter: blur(5px);
  border: 1px solid rgba($medium-gray, 0.3);
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($accent-color, 0.1);
    border-color: rgba($accent-color, 0.3);
    transform: translateY(-2px);
  }

  &.active {
    background-color: rgba($accent-color, 0.2);
    border-color: $accent-color;
  }
}

.place-item-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: $accent-color;
  color: $white;
  font-size: 12px;
  font-weight: $font-weight-bold;
  margin-right: $spacing-sm;
  flex-shrink: 0;
}

.place-item-content {
  overflow: hidden;
}

.place-item-name {
  font-weight: $font-weight-medium;
  color: $primary-color;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.place-item-address {
  font-size: 12px;
  color: $dark-gray;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

:global(.map-infowindow) {
  padding: 10px;
  min-width: 150px;
  max-width: 300px;
  font-family: $font-family;
}

:global(.infowindow-day) {
  font-size: 12px;
  font-weight: $font-weight-bold;
  margin-bottom: 4px;
}

:global(.infowindow-title) {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 5px;
  color: $primary-color;
}

:global(.infowindow-address) {
  font-size: 12px;
  margin-bottom: 5px;
  color: $dark-gray;
}

:global(.infowindow-phone) {
  font-size: 12px;
  margin-bottom: 5px;
  color: $dark-gray;
}

:global(.infowindow-link) {
  font-size: 12px;
  margin-top: 8px;

  a {
    color: $accent-color;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .notification-container {
    top: $spacing-md;
    right: $spacing-md;
    width: calc(100% - #{$spacing-md * 2});
  }
}
</style>
