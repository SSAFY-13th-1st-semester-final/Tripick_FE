<template>
  <div class="trip-planner-view">
    <!-- 로딩 상태 표시 -->
    <div v-if="isLoading" class="loading-overlay glass-card">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>여행 데이터를 불러오는 중...</p>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <template v-else>
      <!-- 전체 화면 카카오맵 -->
      <div class="map-container">
        <KakaoMap
          v-if="isMapReady"
          :key="mapKey"
          :usePlacesFromStore="true"
          :showAllDays="true"
          height="100vh"
          @map-ready="onMapReady"
        />
      </div>

      <!-- 데스크탑 패널 (검색 / 일정) -->
      <div class="panels-container">
        <!-- 장소 검색 패널 -->
        <div
          class="panel search-panel glass-card"
          :class="{ collapsed: isSearchPanelCollapsed }"
        >
          <div class="panel-header">
            <h3>장소 검색</h3>
            <button class="panel-toggle glass-btn" @click="toggleSearchPanel">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :class="{ 'rotate-180': isSearchPanelCollapsed }"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
          <div class="panel-content">
            <PlaceSearch v-if="isComponentsReady" />
          </div>
        </div>

        <!-- 일정 관리 패널 -->
        <div
          class="panel schedule-panel glass-card"
          :class="{ collapsed: isSchedulePanelCollapsed }"
        >
          <div class="panel-header">
            <h3>일정 관리</h3>
            <button class="panel-toggle glass-btn" @click="toggleSchedulePanel">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :class="{ 'rotate-180': !isSchedulePanelCollapsed }"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <div class="panel-content">
            <TripSchedule
              v-if="isComponentsReady && hasTripInfo"
              @edit-trip-info="editTripInfo"
            />
          </div>
        </div>
      </div>

      <!-- 모바일용 바텀 시트 -->
      <div
        v-if="hasTripInfo && isComponentsReady"
        class="mobile-bottom-sheet glass-card"
      >
        <div class="sheet-handle"></div>
        <div class="trip-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeMobileTab === 'search' }"
            @click="activeMobileTab = 'search'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            장소 검색
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeMobileTab === 'schedule' }"
            @click="activeMobileTab = 'schedule'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            일정 관리
          </button>
        </div>

        <div class="tab-content">
          <div v-if="activeMobileTab === 'search'" class="tab-pane">
            <PlaceSearch />
          </div>
          <div v-if="activeMobileTab === 'schedule'" class="tab-pane">
            <TripSchedule @edit-trip-info="editTripInfo" />
          </div>
        </div>
      </div>

      <!-- 하단 액션 툴바 -->
      <MapActionBar
        v-if="hasTripInfo"
        :is-temporary-saved="isTemporarySaved"
        :is-temporary-saving="isTemporarySaving"
        :is-ai-evaluation-visible="isAiEvaluationVisible"
        @temporary-save="handleTemporarySave"
        @optimize-paths="handleGetOptimalPaths"
        @save-trip="handleSaveUserTrip"
        @toggle-ai-evaluation="toggleAiEvaluation"
      />

      <!-- AI 여행 일정 평가 카드 -->
      <AiTripEvaluationCard
        v-if="isAiEvaluationVisible && hasTripInfo"
        ref="aiEvaluationCardRef"
        :initial-position="aiCardPosition"
        @evaluation-requested="handleAiEvaluationRequest"
      />
    </template>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { useTravelStore } from "@/stores/travel";
import useTravelService from "@/services/travel.service.js";
import AiService from "@/services/ai.service.js";
import { useNotificationStore } from "@/stores/notification";
import { storeToRefs } from "pinia";
import PlaceSearch from "@/components/travel/PlaceSearch.vue";
import TripSchedule from "@/components/travel/TripSchedule.vue";
import KakaoMap from "@/components/common/utils/KakaoMap.vue";
import MapActionBar from "@/components/common/shared/MapActionBar.vue";
import AiTripEvaluationCard from "@/components/travel/AiTripEvaluationCard.vue";
import travelService from "@/services/travel.service";

// 스토어
const router = useRouter();
const travelStore = useTravelStore();
const notificationStore = useNotificationStore();
const { tripInfo, isTemporarySaved } = storeToRefs(travelStore);

