<template>
  <div class="kakao-map-container">
    <div class="map-header" v-if="title">
      <h3>{{ title }}</h3>
    </div>
    
    <div class="map-wrapper">
      <div ref="mapContainer" class="map-element glass-card"></div>
      
      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="map-loading">
        <div class="loading-spinner"></div>
        <p>지도를 불러오는 중...</p>
      </div>
      
      <!-- 지도 오류 -->
      <div v-if="hasError" class="map-error glass-card">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <div class="place-item-address">{{ place.roadAddressName || place.addressName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useTravelStore } from '@/stores/travel';
import { useTravelResultStore } from '@/stores/travel.result';
import { useNotificationStore } from '@/stores/notification';
import kakaoMapService from '@/utils/kakaoMapService';

// Props
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  usePlacesFromStore: {
    type: Boolean,
    default: true
  },
  places: {
    type: Array,
    default: () => []
  },
  defaultCenter: {
    type: Object,
    default: () => ({ lat: 37.566826, lng: 126.9786567 })
  },
  defaultZoom: {
    type: Number,
    default: 5
  },
  height: {
    type: String,
    default: '400px'
  },
  showAllDays: {
    type: Boolean,
    default: true
  },
  showRoutes: {
    type: Boolean,
    default: true
  }
});

// Emit
const emit = defineEmits(['map-ready', 'place-focused', 'routes-updated']);

// 상태 변수
const mapContainer = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const selectedPlaceIndex = ref(-1);
const mapInstance = ref(null);

// 경로 표시 관련 상태
const showAllRoutes = ref(true);
const visibleDays = ref(new Set());

// 스토어
const travelStore = useTravelStore();
const travelResultStore = useTravelResultStore();
const notificationStore = useNotificationStore();

const { currentDayPlaces, currentDay, itinerary } = storeToRefs(travelStore);
const { optimizedPaths, hasResult } = storeToRefs(travelResultStore);

// 컴포넌트에서 사용할 장소 데이터
const displayPlaces = computed(() => {
  if (props.usePlacesFromStore) {
    return currentDayPlaces.value || [];
  }
  return props.places;
});

// 모든 일차 장소 데이터
const allDaysPlaces = computed(() => {
  if (!props.usePlacesFromStore || !itinerary.value || itinerary.value.length === 0) return [];
  
  const allPlaces = [];
  for (let day = 0; day < itinerary.value.length; day++) {
    const placesForDay = itinerary.value[day] || [];
    placesForDay.forEach(place => {
      allPlaces.push({
        ...place,
        day: day + 1
      });
    });
  }
  return allPlaces;
});

// 표시할 장소가 있는지 확인
const hasPlaces = computed(() => {
  return displayPlaces.value.length > 0;
});

// 경로 데이터가 있는지 확인
const hasRoutePaths = computed(() => {
  return hasResult.value && optimizedPaths.value.length > 0;
});

// 일차별 색상 반환
const getDayColor = (dayIndex) => {
  return kakaoMapService.getDayColor(dayIndex + 1);
};

const initializeMap = async () => {
  if (!mapContainer.value) return;

  isLoading.value = true;
  hasError.value = false;

  try {
    await kakaoMapService.loadScript();
    mapContainer.value.style.height = props.height;

    // 여행 지역 이름 추출
    const region = travelStore.tripInfo?.region;
    let initialCoord = props.defaultCenter;
    
    if (region) {
      try {
        const regionName = region.districtName
          ? `${region.provinceName} ${region.districtName}`
          : region.provinceName || '서울';

        const coord = await kakaoMapService.convertAddressToCoord(regionName);
        initialCoord = { lat: coord.lat, lng: coord.lng };
      } catch (error) {
        console.warn('지역 좌표 변환 실패, 기본 좌표 사용');
      }
    }

    const initialCenter = new window.kakao.maps.LatLng(initialCoord.lat, initialCoord.lng);

    // 지도 초기화
    mapInstance.value = kakaoMapService.initMap(mapContainer.value, {
      center: initialCenter,
      level: props.defaultZoom
    });

    kakaoMapService.addMapControls(true, true);

    // 마커 및 경로 업데이트
    await updateMapMarkers();
    if (props.showRoutes) {
      updateMapRoutes();
    }

    emit('map-ready', mapInstance.value);
  } catch (error) {
    console.error('지도 초기화 오류:', error);
    hasError.value = true;
    errorMessage.value = '지도를 불러오는데 실패했습니다.';
    notificationStore.showError('지도 로드 실패');
  } finally {
    isLoading.value = false;
  }
};

