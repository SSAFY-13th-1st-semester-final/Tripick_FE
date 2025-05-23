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

const emit = defineEmits(["map-ready", "place-focused", "routes-updated"]);

const mapContainer = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref("");
const selectedPlaceIndex = ref(-1);
const mapInstance = ref(null);
const customMarkers = ref([]);

const travelStore = useTravelStore();
const notificationStore = useNotificationStore();

const {
  currentDayPlaces,
  currentDay,
  itinerary,
  hotels,
  routeApiCallCount,
  centerCoord,
} = storeToRefs(travelStore);

// 표시할 장소 데이터 계산 (스토어 또는 props 기반)
const displayPlaces = computed(() => {
  if (props.usePlacesFromStore) {
    return currentDayPlaces.value || [];
  }
  return props.places;
});

// 전체 일차의 모든 장소 데이터 (숙소 포함)
const allDaysPlaces = computed(() => {
  if (
    !props.usePlacesFromStore ||
    !itinerary.value ||
    itinerary.value.length === 0
  )
    return [];

  const allPlaces = [];

  for (let day = 0; day < itinerary.value.length; day++) {
    const dayHotel = hotels.value[day];
    if (dayHotel) {
      allPlaces.push({
        ...dayHotel,
        day: day + 1,
        type: "hotel",
        isHotel: true,
      });
    }

    const placesForDay = itinerary.value[day] || [];
    placesForDay.forEach((place) => {
      allPlaces.push({
        ...place,
        day: day + 1,
        type: "place",
        isHotel: false,
      });
    });
  }
  return allPlaces;
});

const hasPlaces = computed(() => {
  return displayPlaces.value.length > 0;
});

