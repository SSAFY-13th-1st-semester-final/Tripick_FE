<template>
  <div class="map-section glass-card">
    <div class="map-header">
      <h2>지역 선택</h2>
      <p>지도에서 원하는 지역을 클릭해주세요</p>

      <!-- 디버그 버튼들 -->
      <div class="debug-controls" v-if="!isLoading">
        <button @click="showPolygonInfo" class="glass-btn">폴리곤 정보</button>
        <button @click="resetMapView" class="glass-btn">지도 초기화</button>
        <button @click="fitToBounds" class="glass-btn">범위 맞춤</button>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>지도를 로딩중입니다...</p>
    </div>

    <div class="map-container">
      <div ref="mapContainer" class="kakao-map"></div>

      <!-- 호버 정보 툴팁 -->
      <div v-if="hoveredRegion" class="hover-tooltip glass-card">
        <h4>{{ hoveredRegion }}</h4>
        <p>클릭하여 자세한 정보 보기</p>
      </div>

      <!-- 폴리곤 정보 표시 -->
      <div v-if="showDebugInfo" class="debug-info glass-card">
        <h4>폴리곤 정보</h4>
        <p>총 {{ debugInfo.totalRegions }}개 지역</p>
        <p>총 {{ debugInfo.totalPolygons }}개 폴리곤</p>
        <div class="region-counts">
          <div
            v-for="(count, region) in debugInfo.counts"
            :key="region"
            class="region-count"
          >
            <span class="region-name">{{ region }}:</span>
            <span class="count">{{ count }}개</span>
          </div>
        </div>
        <button @click="showDebugInfo = false" class="close-btn glass-btn">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useNotificationStore } from "@/stores/notification";
import mapService from "@/utils/mapService";

// 이벤트 정의
const emit = defineEmits(["region-selected", "region-hovered"]);

// 반응형 상태
const mapContainer = ref(null);
const hoveredRegion = ref(null);
const isLoading = ref(true);
const showDebugInfo = ref(false);
const debugInfo = ref({
  totalRegions: 0,
  totalPolygons: 0,
  counts: {},
});

// 알림 스토어
const notificationStore = useNotificationStore();

// 지도 초기화
const initializeMap = async () => {
  try {
    // 카카오맵 스크립트 로드
    await mapService.loadKakaoMapScript();

    // 이벤트 핸들러 설정
    mapService.setEventHandlers({
      onRegionHovered: handleRegionHovered,
      onRegionSelected: handleRegionSelected,
      onNotification: handleNotification,
    });

    // 지도 초기화
    const mapInstance = mapService.initializeMap(mapContainer.value);

    if (mapInstance) {
      // GeoJSON 데이터 로드
      await mapService.loadGeoJsonData();
    } else {
      throw new Error("지도 초기화에 실패했습니다");
    }
  } catch (error) {
    notificationStore.showError("지도를 초기화할 수 없습니다");
  } finally {
    isLoading.value = false;
  }
};

// 이벤트 핸들러들
const handleRegionHovered = (regionName) => {
  hoveredRegion.value = regionName;
  emit("region-hovered", regionName);
};

const handleRegionSelected = (regionName) => {
  emit("region-selected", regionName);
};

const handleNotification = (type, message) => {
  switch (type) {
    case "success":
      notificationStore.showSuccess(message);
      break;
    case "error":
      notificationStore.showError(message);
      break;
    case "warning":
      notificationStore.showWarning(message);
      break;
    case "info":
      notificationStore.showInfo(message);
      break;
  }
};

// 디버그 함수들
const showPolygonInfo = () => {
  const info = mapService.showPolygonInfo();
  debugInfo.value = info;
  showDebugInfo.value = true;
};

const resetMapView = () => {
  mapService.resetMapView();
};

const fitToBounds = () => {
  mapService.fitToBounds();
};

// 컴포넌트 마운트
onMounted(() => {
  initializeMap();
});

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  mapService.cleanup();
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

/* 지도 섹션 */
.map-section {
  position: relative;
}

.map-header {
  margin-bottom: $spacing-lg;

  h2 {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    margin-bottom: $spacing-sm;
    color: $primary-color;
  }

  p {
    opacity: 0.7;
    margin-bottom: $spacing-md;
  }
}

.debug-controls {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;

  .glass-btn {
    font-size: 0.875rem;
    padding: $spacing-xs $spacing-sm;
  }

  @media (max-width: $breakpoint-md) {
    justify-content: center;
  }
}

.map-container {
  position: relative;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: $shadow-md;

  @media (max-width: $breakpoint-md) {
    height: 400px;
  }
}

.kakao-map {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(5px);

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba($accent-color, 0.3);
    border-top: 3px solid $accent-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-md;
  }

  p {
    font-weight: $font-weight-medium;
    color: $primary-color;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.hover-tooltip {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  padding: $spacing-sm $spacing-md;
  pointer-events: none;
  z-index: 20;
  min-width: 200px;

  h4 {
    font-size: 1rem;
    font-weight: $font-weight-bold;
    margin-bottom: 4px;
    color: $primary-color;
  }

  p {
    font-size: 0.875rem;
    opacity: 0.7;
    margin: 0;
  }

  @media (max-width: $breakpoint-md) {
    top: $spacing-sm;
    right: $spacing-sm;
    min-width: 150px;
  }
}

.debug-info {
  position: absolute;
  top: $spacing-md;
  left: $spacing-md;
  padding: $spacing-md;
  z-index: 20;
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;

  h4 {
    font-size: 1rem;
    font-weight: $font-weight-bold;
    margin-bottom: $spacing-sm;
    color: $primary-color;
  }

  p {
    font-size: 0.875rem;
    margin-bottom: $spacing-xs;
    color: $primary-color;
  }

  .region-counts {
    margin-top: $spacing-sm;
    max-height: 200px;
    overflow-y: auto;
    border-top: 1px solid rgba($primary-color, 0.1);
    padding-top: $spacing-sm;
  }

  .region-count {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
    font-size: 0.8rem;

    .region-name {
      color: $primary-color;
      opacity: 0.8;
    }

    .count {
      font-weight: $font-weight-medium;
      color: $accent-color;
    }
  }

  .close-btn {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    width: 24px;
    height: 24px;
    padding: 0;
    font-size: 12px;
  }

  @media (max-width: $breakpoint-md) {
    top: $spacing-sm;
    left: $spacing-sm;
    max-width: calc(100% - #{$spacing-md});
  }
}
</style>
