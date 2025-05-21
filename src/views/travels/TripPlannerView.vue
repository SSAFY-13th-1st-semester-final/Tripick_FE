<template>
  <div class="trip-planner-view">
    <!-- 전체 화면 차지하는 카카오맵 -->
    <div class="map-container">
      <KakaoMap
        :usePlacesFromStore="true"
        :showAllDays="true"
        height="100vh"
      />
    </div>

    <!-- 액션 버튼 (플로팅) -->
    <div class="trip-actions-floating" v-if="hasTripInfo">
      <button class="glass-btn" @click="editTripInfo">
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
        >
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          ></path>
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          ></path>
        </svg>
        <span class="btn-text">여행 정보 수정</span>
      </button>
      <button class="glass-btn primary" @click="saveTrip">
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
        >
          <path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
          ></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span class="btn-text">저장하기</span>
      </button>
      <button class="glass-btn primary" @click="handleGetOptimalPaths">
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
        >
          <path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
          ></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span class="btn-text">여행생성</span>
      </button>
    </div>

    <!-- 두 개의 패널 (검색 / 일정) -->
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
          <PlaceSearch />
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
          <TripSchedule @edit-trip-info="editTripInfo" />
        </div>
      </div>
    </div>

    <!-- 모바일용 바텀 시트 -->
    <div v-if="hasTripInfo" class="mobile-bottom-sheet glass-card">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useTravelStore } from "@/stores/travel";
import useTravelService from "@/services/travel.service.js";
import { useNotificationStore } from "@/stores/notification";
import { storeToRefs } from "pinia";
import PlaceSearch from "@/components/travel/PlaceSearch.vue";
import TripSchedule from "@/components/travel/TripSchedule.vue";
import KakaoMap from "@/components/common/utils/KakaoMap.vue";

// 스토어
const travelStore = useTravelStore();
const notificationStore = useNotificationStore();

// 스토어에서 상태 가져오기
const { tripInfo, currentDay, currentDayPlaces, saveAllTripData } = storeToRefs(travelStore);

// 탭 상태 (모바일)
const activeMobileTab = ref("search");

// 패널 접기/펴기 상태
const isSearchPanelCollapsed = ref(false);
const isSchedulePanelCollapsed = ref(false);

// 여행 설정 폼
const tripForm = ref({
  title: "",
  region: null,
  dateRange: {
    startDate: null,
    endDate: null,
  },
  memo: "",
});

// 계산된 속성
const hasTripInfo = computed(() => {
  return (
    tripInfo.value.title && tripInfo.value.startDate && tripInfo.value.endDate
  );
});

const isTripFormValid = computed(() => {
  return (
    tripForm.value.title.trim() !== "" &&
    tripForm.value.region &&
    tripForm.value.dateRange.startDate &&
    tripForm.value.dateRange.endDate
  );
});

// 메서드
const createTrip = () => {
  if (!isTripFormValid.value) {
    notificationStore.showWarning("모든 필수 항목을 입력해주세요.");
    return;
  }

  // 여행 정보 설정
  travelStore.setTripInfo({
    title: tripForm.value.title,
    region: tripForm.value.region,
    startDate: tripForm.value.dateRange.startDate,
    endDate: tripForm.value.dateRange.endDate,
    memo: tripForm.value.memo,
  });

  notificationStore.showSuccess("여행 계획이 생성되었습니다.");
};

const editTripInfo = () => {
  // 현재 여행 정보로 폼 초기화
  tripForm.value = {
    title: tripInfo.value.title,
    region: tripInfo.value.region,
    dateRange: {
      startDate: tripInfo.value.startDate,
      endDate: tripInfo.value.endDate,
    },
    memo: tripInfo.value.memo,
  };

  // 트립 정보 편집 모달 표시 로직 추가 가능
  // ...

  // 여행 정보 초기화
  travelStore.resetTrip();
};

// 컴포넌트에서 간단하게 호출
const handleGetOptimalPaths = async () => {
  try {
    const result = await useTravelService.getOptimalPaths();
  } catch (error) {
    notificationStore.showError('경로 조회에 실패했습니다.');
  }
};

const saveTrip = () => {
  travelStore.saveAllTripData();
};


// 패널 접기/펴기
const toggleSearchPanel = () => {
  isSearchPanelCollapsed.value = !isSearchPanelCollapsed.value;
};

const toggleSchedulePanel = () => {
  isSchedulePanelCollapsed.value = !isSchedulePanelCollapsed.value;
};

// 컴포넌트 마운트 시 저장된 여행 데이터 불러오기
onMounted(() => {
  // 로컬 스토리지에서 저장된 여행 불러오기 (필요한 경우)
  const savedTrip = localStorage.getItem("savedTrip");

  if (savedTrip) {
    try {
      const tripData = JSON.parse(savedTrip);

      // 저장된 여행 정보가 있으면 사용자에게 물어보기
      if (tripData && tripData.tripInfo && tripData.itinerary) {
        if (confirm("저장된 여행 계획을 불러오시겠습니까?")) {
          // 저장된 여행 불러오기
          travelStore.loadTrip(tripData);
          notificationStore.showSuccess("저장된 여행 계획을 불러왔습니다.");
        }
      }
    } catch (error) {
      console.error("여행 불러오기 오류:", error);
    }
  }
});
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

/* 지도 컨테이너 (전체 화면) */
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 플로팅 액션 버튼 */
.trip-actions-floating {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  z-index: 10;
  display: flex;
  gap: $spacing-sm;

  button {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    svg {
      color: inherit;
    }

    @media (max-width: $breakpoint-md) {
      padding: $spacing-xs $spacing-sm;

      .btn-text {
        display: none;
      }
    }
  }
}

.panels-container {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  pointer-events: none; // 컨테이너 자체는 포인터 이벤트를 통과시킴
  height: 90%;

  @media (max-width: $breakpoint-lg) {
    display: none; // 모바일에서는 바텀 시트로 대체
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
  pointer-events: auto; // 패널 내부는 포인터 이벤트 활성화
  overflow: hidden;
  padding: $spacing-md;

  &.collapsed {
    transform: translateX(-290px);

    .panel-content {
      opacity: 0;
    }
  }
}

/* 검색 패널 */
.search-panel {
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* 일정 패널 */
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

/* 패널 접기/펴기 버튼 */
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
  right: 0;
  bottom: 0;
  z-index: 3;
  border-radius: 16px 16px 0 0;
  height: 60vh;

  @media (max-width: $breakpoint-lg) {
    display: block;
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
  height: calc(60vh - 90px);
}

.tab-pane {
  height: 100%;
}
</style>