// 상태 관리
const isLoading = ref(true);
const isMapReady = ref(false);
const isComponentsReady = ref(false);
const mapKey = ref(0);
const isTemporarySaving = ref(false);
const activeMobileTab = ref("search");
const isSearchPanelCollapsed = ref(false);
const isSchedulePanelCollapsed = ref(false);
const isAiEvaluationVisible = ref(false);
const aiCardPosition = ref({ x: 100, y: 100 });
const isTripSaved = ref(false); // 여행 저장 상태 추적

// AI 평가 카드 참조
const aiEvaluationCardRef = ref(null);

// 계산된 속성
const hasTripInfo = computed(() => {
  return Boolean(
    tripInfo.value.title && tripInfo.value.startDate && tripInfo.value.endDate
  );
});

// ===== 라이프사이클 관리 =====

// 페이지 이동 시 세션 정리
onBeforeRouteLeave(async (to, from, next) => {
  try {
    const hasTripData = travelStore.hasTripData;

    // 여행이 정식 저장된 경우에는 confirm 창을 띄우지 않음
    if (isTripSaved.value) {
      travelStore.clearNewTripFromSession();
      travelStore.resetTrip();
      next();
      return;
    }

    if (hasTripData) {
      const shouldSave = confirm(
        "현재 작업 중인 여행 계획이 있습니다.\n\n" +
          "확인: 임시 저장하고 나가기\n" +
          "취소: 저장하지 않고 나가기"
      );

      if (shouldSave) {
        const saveResult = travelStore.saveTripToLocalStorage();
        if (saveResult.success) {
          notificationStore.showSuccess("여행 계획이 임시 저장되었습니다.");
        } else {
          notificationStore.showError("임시 저장에 실패했습니다.");
        }
      }
    }

    travelStore.clearNewTripFromSession();
    travelStore.resetTrip();
    next();
  } catch (error) {
    notificationStore.showError("페이지 이동 중 오류가 발생했습니다.");
    travelStore.clearNewTripFromSession();
    next();
  }
});

// 컴포넌트 해제 시 정리
onBeforeUnmount(() => {
  travelStore.clearNewTripFromSession();
  travelStore.resetTrip();
});

