<template>
  <!-- 일반 페이지 모드 -->
  <div v-if="!isModal" class="trip-plan-container">
    <div class="app-background"></div>
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <div class="container">
      <div class="trip-form-container glass-card">
        <TripPlannerContent 
          :current-step="currentStep"
          :selected-region="selectedRegion"
          :date-range="dateRange"
          :trip-title="tripTitle"
          :trip-memo="tripMemo"
          :is-loading="isLoading"
          :progress-width="progressWidth"
          :is-date-valid="isDateValid"
          :trip-duration="tripDuration"
          @next-step="goToNextStep"
          @prev-step="goToPrevStep"
          @region-selected="onRegionSelected"
          @date-selected="onDateSelected"
          @create-trip="createTripPlan"
          @update:title="tripTitle = $event"
          @update:memo="tripMemo = $event"
        />
      </div>
    </div>
  </div>

  <!-- 모달 모드 - Teleport를 사용해 body에 직접 렌더링 -->
  <Teleport to="body" v-if="isModal">
    <div class="modal-overlay" @click="handleBackdropClick">
      <div class="modal-container" @click.stop>
        <div class="modal-content">
          <button class="modal-close" @click="$emit('close')">
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <TripPlannerContent 
            :current-step="currentStep"
            :selected-region="selectedRegion"
            :date-range="dateRange"
            :trip-title="tripTitle"
            :trip-memo="tripMemo"
            :is-loading="isLoading"
            :progress-width="progressWidth"
            :is-date-valid="isDateValid"
            :trip-duration="tripDuration"
            :is-modal="true"
            @next-step="goToNextStep"
            @prev-step="goToPrevStep"
            @region-selected="onRegionSelected"
            @date-selected="onDateSelected"
            @create-trip="createTripPlan"
            @cancel="$emit('close')"
            @update:title="tripTitle = $event"
            @update:memo="tripMemo = $event"
          />
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이도 별도로 모달에 포함 -->
    <div v-if="isLoading" class="modal-loading-overlay">
      <div class="loading-spinner"></div>
      <p>여행 계획을 생성하는 중입니다...</p>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { useTravelStore } from "@/stores/travel";
import TripPlannerContent from "./TripPlannerContent.vue";

// Props 정의
const props = defineProps({
  isModal: {
    type: Boolean,
    default: false,
  },
});

// Emits 정의
const emit = defineEmits(["close", "trip-created"]);

const router = useRouter();
const notificationStore = useNotificationStore();
const travelStore = useTravelStore();

// 상태
const currentStep = ref(1);
const selectedRegion = ref(null);
const dateRange = ref({ startDate: null, endDate: null });
const tripTitle = ref("");
const tripMemo = ref("");
const isLoading = ref(false);

// 계산된 속성
const progressWidth = computed(() => {
  return `${(currentStep.value / 2) * 100}%`;
});

const isDateValid = computed(() => {
  return Boolean(dateRange.value.startDate && dateRange.value.endDate);
});

const tripDuration = computed(() => {
  if (!dateRange.value.startDate || !dateRange.value.endDate) return 0;

  const start = new Date(dateRange.value.startDate);
  const end = new Date(dateRange.value.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  console.log(start);
  console.log(end);

  return Math.max(1, diffDays + 1); // 최소 1일 보장
});

const isFormValid = computed(() => {
  return (
    tripTitle.value.trim() !== "" &&
    selectedRegion.value !== null &&
    isDateValid.value
  );
});

// 메서드
const goToNextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++;
  }
};

const goToPrevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const onRegionSelected = (region) => {
  selectedRegion.value = region;
};

const onDateSelected = (range) => {
  dateRange.value = range;
};

const handleBackdropClick = () => {
  emit('close');
};

const createTripPlan = () => {
  if (!isFormValid.value) {
    notificationStore.showWarning("여행 제목, 지역, 날짜를 모두 입력해주세요.");
    return;
  }

  isLoading.value = true;

  try {
    travelStore.setTripInfo({
      title: tripTitle.value,
      region: selectedRegion.value,
      startDate: dateRange.value.startDate,
      endDate: dateRange.value.endDate,
      memo: tripMemo.value,
    });

    setTimeout(() => {
      isLoading.value = false;
      notificationStore.showSuccess("여행 계획이 성공적으로 생성되었습니다!");

      if (props.isModal) {
        emit("trip-created");
        emit("close");
      }

      router.push({ name: "travel-planner" });
    }, 800);
  } catch (error) {
    console.error("여행 계획 생성 오류:", error);
    isLoading.value = false;
    notificationStore.showError("여행 계획 생성 중 오류가 발생했습니다.");
  }
};

const resetForm = () => {
  currentStep.value = 1;
  selectedRegion.value = null;
  dateRange.value = { startDate: null, endDate: null };
  tripTitle.value = "";
  tripMemo.value = "";
};

onMounted(() => {
  // 모달이 열릴 때 body 스크롤 방지
  if (props.isModal) {
    document.body.style.overflow = 'hidden';
  }
});

// 모달 모드 변경 감지
watch(
  () => props.isModal,
  (newValue) => {
    if (newValue) {
      resetForm();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

// 컴포넌트 언마운트 시 body 스크롤 복원
onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

// 일반 페이지 모드 스타일
.trip-plan-container {
  min-height: 100vh;
  position: relative;
}

.container {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-md;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: $breakpoint-md) {
    padding: 0 $spacing-sm;
  }
}

.trip-form-container {
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  padding: $spacing-xl;
  border-radius: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: $breakpoint-md) {
    padding: $spacing-lg;
  }
}

// 모달 스타일
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: $spacing-md;
  
  @media (max-width: $breakpoint-md) {
    padding: $spacing-xs;
  }
}

.modal-container {
  width: 100%;
  max-width: 1000px;
  height: 70vh;
  min-height: 750px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.modal-close {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: $dark-gray;
  padding: 8px;
  margin: 0;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:hover {
    background-color: rgba($primary-color, 0.1);
    color: $primary-color;
  }
}

.modal-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  color: $white;

  p {
    margin-top: $spacing-md;
    font-weight: $font-weight-medium;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($white, 0.3);
  border-radius: 50%;
  border-top-color: $white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>