// 카카오맵 초기화 및 설정
const initializeMap = async () => {
  if (!mapContainer.value) return;

  isLoading.value = true;
  hasError.value = false;

  try {
    await kakaoMapService.loadScript();
    mapContainer.value.style.height = props.height;

    // 여행 지역 기반 초기 좌표 설정
    const region = travelStore.tripInfo?.region;
    let initialCoord = props.defaultCenter;

    if (region) {
      try {
        const regionName = region.districtName
          ? `${region.provinceName} ${region.districtName}`
          : region.provinceName || "서울";

        const coord = await kakaoMapService.convertAddressToCoord(regionName);
        initialCoord = { lat: coord.lat, lng: coord.lng };
        travelStore.centerCoord.y = initialCoord.lat;
        travelStore.centerCoord.x = initialCoord.lng;
      } catch (error) {
        // 지역 좌표 변환 실패 시 기본 좌표 사용
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
    await updateMapMarkers();

    if (props.showRoutes && routeApiCallCount.value > 0) {
      await updateMapRoutes();
    }

    emit("map-ready", mapInstance.value);
  } catch (error) {
    hasError.value = true;
    errorMessage.value = "지도를 불러오는데 실패했습니다.";
    notificationStore.showError("지도 로드 실패");
  } finally {
    isLoading.value = false;
  }
};

// 모든 마커 제거 (kakaoMapService + 커스텀 마커)
const clearAllMarkers = () => {
  kakaoMapService.clearMarkers();
  customMarkers.value.forEach((marker) => {
    marker.setMap(null);
  });
  customMarkers.value = [];
};

// 지도 마커 업데이트
const updateMapMarkers = async () => {
  if (!mapInstance.value) return;

  try {
    clearAllMarkers();

    if (props.usePlacesFromStore) {
      if (props.showAllDays) {
        const placesWithCoords = await addCoordsToPlaces(allDaysPlaces.value);
        if (placesWithCoords.length > 0) {
          await addMarkersWithHotels(placesWithCoords);
        }
      } else {
        const currentDayData = [];
        const dayHotel = hotels.value[currentDay.value];

        if (dayHotel) {
          currentDayData.push({
            ...dayHotel,
            day: currentDay.value + 1,
            type: "hotel",
            isHotel: true,
          });
        }

        currentDayData.push(
          ...displayPlaces.value.map((place) => ({
            ...place,
            day: currentDay.value + 1,
            type: "place",
            isHotel: false,
          }))
        );

        const placesWithCoords = await addCoordsToPlaces(currentDayData);
        await addMarkersWithHotels(placesWithCoords);
      }
    } else {
      const placesWithCoords = await addCoordsToPlaces(props.places);
      await addMarkersWithHotels(placesWithCoords);
    }
  } catch (error) {
    // 마커 업데이트 실패 시 무시
  }
};

// 숙소와 방문지를 구분하여 마커 추가
const addMarkersWithHotels = async (places) => {
  if (!places || places.length === 0) return;

  const hotels = places.filter(
    (place) => place.isHotel || place.type === "hotel"
  );
  const visitPlaces = places.filter(
    (place) => !(place.isHotel || place.type === "hotel")
  );

  // 방문지 마커 (일차별 색상)
  if (visitPlaces.length > 0) {
    kakaoMapService.addMarkers(visitPlaces);
  }

  // 숙소 마커 (빨간색 핀)
  const hotelPositions = [];
  hotels.forEach((hotel) => {
    if (!hotel.latitude || !hotel.longitude) return;

    const position = new window.kakao.maps.LatLng(
      hotel.latitude,
      hotel.longitude
    );
    hotelPositions.push(position);

    const markerImage = new window.kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
      new window.kakao.maps.Size(30, 35)
    );

    const marker = new window.kakao.maps.Marker({
      position: position,
      image: markerImage,
      title: hotel.placeName,
    });

    marker.setMap(mapInstance.value);
    customMarkers.value.push(marker);

    const infoWindowContent = `
      <div class="map-infowindow">
        <div class="infowindow-day" style="color: #ff4444">
          ${hotel.day}일차 (숙소)
        </div>
        <div class="infowindow-title">${hotel.placeName}</div>
        <div class="infowindow-address">${
          hotel.roadAddressName || hotel.addressName || ""
        }</div>
      </div>
    `;

    const infoWindow = new window.kakao.maps.InfoWindow({
      content: infoWindowContent,
    });

    window.kakao.maps.event.addListener(marker, "click", () => {
      infoWindow.open(mapInstance.value, marker);
    });
  });

  // 지도 범위 조정 (모든 마커가 보이도록)
  if (hotelPositions.length > 0) {
    const bounds = new window.kakao.maps.LatLngBounds();

    [...hotelPositions].forEach((position) => {
      bounds.extend(position);
    });

    visitPlaces.forEach((place) => {
      if (place.latitude && place.longitude) {
        bounds.extend(
          new window.kakao.maps.LatLng(place.latitude, place.longitude)
        );
      }
    });

    mapInstance.value.setBounds(bounds);
  }
};

// 특정 일차의 경로 데이터 생성 (숙소 → 방문지들 → 숙소)
const createDayRoute = async (dayIndex) => {
  const dayPlaces = itinerary.value[dayIndex];
  const dayHotel = hotels.value[dayIndex];

  if (!dayPlaces || dayPlaces.length === 0) {
    return null;
  }

  const route = [];
  let hotelCoord = null;

  // 숙소 좌표 처리
  if (dayHotel) {
    if (dayHotel.latitude && dayHotel.longitude) {
      hotelCoord = { lat: dayHotel.latitude, lng: dayHotel.longitude };
    } else if (dayHotel.roadAddressName || dayHotel.addressName) {
      try {
        const address = dayHotel.roadAddressName || dayHotel.addressName;
        hotelCoord = await kakaoMapService.convertAddressToCoord(address);
      } catch (error) {
        // 숙소 좌표 변환 실패 시 무시
      }
    }

    if (hotelCoord) {
      route.push({
        latitude: hotelCoord.lat,
        longitude: hotelCoord.lng,
        placeName: dayHotel.placeName,
        type: "hotel",
      });
    }
  }

  // 방문지들 순서대로 추가
  for (const place of dayPlaces) {
    let placeCoord = null;

    if (place.latitude && place.longitude) {
      placeCoord = { lat: place.latitude, lng: place.longitude };
    } else if (place.roadAddressName || place.addressName) {
      try {
        const address = place.roadAddressName || place.addressName;
        placeCoord = await kakaoMapService.convertAddressToCoord(address);
      } catch (error) {
        continue;
      }
    } else {
      continue;
    }

    if (placeCoord) {
      route.push({
        latitude: placeCoord.lat,
        longitude: placeCoord.lng,
        placeName: place.placeName,
        type: "place",
      });
    }
  }

  // 숙소로 돌아가는 원형 경로
  if (hotelCoord && route.length > 1) {
    route.push({
      latitude: hotelCoord.lat,
      longitude: hotelCoord.lng,
      placeName: dayHotel.placeName,
      type: "hotel_return",
    });
  }

  return route.length > 1 ? route : null;
};

// 지도에 경로 표시 업데이트
const updateMapRoutes = async () => {
  if (!mapInstance.value || !props.showRoutes) {
    return;
  }

  try {
    kakaoMapService.clearAllRoutes();

    if (routeApiCallCount.value === 0) {
      return;
    }

    let drawnRoutes = 0;
    for (let dayIndex = 0; dayIndex < itinerary.value.length; dayIndex++) {
      const route = await createDayRoute(dayIndex);

      if (route && route.length > 1) {
        const routeColor = kakaoMapService.getDayColor(dayIndex + 1);

        kakaoMapService.drawRoute(
          route,
          {
            strokeColor: routeColor,
            strokeWeight: 4,
            strokeOpacity: 0.8,
            strokeStyle: "solid",
          },
          dayIndex + 1
        );

        drawnRoutes++;
      }
    }

    emit("routes-updated", {
      totalRoutes: itinerary.value.length,
      drawnRoutes: drawnRoutes,
      apiCallCount: routeApiCallCount.value,
    });
  } catch (error) {
    // 경로 업데이트 실패 시 무시
  }
};

// 장소 데이터에 좌표 정보 추가
const addCoordsToPlaces = async (places) => {
  const results = await Promise.allSettled(
    places.map(async (place) => {
      if (place.latitude && place.longitude) {
        return place;
      }

      try {
        if (place.roadAddressName || place.addressName) {
          const address = place.roadAddressName || place.addressName;
          const coord = await kakaoMapService.convertAddressToCoord(address);

          return {
            ...place,
            latitude: coord.lat,
            longitude: coord.lng,
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
  clearAllMarkers();
  kakaoMapService.clearAllRoutes();
  window.removeEventListener("resize", handleResize);
});

// 반응형 데이터 변경 감시
watch(
  [displayPlaces, allDaysPlaces, () => routeApiCallCount.value],
  (newValues, oldValues) => {
    if (!mapInstance.value) return;

    const placesChanged =
      newValues[0] !== oldValues[0] || newValues[1] !== oldValues[1];
    const routeCountChanged = newValues[2] !== oldValues[2];

    if (placesChanged) {
      updateMapMarkers();
    }

    if (routeCountChanged) {
      updateMapRoutes();
    }
  },
  { deep: true }
);

watch(
  () => itinerary.value,
  () => {
    if (props.usePlacesFromStore && mapInstance.value) {
      updateMapMarkers();
    }
  },
  { deep: true }
);

watch(
  () => hotels.value,
  () => {
    if (props.usePlacesFromStore && mapInstance.value) {
      updateMapMarkers();
    }
  },
  { deep: true }
);

watch(
  () => routeApiCallCount.value,
  (newValue, oldValue) => {
    if (mapInstance.value && props.showRoutes) {
      if (newValue !== oldValue) {
        updateMapRoutes();
      } else if (newValue === 0) {
        kakaoMapService.clearAllRoutes();
      }
    }
  }
);

watch(
  () => currentDay.value,
  () => {
    if (props.usePlacesFromStore && !props.showAllDays && mapInstance.value) {
      updateMapMarkers();
    }
  }
);

watch(
  () => props.showAllDays,
  () => {
    if (mapInstance.value) {
      updateMapMarkers();
    }
  }
);

watch(
  () => props.showRoutes,
  () => {
    if (mapInstance.value) {
      if (props.showRoutes && routeApiCallCount.value > 0) {
        updateMapRoutes();
      } else {
        kakaoMapService.clearAllRoutes();
      }
    }
  }
);

defineExpose({
  focusPlace,
  updateMapMarkers,
  updateMapRoutes,
  clearAllRoutes: () => kakaoMapService.clearAllRoutes(),
  clearAllMarkers,
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
