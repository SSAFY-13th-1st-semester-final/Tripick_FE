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

// Props 정의
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

// 이벤트 정의
const emit = defineEmits(['map-ready', 'place-focused', 'routes-updated']);

// 반응형 상태 변수들
const mapContainer = ref(null);              // 지도 컨테이너 DOM 참조
const isLoading = ref(true);                 // 지도 로딩 상태
const hasError = ref(false);                 // 지도 오류 상태
const errorMessage = ref('');                // 오류 메시지
const selectedPlaceIndex = ref(-1);          // 선택된 장소 인덱스
const mapInstance = ref(null);               // 카카오맵 인스턴스
const customMarkers = ref([]);               // 직접 생성한 마커들 (숙소 마커)

// 스토어 인스턴스
const travelStore = useTravelStore();
const notificationStore = useNotificationStore();

// 스토어에서 필요한 반응형 데이터 추출
const { 
  currentDayPlaces,   // 현재 일차의 장소 목록
  currentDay,         // 현재 선택된 일차
  itinerary,          // 전체 여행 일정 (2차원 배열)
  hotels,             // 일차별 숙소 정보
  routeApiCallCount   // 경로 API 호출 횟수
} = storeToRefs(travelStore);

/**
 * 컴포넌트에서 표시할 장소 데이터 계산
 * props.usePlacesFromStore에 따라 스토어 데이터 또는 props 데이터 사용
 */
const displayPlaces = computed(() => {
  if (props.usePlacesFromStore) {
    return currentDayPlaces.value || [];
  }
  return props.places;
});

/**
 * 전체 일차의 모든 장소 데이터 (숙소 포함) 계산
 * 각 장소에 day 속성과 타입 정보를 추가하여 반환
 */
const allDaysPlaces = computed(() => {
  if (!props.usePlacesFromStore || !itinerary.value || itinerary.value.length === 0) return [];
  
  const allPlaces = [];
  
  for (let day = 0; day < itinerary.value.length; day++) {
    // 해당 일차의 숙소 추가
    const dayHotel = hotels.value[day];
    if (dayHotel) {
      allPlaces.push({
        ...dayHotel,
        day: day + 1,
        type: 'hotel',
        isHotel: true
      });
    }
    
    // 해당 일차의 방문지들 추가
    const placesForDay = itinerary.value[day] || [];
    placesForDay.forEach(place => {
      allPlaces.push({
        ...place,
        day: day + 1,
        type: 'place',
        isHotel: false
      });
    });
  }
  return allPlaces;
});

/**
 * 표시할 장소가 있는지 확인하는 계산된 속성
 */
const hasPlaces = computed(() => {
  return displayPlaces.value.length > 0;
});

/**
 * 카카오맵 초기화 및 설정
 * 지도 스크립트 로드, 지역 기반 초기 위치 설정, 마커 및 경로 표시
 */
