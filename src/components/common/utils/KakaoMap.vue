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
    default: () => ({ lat: 37.566826, lng: 126.9786567 }) // 서울시청 기본값
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
    default: true  // 기본값을 true로 변경
  }
});

// Emit
const emit = defineEmits(['map-ready', 'place-focused']);

// 상태 변수
const mapContainer = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const selectedPlaceIndex = ref(-1);
const mapInstance = ref(null);

// 스토어
const travelStore = useTravelStore();
const notificationStore = useNotificationStore();
const { currentDayPlaces, currentDay, itinerary, tripDuration } = storeToRefs(travelStore);

// 컴포넌트에서 사용할 장소 데이터 (스토어 또는 props)
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
  // 각 일차별로 처리
  for (let day = 0; day < itinerary.value.length; day++) {
    const placesForDay = itinerary.value[day] || [];
    
    // 각 장소에 일차 정보 추가
    placesForDay.forEach(place => {
      allPlaces.push({
        ...place,
        day: day + 1  // 일차는 1부터 시작 (0번 인덱스가 1일차)
      });
    });
  }
  
  return allPlaces;
});

// 표시할 장소가 있는지 확인
const hasPlaces = computed(() => {
  return displayPlaces.value.length > 0;
});


const initializeMap = async () => {
  if (!mapContainer.value) return;

  isLoading.value = true;
  hasError.value = false;

  try {
    await kakaoMapService.loadScript();
    mapContainer.value.style.height = props.height;

    // 🟡 1. 여행 지역 이름 추출
    const region = travelStore.tripInfo.region;
    const regionName = region?.districtName
      ? `${region.provinceName} ${region.districtName}`
      : region?.provinceName || '서울';

    console.log(regionName);
    // 🟡 2. 주소 → 좌표 변환
    const coord = await kakaoMapService.convertAddressToCoord(regionName);

    const initialCenter = new window.kakao.maps.LatLng(coord.lat, coord.lng);

    // 🟡 3. 지도 초기화
    mapInstance.value = kakaoMapService.initMap(mapContainer.value, {
      center: initialCenter,
      level: props.defaultZoom
    });

    kakaoMapService.addMapControls(true, true);

    await updateMapMarkers();

    emit('map-ready', mapInstance.value);
  } catch (error) {
    console.error('지도 초기화 오류:', error);
    hasError.value = true;
    errorMessage.value = '지도를 불러오는데 실패했습니다. 다시 시도해주세요.';
    notificationStore.showError('지도를 불러오는데 실패했습니다.');
  } finally {
    isLoading.value = false;
  }
};

// 지도 마커 업데이트
const updateMapMarkers = async () => {
  if (!mapInstance.value) return;
  
  if (props.usePlacesFromStore) {
    if (props.showAllDays) {
      // 모든 일차 표시 모드
      const placesWithCoords = await addCoordsToPlaces(allDaysPlaces.value);
      if (placesWithCoords.length > 0) {
        kakaoMapService.addMarkers(placesWithCoords); // 이미 각 장소에 day 속성이 있음
      }
    } else {
      // 현재 일차만 표시 모드
      const placesWithCoords = await addCoordsToPlaces(displayPlaces.value);
      kakaoMapService.addMarkers(placesWithCoords, currentDay.value + 1); // +1 해서 1일차부터 시작하도록
    }
  } else {
    // props로 전달된 장소 표시
    const placesWithCoords = await addCoordsToPlaces(props.places);
    kakaoMapService.addMarkers(placesWithCoords);
  }
};

// 장소 데이터에 좌표 추가
const addCoordsToPlaces = async (places) => {
  return Promise.all(
    places.map(async (place) => {
      // 이미 좌표가 있는 경우 그대로 사용
      if (place.latitude && place.longitude) {
        return place;
      }
      
      try {
        // 주소를 좌표로 변환
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
        console.error('좌표 변환 오류:', error);
        return place;
      }
    })
  );
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
  kakaoMapService.resizeMap();
};

// 마운트 시 초기화
onMounted(() => {
  initializeMap();
  window.addEventListener('resize', handleResize);
});

// 언마운트 시 이벤트 리스너 제거
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 장소 데이터 변경 감지
watch([displayPlaces, allDaysPlaces], () => {
  if (mapInstance.value) {
    updateMapMarkers();
  }
}, { deep: true });

// 일정 변경 감지
watch(() => itinerary.value, () => {
  if (props.usePlacesFromStore && mapInstance.value) {
    updateMapMarkers();
  }
}, { deep: true });

// 현재 선택된 일차 변경 감지
watch(() => currentDay.value, () => {
  if (props.usePlacesFromStore && !props.showAllDays && mapInstance.value) {
    updateMapMarkers();
  }
});

// 표시 모드 변경 감지
watch(() => props.showAllDays, () => {
  if (mapInstance.value) {
    updateMapMarkers();
  }
});

// 외부에서 접근 가능한 메서드
defineExpose({
  focusPlace,
  updateMapMarkers,
  retryLoadMap
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
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
  @include glassmorphism(0.5, 5px);
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
  
  &::-webkit-scrollbar-track {
    background: rgba($light-gray, 0.5);
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

.loading-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba($accent-color, 0.1);
  border-top-color: $accent-color;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

/* 카카오맵 인포윈도우 커스텀 스타일 - 전역으로 적용됨 */
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
</style>