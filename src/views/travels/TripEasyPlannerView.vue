<template>
  <div class="travel-planning-page">
    <!-- 백그라운드 -->
    <div class="app-background"></div>
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 메인 컨텐츠 -->
    <main class="travel-main">
      <div class="container">
        <div class="travel-content">
          <!-- 지도 컴포넌트 -->
          <KakaoMapComponent
            @region-selected="handleRegionSelected"
            @region-hovered="handleRegionHovered"
          />

          <!-- 선택된 지역 정보 -->
          <div
            v-if="selectedRegion && regionInfoData[selectedRegion]"
            class="region-info glass-card"
          >
            <div class="region-header">
              <h3>{{ regionInfoData[selectedRegion].name }}</h3>
              <button class="close-btn glass-btn" @click="closeRegionInfo">
                ✕
              </button>
            </div>

            <p class="region-description">
              {{ regionInfoData[selectedRegion].description }}
            </p>

            <div class="attractions">
              <h4>주요 관광지</h4>
              <div class="attraction-tags">
                <span
                  v-for="(attraction, index) in regionInfoData[selectedRegion]
                    .attractions"
                  :key="index"
                  class="glass-tag"
                >
                  {{ attraction }}
                </span>
              </div>
            </div>

            <div class="region-actions">
              <button class="glass-btn primary" @click="addToTravelPlan">
                여행 계획 추가
              </button>
              <button class="glass-btn" @click="viewDetails">
                상세 정보 보기
              </button>
            </div>
          </div>

          <!-- 여행 기록 컴포넌트 (v-show 방식 - 대안) -->
          <TripHistoryComponent
            v-show="selectedRegion"
            :key="`trip-history-${selectedRegion || 'none'}`"
            :region="selectedRegion || ''"
            class="trip-history-wrapper"
          />

          <!-- 가이드 섹션 -->
          <div class="guide-section glass-card">
            <h3>여행 계획 가이드</h3>
            <div class="guide-steps">
              <div class="guide-step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>지역 선택</h4>
                  <p>지도에서 원하는 여행 지역을 클릭하세요</p>
                </div>
              </div>
              <div class="guide-step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>정보 확인</h4>
                  <p>선택한 지역의 관광지와 여행 기록을 확인하세요</p>
                </div>
              </div>
              <div class="guide-step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>계획 추가</h4>
                  <p>마음에 드는 지역을 여행 계획에 추가하세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { useNotificationStore } from "@/stores/notification";
import { regionInfo } from "@/assets/data/travelData";
import KakaoMapComponent from "@/components/plan/KakaoMapComponent.vue";
import TripHistoryComponent from "@/components/plan/TripHistoryComponent.vue";

// 반응형 상태
const selectedRegion = ref(null);
const hoveredRegion = ref(null);

// 데이터
const regionInfoData = regionInfo;

// 알림 스토어
const notificationStore = useNotificationStore();

// 이벤트 핸들러
const handleRegionSelected = async (regionName) => {
  try {
    // 이전 선택 초기화
    selectedRegion.value = null;

    // DOM 업데이트 대기
    await nextTick();

    // 새 지역 선택
    selectedRegion.value = regionName;
    notificationStore.showInfo(`${regionName} 이(가) 선택되었습니다`);
  } catch (error) {
    notificationStore.showError("지역 선택 중 문제가 발생했습니다");
  }
};

const handleRegionHovered = (regionName) => {
  hoveredRegion.value = regionName;
};

const closeRegionInfo = async () => {
  try {
    selectedRegion.value = null;
    await nextTick();
  } catch (error) {
    return null;
  }
};

const addToTravelPlan = () => {
  if (selectedRegion.value) {
    notificationStore.showSuccess(`준비 중인 기능입니다.`);
    // TODO: 실제 여행 계획 저장 로직 구현
  }
};

const viewDetails = () => {
  if (selectedRegion.value) {
    notificationStore.showInfo(`준비 중인 기능입니다.`);
    // TODO: 상세 페이지로 라우팅
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.travel-planning-page {
  min-height: 100vh;
  position: relative;
}

/* 메인 컨텐츠 */
.travel-main {
  padding-top: $spacing-xl;
  padding-bottom: $spacing-3xl;
}

.travel-content {
  display: grid;
  gap: $spacing-lg;

  @media (min-width: $breakpoint-lg) {
    grid-template-columns: 2fr 1fr;
  }

  // 지도 컴포넌트가 2행을 차지하도록 설정
  :deep(.map-section) {
    @media (min-width: $breakpoint-lg) {
      grid-row: span 2;
    }
  }
}

/* 지역 정보 */
.region-info {
  animation: slideIn 300ms ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.region-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;

  h3 {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    color: $primary-color;
    margin: 0;
  }
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 14px;
  transition: all $transition-fast;

  &:hover {
    transform: scale(1.1);
  }
}

.region-description {
  margin-bottom: $spacing-lg;
  font-size: 1rem;
  line-height: 1.6;
  color: $primary-color;
}

.attractions {
  margin-bottom: $spacing-lg;

  h4 {
    font-size: 1.125rem;
    font-weight: $font-weight-bold;
    margin-bottom: $spacing-sm;
    color: $primary-color;
  }
}

.attraction-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.region-actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;

  @media (max-width: $breakpoint-md) {
    flex-direction: column;
  }

  .glass-btn {
    flex: 1;
    text-align: center;
    min-width: 120px;

    @media (max-width: $breakpoint-md) {
      width: 100%;
    }
  }
}

/* 가이드 섹션 */
.guide-section {
  h3 {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    margin-bottom: $spacing-lg;
    color: $primary-color;
  }
}

.guide-steps {
  display: grid;
  gap: $spacing-md;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
}

.step-number {
  width: 32px;
  height: 32px;
  background: rgba($accent-color, 0.85);
  color: $white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-weight-bold;
  flex-shrink: 0;
  font-size: 0.875rem;
}

.step-content {
  h4 {
    font-size: 1.125rem;
    font-weight: $font-weight-bold;
    margin-bottom: 4px;
    color: $primary-color;
  }

  p {
    opacity: 0.7;
    line-height: 1.5;
    margin: 0;
  }
}

/* 반응형 디자인 */
@media (max-width: $breakpoint-md) {
  .travel-content {
    grid-template-columns: 1fr;
  }
}

/* 여행 기록 래퍼 */
.trip-history-wrapper {
  // v-show로 인해 숨겨진 상태에서도 레이아웃 유지
  &[style*="display: none"] {
    display: none !important;
  }
}
</style>