const initializeMap = async () => {
  if (!mapContainer.value) return;

  isLoading.value = true;
  hasError.value = false;

  try {
    // 카카오맵 스크립트 로드
    await kakaoMapService.loadScript();
    mapContainer.value.style.height = props.height;

    // 여행 지역 정보를 기반으로 초기 좌표 설정
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

    // 지도 인스턴스 생성 및 초기화
    mapInstance.value = kakaoMapService.initMap(mapContainer.value, {
      center: initialCenter,
      level: props.defaultZoom
    });

    // 지도 컨트롤 추가 (줌, 지도타입)
    kakaoMapService.addMapControls(true, true);

    // 마커 표시
    await updateMapMarkers();
    
    // API 호출이 한 번 이상 된 경우에만 경로 표시
    if (props.showRoutes && routeApiCallCount.value > 0) {
      await updateMapRoutes();
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

/**
 * 모든 마커 제거 (kakaoMapService 관리 마커 + 직접 생성한 마커)
 * 숙소 마커는 직접 관리하므로 별도 제거 필요
 */
const clearAllMarkers = () => {
  // kakaoMapService가 관리하는 마커들 제거
  kakaoMapService.clearMarkers();
  
  // 직접 생성한 숙소 마커들 제거
  customMarkers.value.forEach(marker => {
    marker.setMap(null);
  });
  customMarkers.value = [];
};

/**
 * 지도 마커 업데이트 메인 함수
 * 전체 일차 표시 여부에 따라 다른 데이터셋 사용
 */
const updateMapMarkers = async () => {
  if (!mapInstance.value) return;
  
  try {
    // 기존 마커들 모두 제거
    clearAllMarkers();
    
    if (props.usePlacesFromStore) {
      if (props.showAllDays) {
        // 전체 일차의 모든 장소 표시
        const placesWithCoords = await addCoordsToPlaces(allDaysPlaces.value);
        if (placesWithCoords.length > 0) {
          await addMarkersWithHotels(placesWithCoords);
        }
      } else {
        // 현재 일차의 장소만 표시 (숙소 포함)
        const currentDayData = [];
        const dayHotel = hotels.value[currentDay.value];
        
        if (dayHotel) {
          currentDayData.push({
            ...dayHotel,
            day: currentDay.value + 1,
            type: 'hotel',
            isHotel: true
          });
        }
        
        currentDayData.push(...displayPlaces.value.map(place => ({
          ...place,
          day: currentDay.value + 1,
          type: 'place',
          isHotel: false
        })));
        
        const placesWithCoords = await addCoordsToPlaces(currentDayData);
        await addMarkersWithHotels(placesWithCoords);
      }
    } else {
      // props로 전달된 장소 데이터 사용
      const placesWithCoords = await addCoordsToPlaces(props.places);
      await addMarkersWithHotels(placesWithCoords);
    }
  } catch (error) {
    console.error('마커 업데이트 오류:', error);
  }
};

/**
 * 숙소와 방문지를 구분하여 마커 추가
 * 방문지: kakaoMapService의 색상 마커 사용
 * 숙소: 빨간색 핀 마커 직접 생성
 * @param {Array} places - 좌표가 포함된 장소 데이터 배열
 */
const addMarkersWithHotels = async (places) => {
  if (!places || places.length === 0) return;
  
  // 숙소와 방문지 분리
  const hotels = places.filter(place => place.isHotel || place.type === 'hotel');
  const visitPlaces = places.filter(place => !(place.isHotel || place.type === 'hotel'));
  
  // 방문지 마커는 kakaoMapService의 기본 기능 사용 (일차별 색상, 호버 기능 포함)
  if (visitPlaces.length > 0) {
    kakaoMapService.addMarkers(visitPlaces);
  }
  
  // 숙소 마커는 별도로 빨간색 핀으로 생성
  const hotelPositions = [];
  hotels.forEach(hotel => {
    if (!hotel.latitude || !hotel.longitude) return;
    
    const position = new window.kakao.maps.LatLng(hotel.latitude, hotel.longitude);
    hotelPositions.push(position);
    
    // 숙소 전용 빨간색 마커 이미지
    const markerImage = new window.kakao.maps.MarkerImage(
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
      new window.kakao.maps.Size(30, 35)
    );
    
    const marker = new window.kakao.maps.Marker({
      position: position,
      image: markerImage,
      title: hotel.placeName
    });
    
    marker.setMap(mapInstance.value);
    customMarkers.value.push(marker);
    
    // 숙소 정보 인포윈도우 생성
    const infoWindowContent = `
      <div class="map-infowindow">
        <div class="infowindow-day" style="color: #ff4444">
          ${hotel.day}일차 (숙소)
        </div>
        <div class="infowindow-title">${hotel.placeName}</div>
        <div class="infowindow-address">${hotel.roadAddressName || hotel.addressName || ''}</div>
      </div>
    `;
    
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: infoWindowContent
    });
    
    // 마커 클릭 시 인포윈도우 표시
    window.kakao.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(mapInstance.value, marker);
    });
  });
  
  // 숙소가 추가된 경우 지도 범위 조정
  if (hotelPositions.length > 0) {
    const bounds = new window.kakao.maps.LatLngBounds();
    
    // 모든 마커 위치를 범위에 포함
    [...hotelPositions].forEach(position => {
      bounds.extend(position);
    });
    
    // 방문지 마커들의 위치도 범위에 포함
    visitPlaces.forEach(place => {
      if (place.latitude && place.longitude) {
        bounds.extend(new window.kakao.maps.LatLng(place.latitude, place.longitude));
      }
    });
    
    // 지도 범위 설정 (모든 마커가 보이도록)
    mapInstance.value.setBounds(bounds);
  }
};