// 브라우저 창 닫기/새로고침 처리
const handleBeforeUnload = (event) => {
  // 여행이 이미 저장된 경우에는 확인 창을 띄우지 않음
  if (isTripSaved.value) {
    travelStore.clearNewTripFromSession();
    travelStore.resetTrip();
    return;
  }

  if (travelStore.hasTripData) {
    travelStore.saveTripToLocalStorage();
    travelStore.resetTrip();
  }

  travelStore.clearNewTripFromSession();
  travelStore.resetTrip();

  if (travelStore.hasTripData && !isTripSaved.value) {
    event.preventDefault();
    event.returnValue = "작업 중인 여행 계획이 있습니다. 정말 나가시겠습니까?";
    return event.returnValue;
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  initializeComponent();
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

// ===== 초기화 및 맵 관리 =====

const initializeComponent = async () => {
  isLoading.value = true;

  try {
    const result = await travelStore.initializeTripPlannerView();

    switch (result) {
      case "new":
        notificationStore.showSuccess("새로운 여행 계획을 시작합니다.");
        break;
      case "existing":
        if (travelStore.hasTripData) {
          notificationStore.showInfo("저장된 여행 계획을 불러왔습니다.");
        }
        break;
      case "empty":
        notificationStore.showInfo("여행 계획을 새로 작성해주세요.");
        break;
      case "error":
        notificationStore.showError(
          "여행 계획을 불러오는 중 오류가 발생했습니다."
        );
        break;
    }

    await nextTick();
    isMapReady.value = true;
    await nextTick();
    isComponentsReady.value = true;
  } catch (error) {
    notificationStore.showError("페이지 초기화 중 오류가 발생했습니다.");
  } finally {
    isLoading.value = false;
  }
};

const onMapReady = () => {
  // 맵 준비 완료 후 추가 작업 필요 시 처리
};

// 여행 정보 변경 감지하여 맵 리렌더링
watch(
  () => tripInfo.value,
  async (newTripInfo, oldTripInfo) => {
    if (newTripInfo && newTripInfo !== oldTripInfo) {
      await nextTick();
      mapKey.value += 1;
    }
  },
  { deep: true }
);

// ===== 액션 핸들러 =====

const handleGetOptimalPaths = async () => {
  if (!travelStore.hasTripData) {
    notificationStore.showWarning("여행 계획 데이터가 없습니다.");
    return;
  }

  try {
    notificationStore.showInfo("경로 최적화를 요청합니다...");
    const result = await useTravelService.getOptimalPaths();

    if (result.status) {
      notificationStore.showSuccess("경로가 최적화되었습니다.");
    } else {
      notificationStore.showError(
        result.message || "경로 최적화에 실패했습니다."
      );
    }
  } catch (error) {
    notificationStore.showError("경로 최적화 중 오류가 발생했습니다.");
  }
};

const handleTemporarySave = async () => {
  if (!travelStore.hasTripData) {
    notificationStore.showWarning("저장할 여행 데이터가 없습니다.");
    return;
  }

  isTemporarySaving.value = true;

  try {
    const result = travelStore.moveNewTripToLocalStorage();

    if (result.success) {
      notificationStore.showSuccess("여행 계획이 임시저장되었습니다.");
    } else {
      notificationStore.showError(result.message || "임시저장에 실패했습니다.");
    }
  } catch (error) {
    notificationStore.showError("임시저장 중 오류가 발생했습니다.");
  } finally {
    isTemporarySaving.value = false;
  }
};

const handleSaveUserTrip = async () => {
  if (!travelStore.hasTripData) {
    notificationStore.showWarning("저장할 여행 데이터가 없습니다.");
    return;
  }

  try {
    notificationStore.showInfo("여행을 저장하는 중...");
    await travelService.saveTrip();

    // 저장 성공 처리
    isTripSaved.value = true;
    notificationStore.showSuccess("여행이 성공적으로 저장되었습니다.");

    // 스토어 상태 정리 (저장 완료 후 임시 데이터 정리)
    travelStore.clearNewTripFromSession();

    // 저장 성공 후 프로필 페이지로 리다이렉트
    setTimeout(() => {
      router.push({ name: "profile" });
    }, 1000); // 1초 후 이동 (사용자가 성공 메시지를 볼 수 있도록)
  } catch (error) {
    notificationStore.showError("여행 저장에 실패했습니다.");
    isTripSaved.value = false; // 저장 실패 시 플래그 리셋
  }
};

// ===== UI 컨트롤 =====

const toggleSearchPanel = () => {
  isSearchPanelCollapsed.value = !isSearchPanelCollapsed.value;
};

const toggleSchedulePanel = () => {
  isSchedulePanelCollapsed.value = !isSchedulePanelCollapsed.value;
};

const toggleAiEvaluation = () => {
  isAiEvaluationVisible.value = !isAiEvaluationVisible.value;

  if (isAiEvaluationVisible.value) {
    // AI 카드를 화면 중앙 근처에 배치
    aiCardPosition.value = {
      x: Math.max(50, (window.innerWidth - 320) / 2 - 100),
      y: Math.max(50, (window.innerHeight - 400) / 2),
    };
    notificationStore.showInfo("AI 일정 평가 카드가 활성화되었습니다.");
  } else {
    notificationStore.showInfo("AI 일정 평가 카드가 비활성화되었습니다.");
  }
};

const handleAiEvaluationRequest = async ({ dayIndex }) => {
  if (!aiEvaluationCardRef.value) return;

  // 로딩 상태 설정
  aiEvaluationCardRef.value.setLoading(true);

  try {
    // 선택된 일차에 장소가 있는지 확인
    const dayItinerary = travelStore.itinerary[dayIndex] || [];
    const places = dayItinerary.filter((place) => place && place.id != null);

    if (places.length === 0) {
      aiEvaluationCardRef.value.setEvaluationError(
        "선택한 일차에 평가할 장소가 없습니다."
      );
      notificationStore.showWarning(
        "해당 일차에 장소를 추가한 후 평가를 요청해주세요."
      );
      return;
    }

    notificationStore.showInfo(
      `${dayIndex + 1}일차 일정에 대한 AI 평가를 요청합니다...`
    );

    // AI 평가 API 호출
    const response = await AiService.requestAiTripEvaluation({
      dayIndex,
    });

    // 응답 처리
    if (response && response.data && response.data.data) {
      aiEvaluationCardRef.value.setEvaluationData(response.data.data);
      notificationStore.showSuccess(
        `${dayIndex + 1}일차 AI 평가가 완료되었습니다!`
      );
    } else {
      aiEvaluationCardRef.value.setEvaluationError(
        "평가 데이터를 가져올 수 없습니다."
      );
      notificationStore.showError("AI 평가 생성에 실패했습니다.");
    }
  } catch (err) {
    // 오류 처리
    let errorMessage = "AI 평가 서비스 오류가 발생했습니다.";

    if (err.response && err.response.status === 401) {
      errorMessage = "세션이 만료되었습니다. 다시 로그인해주세요.";
    } else if (err.response && err.response.status === 403) {
      errorMessage = "AI 평가 서비스 이용 권한이 없습니다.";
    } else if (err.response && err.response.status === 429) {
      errorMessage = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    } else if (err.response && err.response.status >= 500) {
      errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }

    aiEvaluationCardRef.value.setEvaluationError(errorMessage);
    notificationStore.showError(errorMessage, {
      duration: 5000,
      closable: true,
    });
  }
};

const editTripInfo = () => {
  notificationStore.showInfo("여행 정보 편집 기능은 준비 중입니다.");
};

// 개발용 디버그 (개발 모드에서만)
if (process.env.NODE_ENV === "development") {
  window.tripPlannerDebug = {
    manualCleanup: () => {
      travelStore.clearNewTripFromSession();
      notificationStore.showInfo("세션이 수동으로 정리되었습니다.");
    },
    manualSave: () => {
      const result = travelStore.saveTripToLocalStorage();
      if (result.success) {
        notificationStore.showSuccess("수동 저장 완료");
      } else {
        notificationStore.showError("수동 저장 실패");
      }
    },
    store: travelStore,
  };
}
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.trip-planner-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.loading-content {
  text-align: center;
  padding: $spacing-xl;

  p {
    margin-top: $spacing-md;
    color: $primary-color;
    font-weight: $font-weight-medium;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($accent-color, 0.3);
  border-top: 3px solid $accent-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 지도 컨테이너 */
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;

  // 지도 호버 애니메이션 강제 제거
  * {
    transform: none !important;
    transition: none !important;
  }

  // KakaoMap 컴포넌트의 호버 효과 제거
  :deep(.glass-card) {
    transform: none !important;
    transition: none !important;

    &:hover {
      transform: none !important;
      box-shadow: inherit !important;
    }
  }
}

/* 데스크탑 패널 컨테이너 */
.panels-container {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  pointer-events: none;
  height: 90%;

  @media (max-width: $breakpoint-lg) {
    display: none;
  }
}

/* 패널 공통 스타일 */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 400px;
  max-width: 90vw;
  border-radius: 0 12px 12px 0;
  transition: transform $transition-normal;
  pointer-events: auto;
  overflow: hidden;
  padding: $spacing-md;

  &.collapsed {
    transform: translateX(-290px);

    .panel-content {
      opacity: 0;
    }
  }
}

.search-panel {
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.schedule-panel {
  margin-left: $spacing-sm;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;

  &.collapsed {
    transform: translateX(-290px);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid rgba($medium-gray, 0.3);

  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: $primary-color;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-sm;
  transition: opacity $transition-normal;
}

.panel-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  svg {
    transition: transform $transition-fast;

    &.rotate-180 {
      transform: rotate(180deg);
    }
  }
}

/* 모바일용 바텀 시트 */
.mobile-bottom-sheet {
  display: none;
  position: fixed;
  left: 0;
  right: 80px; /* 우측에 MapActionBar 공간 확보 */
  bottom: $spacing-md;
  z-index: 3;
  border-radius: 16px 16px 0 0;
  height: calc(60vh - 40px);

  @media (max-width: $breakpoint-lg) {
    display: block;
  }

  @media (max-width: $breakpoint-sm) {
    right: 70px; /* 모바일에서는 조금 더 좁게 */
  }
}

.sheet-handle {
  width: 40px;
  height: 5px;
  background-color: rgba($medium-gray, 0.6);
  border-radius: 3px;
  margin: $spacing-sm auto;
}

.trip-tabs {
  display: flex;
  border-bottom: 1px solid rgba($medium-gray, 0.3);
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  color: $dark-gray;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-fast;

  svg {
    transition: all $transition-fast;
  }

  &:hover {
    background-color: rgba($accent-color, 0.05);
    color: $accent-color;

    svg {
      color: $accent-color;
    }
  }

  &.active {
    color: $accent-color;
    position: relative;

    svg {
      color: $accent-color;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: $accent-color;
    }
  }
}

.tab-content {
  padding: $spacing-md;
  overflow-y: auto;
  height: calc(60vh - 130px);
}
</style>