// 지도 마커 업데이트
const updateMapMarkers = async () => {
  if (!mapInstance.value) return;
  
  try {
    if (props.usePlacesFromStore) {
      if (props.showAllDays) {
        const placesWithCoords = await addCoordsToPlaces(allDaysPlaces.value);
        if (placesWithCoords.length > 0) {
          kakaoMapService.addMarkers(placesWithCoords);
        }
      } else {
        const placesWithCoords = await addCoordsToPlaces(displayPlaces.value);
        kakaoMapService.addMarkers(placesWithCoords, currentDay.value + 1);
      }
    } else {
      const placesWithCoords = await addCoordsToPlaces(props.places);
      kakaoMapService.addMarkers(placesWithCoords);
    }
  } catch (error) {
    console.error('마커 업데이트 오류:', error);
  }
};

// 지도 경로 업데이트
const updateMapRoutes = () => {
  if (!mapInstance.value || !hasRoutePaths.value || !props.showRoutes) return;

  try {
    kakaoMapService.clearAllRoutes();

    if (showAllRoutes.value) {
      kakaoMapService.drawAllRoutes(optimizedPaths.value, {
        strokeWeight: 4,
        strokeOpacity: 0.7
      });
    } else {
      visibleDays.value.forEach(dayIndex => {
        if (optimizedPaths.value[dayIndex]) {
          kakaoMapService.drawDayRoute(dayIndex, optimizedPaths.value[dayIndex], {
            strokeColor: getDayColor(dayIndex),
            strokeWeight: 5,
            strokeOpacity: 0.8
          });
        }
      });
    }

    emit('routes-updated', {
      showAllRoutes: showAllRoutes.value,
      visibleDays: Array.from(visibleDays.value)
    });
  } catch (error) {
    console.error('경로 업데이트 오류:', error);
  }
};

// 모든 경로 표시 토글
const toggleAllRoutes = () => {
  showAllRoutes.value = !showAllRoutes.value;
  if (showAllRoutes.value) {
    visibleDays.value.clear();
  }
  updateMapRoutes();
};

// 특정 일차 경로 토글
const toggleDayRoute = (dayIndex) => {
  if (showAllRoutes.value) {
    showAllRoutes.value = false;
    visibleDays.value.clear();
  }
  
  if (visibleDays.value.has(dayIndex)) {
    visibleDays.value.delete(dayIndex);
  } else {
    visibleDays.value.add(dayIndex);
  }
  
  updateMapRoutes();
};

// 모든 경로 숨기기
const clearAllRoutes = () => {
  showAllRoutes.value = false;
  visibleDays.value.clear();
  kakaoMapService.clearAllRoutes();
};

// 장소 데이터에 좌표 추가
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
            longitude: coord.lng
          };
        }
        return place;
      } catch (error) {
        console.error('좌표 변환 오류:', place.placeName);
        return place;
      }
    })
  );

  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
};

// 특정 장소로 포커스
const focusPlace = (index) => {
  selectedPlaceIndex.value = index;
  kakaoMapService.focusMarker(index);
  emit('place-focused', displayPlaces.value[index]);
};

// 지도 다시 로드 시도
const retryLoadMap = () => {
  initializeMap();
};

// 지도 리사이즈 핸들러
const handleResize = () => {
  if (mapInstance.value) {
    kakaoMapService.resizeMap();
  }
};

// 마운트 시 초기화
onMounted(() => {
  initializeMap();
  window.addEventListener('resize', handleResize);
});

// 언마운트 시 정리
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (mapInstance.value) {
    kakaoMapService.clearAll();
  }
});

// 감시자들
watch([displayPlaces, allDaysPlaces], () => {
  if (mapInstance.value) {
    updateMapMarkers();
  }
}, { deep: true });

watch(() => itinerary.value, () => {
  if (props.usePlacesFromStore && mapInstance.value) {
    updateMapMarkers();
  }
}, { deep: true });

watch(() => currentDay.value, () => {
  if (props.usePlacesFromStore && !props.showAllDays && mapInstance.value) {
    updateMapMarkers();
  }
});

watch(() => props.showAllDays, () => {
  if (mapInstance.value) {
    updateMapMarkers();
  }
});

watch(() => optimizedPaths.value, () => {
  if (mapInstance.value && props.showRoutes) {
    updateMapRoutes();
  }
}, { deep: true });

watch(() => props.showRoutes, () => {
  if (mapInstance.value) {
    if (props.showRoutes) {
      updateMapRoutes();
    } else {
      kakaoMapService.clearAllRoutes();
    }
  }
});

// 외부에서 접근 가능한 메서드
defineExpose({
  focusPlace,
  updateMapMarkers,
  updateMapRoutes,
  toggleAllRoutes,
  toggleDayRoute,
  clearAllRoutes,
  retryLoadMap
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles' as *;

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

/* 인포윈도우 스타일 */
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
</style>