/**
 * 특정 일차의 경로 데이터 생성
 * 숙소 → 방문지들 → 숙소 순서로 원형 경로 생성
 * @param {number} dayIndex - 일차 인덱스 (0부터 시작)
 * @returns {Array|null} 경로 좌표 배열 또는 null
 */
const createDayRoute = async (dayIndex) => {
  const dayPlaces = itinerary.value[dayIndex];
  const dayHotel = hotels.value[dayIndex];
  
  if (!dayPlaces || dayPlaces.length === 0) {
    return null;
  }

  const route = [];
  let hotelCoord = null;
  
  // 숙소 좌표 확인 및 변환
  if (dayHotel) {
    if (dayHotel.latitude && dayHotel.longitude) {
      hotelCoord = { lat: dayHotel.latitude, lng: dayHotel.longitude };
    } else if (dayHotel.roadAddressName || dayHotel.addressName) {
      try {
        const address = dayHotel.roadAddressName || dayHotel.addressName;
        hotelCoord = await kakaoMapService.convertAddressToCoord(address);
      } catch (error) {
        console.warn(`숙소 좌표 변환 실패: ${dayHotel.placeName}`, error);
      }
    }
    
    // 숙소를 시작점으로 추가
    if (hotelCoord) {
      route.push({
        latitude: hotelCoord.lat,
        longitude: hotelCoord.lng,
        placeName: dayHotel.placeName,
        type: 'hotel'
      });
    }
  }

  // 방문지들을 순서대로 추가
  for (const place of dayPlaces) {

    let placeCoord = null;
    
    if (place.latitude && place.longitude) {
      placeCoord = { lat: place.latitude, lng: place.longitude };
    } else if (place.roadAddressName || place.addressName) {
      try {
        const address = place.roadAddressName || place.addressName;
        placeCoord = await kakaoMapService.convertAddressToCoord(address);
      } catch (error) {
        console.warn(`장소 좌표 변환 실패: ${place.placeName}`, error);
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
        type: 'place'
      });
    }
  }
  
  // 마지막에 숙소로 돌아가는 경로 추가 (원형 경로)
  if (hotelCoord && route.length > 1) {
    route.push({
      latitude: hotelCoord.lat,
      longitude: hotelCoord.lng,
      placeName: dayHotel.placeName,
      type: 'hotel_return'
    });
  }

  return route.length > 1 ? route : null;
};

/**
 * 지도에 경로 표시 업데이트
 * API 호출 횟수를 확인하여 조건부 실행
 */
const updateMapRoutes = async () => {

  if (!mapInstance.value || !props.showRoutes) {
    return;
  }

  try {
    // 기존 경로 모두 제거
    kakaoMapService.clearAllRoutes();

    // API 호출이 한 번도 없었다면 경로 표시하지 않음
    if (routeApiCallCount.value === 0) {
      return;
    }

    // 모든 일차의 경로 생성 및 표시
    let drawnRoutes = 0;
    for (let dayIndex = 0; dayIndex < itinerary.value.length; dayIndex++) {
      const route = await createDayRoute(dayIndex);
      
      if (route && route.length > 1) {
        const routeColor = kakaoMapService.getDayColor(dayIndex + 1);
        
        // 지도 컴포넌트의 updateMapRoutes 함수에서
kakaoMapService.drawRoute(route, {
  strokeColor: routeColor,
  strokeWeight: 4,
  strokeOpacity: 0.8,
  strokeStyle: 'solid'
}, dayIndex + 1);
        
        drawnRoutes++;
      }
    }

    // 경로 업데이트 완료 이벤트 발생
    emit('routes-updated', {
      totalRoutes: itinerary.value.length,
      drawnRoutes: drawnRoutes,
      apiCallCount: routeApiCallCount.value
    });
  } catch (error) {
    console.error('경로 업데이트 오류:', error);
  }
};

/**
 * 장소 데이터에 좌표 정보 추가
 * 좌표가 없는 장소는 주소를 이용해 좌표로 변환
 * @param {Array} places - 장소 데이터 배열
 * @returns {Array} 좌표가 추가된 장소 데이터 배열
 */
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

/**
 * 특정 장소로 지도 포커스 이동
 * @param {number} index - 장소 인덱스
 */
const focusPlace = (index) => {
  selectedPlaceIndex.value = index;
  kakaoMapService.focusMarker(index);
  emit('place-focused', displayPlaces.value[index]);
};

/**
 * 지도 다시 로드 시도 (오류 발생 시 사용)
 */
const retryLoadMap = () => {
  initializeMap();
};

/**
 * 브라우저 크기 변경 시 지도 리사이즈 처리
 */
const handleResize = () => {
  if (mapInstance.value) {
    kakaoMapService.resizeMap();
  }
};

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  initializeMap();
  window.addEventListener('resize', handleResize);
});

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  clearAllMarkers();
  kakaoMapService.clearAllRoutes();
  window.removeEventListener('resize', handleResize);
});

// 반응형 데이터 변경 감시자들

/**
 * 장소 데이터 변경 시 마커 업데이트
 */
watch([displayPlaces, allDaysPlaces, () => routeApiCallCount.value], (newValues, oldValues) => {
  if (!mapInstance.value) return;

  // 장소 데이터 변경 여부 확인 (newValues[0], newValues[1])
  const placesChanged = newValues[0] !== oldValues[0] || newValues[1] !== oldValues[1];
  // routeApiCallCount 변경 여부 확인 (newValues[2])
  const routeCountChanged = newValues[2] !== oldValues[2];

  if (placesChanged) {
    updateMapMarkers();
  }

  if (routeCountChanged) {
    updateMapRoutes();
  }
}, { deep: true });


/**
 * 여행 일정 변경 시 마커 및 경로 업데이트
 */
watch(() => itinerary.value, () => {
  if (props.usePlacesFromStore && mapInstance.value) {
    updateMapMarkers();
    // if (props.showRoutes && routeApiCallCount.value > 0) {
    //   updateMapRoutes();
    // }
  }
}, { deep: true });

/**
 * 숙소 정보 변경 시 마커 및 경로 업데이트
 */
watch(() => hotels.value, () => {
  if (props.usePlacesFromStore && mapInstance.value) {
    updateMapMarkers();
  }
}, { deep: true });


/**
 * API 호출 횟수 변경 시 경로 표시 상태 업데이트
 * 이전 값보다 정확히 1 증가한 경우에만 경로를 다시 그림
 */
watch(() => routeApiCallCount.value, (newValue, oldValue) => {
  if (mapInstance.value && props.showRoutes) {
    // 이전 값보다 정확히 1 증가한 경우에만 경로 업데이트
    if (newValue !== oldValue) {
      updateMapRoutes();
    } else if (newValue === 0) {
      kakaoMapService.clearAllRoutes();
    }
  }
});

/**
 * 현재 일차 변경 시 마커 업데이트 (단일 일차 표시 모드)
 */
watch(() => currentDay.value, () => {
  if (props.usePlacesFromStore && !props.showAllDays && mapInstance.value) {
    updateMapMarkers();
  }
});

/**
 * 전체 일차 표시 모드 변경 시 마커 업데이트
 */
watch(() => props.showAllDays, () => {
  if (mapInstance.value) {
    updateMapMarkers();
  }
});

/**
 * 경로 표시 옵션 변경 시 경로 업데이트
 */
watch(() => props.showRoutes, () => {
  if (mapInstance.value) {
    if (props.showRoutes && routeApiCallCount.value > 0) {
      updateMapRoutes();
    } else {
      kakaoMapService.clearAllRoutes();
    }
  }
});

// 외부에서 접근 가능한 메서드들 노출
defineExpose({
  focusPlace,           // 특정 장소로 포커스
  updateMapMarkers,     // 마커 업데이트
  updateMapRoutes,      // 경로 업데이트
  clearAllRoutes: () => kakaoMapService.clearAllRoutes(), // 모든 경로 제거
  clearAllMarkers,      // 모든 마커 제거
  retryLoadMap          // 지도 재로드
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