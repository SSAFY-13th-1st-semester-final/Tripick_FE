<template>
  <div class="map-action-bar glass-card">
    <div class="action-bar-content">
      <!-- 왼쪽 경로 컨트롤 패널 -->
      <div v-if="hasRoutePaths" class="route-controls-section">
        <div class="route-summary-info">
          <span class="route-distance">{{ formattedTotalDistance }}</span>
          <span class="route-time">{{ formattedTotalDuration }}</span>
        </div>
        
        <div class="route-day-controls">
          <button 
            class="route-day-btn glass-btn"
            :class="{ active: showAllRoutes }"
            @click="toggleAllRoutes"
          >
            <span class="btn-icon">🗺️</span>
            전체 경로
          </button>
          
          <button 
            v-for="(dayPath, index) in optimizedPaths" 
            :key="`route-day-${index}`"
            class="route-day-btn glass-btn"
            :class="{ active: visibleDays.has(index) }"
            @click="toggleDayRoute(index)"
            :style="{ 
              borderColor: getDayColor(index),
              '--day-color': getDayColor(index)
            }"
          >
            <span class="btn-day-number">{{ index + 1 }}</span>
            <span class="btn-day-text">일차</span>
          </button>
        </div>
        
        <!-- 경로 정보 요약 -->
        <div v-if="visibleDays.size > 0 || showAllRoutes" class="route-info-summary">
          <div class="route-stats">
            <div class="stat-item">
              <span class="stat-label">활성 경로</span>
              <span class="stat-value">{{ activeRoutesCount }}개</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">총 장소</span>
              <span class="stat-value">{{ totalPlacesCount }}곳</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 중앙 액션 버튼들 -->
      <div class="action-buttons">
        <!-- 경로 최적화 -->
        <button
          class="action-btn glass-btn primary"
          :class="{ loading: isOptimizing }"
          :disabled="isOptimizing || !canOptimize"
          @click="optimizeRoute"
          title="경로 최적화"
        >
          <div class="btn-icon-wrapper">
            <svg v-if="!isOptimizing" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"></path>
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <path d="M12 12l2 2 4-4"></path>
            </svg>
            <div v-else class="loading-spinner-small"></div>
          </div>
          <span class="btn-text">{{ isOptimizing ? '최적화 중...' : '경로 최적화' }}</span>
        </button>

        <!-- 여행 저장 -->
        <button
          class="action-btn glass-btn success"
          :disabled="isSaving"
          @click="saveTrip"
          title="여행 저장"
        >
          <div class="btn-icon-wrapper">
            <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <div v-else class="loading-spinner-small"></div>
          </div>
          <span class="btn-text">{{ isSaving ? '저장 중...' : '여행 저장' }}</span>
        </button>

        <!-- 여행 수정 -->
        <button
          class="action-btn glass-btn accent"
          @click="editTrip"
          title="여행 수정"
        >
          <div class="btn-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
              <path d="m15 5 4 4"></path>
            </svg>
          </div>
          <span class="btn-text">수정</span>
        </button>
      </div>

      <!-- 오른쪽 추가 액션 -->
      <div class="action-extras">
        <!-- 설정 -->
        <button
          class="extra-btn glass-btn"
          @click="openSettings"
          title="설정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m7-4a4 4 0 0 1 8 0m-8 8a4 4 0 0 1 8 0"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTravelStore } from '@/stores/travel'
import { useTravelResultStore } from '@/stores/travel.result'
import { useNotificationStore } from '@/stores/notification'

// Props
const props = defineProps({
  showRoutes: {
    type: Boolean,
    default: false
  },
  canOptimize: {
    type: Boolean,
    default: true
  },
  canShare: {
    type: Boolean,
    default: true
  },
  showAllRoutes: {
    type: Boolean,
    default: false
  },
  visibleDays: {
    type: Set,
    default: () => new Set()
  },
  optimizedPaths: {
    type: Array,
    default: () => []
  },
  activeRoutesCount: {
    type: Number,
    default: 0
  },
  totalPlacesCount: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits([
  'optimize-route',
  'save-trip',
  'edit-trip',
  'toggle-all-routes',
  'toggle-day-route',
  'open-settings'
])

// Stores
const travelStore = useTravelStore()
const travelResultStore = useTravelResultStore()
const notificationStore = useNotificationStore()

// Store 상태
const { 
  formattedTotalDistance, 
  formattedTotalDuration,
  hasResult
} = storeToRefs(travelResultStore)

// 로컬 상태
const isOptimizing = ref(false)
const isSaving = ref(false)

// 계산된 속성
const hasRoutePaths = computed(() => hasResult.value && props.optimizedPaths?.length > 0)

// 일차별 색상 배열
const dayColors = [
  '#0064FF', // 1일차: 파란색 (Toss Blue)
  '#FF3B30', // 2일차: 빨간색
  '#4CD964', // 3일차: 초록색
  '#FF9500', // 4일차: 주황색
  '#5856D6', // 5일차: 보라색
  '#FF2D55', // 6일차: 분홍색
  '#FFCC00', // 7일차: 노란색
  '#5AC8FA', // 8일차: 하늘색
  '#8E8E93', // 9일차: 다크 그레이
  '#34C759', // 10일차: 밝은 연두색
  '#AF52DE', // 11일차: 라벤더 보라
  '#FFD60A', // 12일차: 레몬 옐로우
  '#FF9F0A', // 13일차: 딥 오렌지
  '#00C7BE', // 14일차: 민트
  '#BF5AF2'  // 15일차: 연보라
];

// 일차별 색상 반환
const getDayColor = (dayIndex) => {
  return dayColors[dayIndex % dayColors.length];
};

// 메서드들
const optimizeRoute = async () => {
  if (isOptimizing.value || !props.canOptimize) return
  
  isOptimizing.value = true
  try {
    emit('optimize-route')
    notificationStore.showInfo('경로를 최적화하고 있습니다...')
  } catch (error) {
    notificationStore.showError('경로 최적화에 실패했습니다.')
  } finally {
    setTimeout(() => {
      isOptimizing.value = false
    }, 2000)
  }
}

const saveTrip = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  try {
    emit('save-trip')
    notificationStore.showSuccess('여행이 성공적으로 저장되었습니다!')
  } catch (error) {
    notificationStore.showError('여행 저장에 실패했습니다.')
  } finally {
    setTimeout(() => {
      isSaving.value = false
    }, 1500)
  }
}

const editTrip = () => {
  emit('edit-trip')
}

const toggleAllRoutes = () => {
  emit('toggle-all-routes')
}

const toggleDayRoute = (dayIndex) => {
  emit('toggle-day-route', dayIndex)
}

const openSettings = () => {
  emit('open-settings')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles' as *;

.map-action-bar {
  position: fixed;
  bottom: $spacing-xl;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  min-width: 320px;
  max-width: 90vw;
  
  @include glassmorphism(0.85, 16px);
  border-radius: 20px;
  padding: $spacing-md $spacing-lg;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

}

.action-bar-content {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  justify-content: space-between;
}

.route-controls-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  min-width: 300px;
  
  .route-summary-info {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
    
    .route-distance,
    .route-time {
      font-size: 12px;
      color: $accent-color;
      font-weight: $font-weight-medium;
      padding: 4px 8px;
      background: rgba($accent-color, 0.1);
      border-radius: 6px;
    }
  }
  
  .route-day-controls {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    
    .route-day-btn {
      min-height: 36px;
      border-radius: 8px;
      padding: $spacing-xs $spacing-sm;
      font-size: 12px;
      color: $primary-color;
      border: 2px solid rgba($medium-gray, 0.3);
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-weight: $font-weight-medium;
      transition: none !important;
      
      .btn-icon {
        font-size: 14px;
      }
      
      .btn-day-number {
        font-weight: $font-weight-bold;
        font-size: 13px;
      }
      
      .btn-day-text {
        font-size: 11px;
      }
      
      &:hover {
        border-color: var(--day-color, $accent-color) !important;
        transform: none !important;
        box-shadow: none !important;
      }
      
      &.active {
        background: var(--day-color, $accent-color) !important;
        border-color: var(--day-color, $accent-color) !important;
        color: $white !important;
      }
    }
  }
  
  .route-info-summary {
    @include glassmorphism(0.4, 8px);
    padding: $spacing-sm;
    border-radius: 8px;
    
    .route-stats {
      display: flex;
      gap: $spacing-md;
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .stat-label {
          font-size: 10px;
          color: $dark-gray;
          margin-bottom: 2px;
        }
        
        .stat-value {
          font-size: 14px;
          font-weight: $font-weight-bold;
          color: $accent-color;
        }
      }
    }
  }
}

.action-buttons {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border-radius: 12px;
  font-size: 13px;
  font-weight: $font-weight-medium;
  min-height: 44px;
  
  // 기본 글래스 버튼 스타일 확장
  &.glass-btn {
    @include glassmorphism(0.3, 8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: none !important; // 트랜지션 강제 비활성화
    
    // 모든 호버 효과 강제 비활성화
    &:hover,
    &:hover:not(:disabled) {
      transform: none !important;
      box-shadow: none !important;
      scale: 1 !important;
    }
    
    &:active,
    &:active:not(:disabled) {
      transform: none !important;
      scale: 1 !important;
    }
    
    &.primary {
      background: linear-gradient(135deg, $accent-color 0%, rgba($accent-color, 0.8) 100%);
      color: $white;
      border-color: $accent-color;
      
      &:hover,
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, $accent-color 0%, rgba($accent-color, 0.8) 100%) !important;
      }
    }
    
    &.success {
      background: linear-gradient(135deg, $success-color 0%, rgba($success-color, 0.8) 100%);
      color: $white;
      border-color: $success-color;
      
      &:hover,
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, $success-color 0%, rgba($success-color, 0.8) 100%) !important;
      }
    }
    
    &.accent {
      background: linear-gradient(135deg, #FF6B35 0%, rgba(#FF6B35, 0.8) 100%);
      color: $white;
      border-color: #FF6B35;
      
      &:hover,
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #FF6B35 0%, rgba(#FF6B35, 0.8) 100%) !important;
      }
    }
    
    &.active {
      background: $accent-color;
      color: $white;
      border-color: $accent-color;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &.loading {
      cursor: wait;
    }
  }
  
  .btn-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
  }
  
  .btn-text {
    white-space: nowrap;
  }
}

.action-extras {
  display: flex;
  gap: $spacing-xs;
  align-items: center;
}

.extra-btn {
  @include glassmorphism(0.2, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: $dark-gray;
  transition: none !important; // 트랜지션 강제 비활성화
  
  // 모든 호버 효과 강제 비활성화
  &:hover {
    transform: none !important;
    color: $dark-gray !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
    box-shadow: none !important;
  }
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

// 내보내기 메뉴
.export-menu {
  position: absolute;
  bottom: calc(100% + #{$spacing-md});
  right: 0;
  width: 320px;
  
  @include glassmorphism(0.95, 16px);
  border-radius: 16px;
  padding: $spacing-lg;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  
  .export-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
    
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: $font-weight-bold;
      color: $primary-color;
    }
    
    .close-btn {
      background: transparent;
      border: none;
      padding: $spacing-xs;
      border-radius: 6px;
      color: $dark-gray;
      cursor: pointer;
      transition: none !important;
      
      &:hover {
        background: rgba($error-color, 0.1) !important;
        color: $error-color !important;
      }
    }
  }
  
  .export-options {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
  
  .export-option {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    border-radius: 12px;
    background: transparent;
    border: 1px solid rgba($medium-gray, 0.2);
    cursor: pointer;
    transition: none !important;
    
    .export-icon {
      font-size: 24px;
      width: 32px;
      text-align: center;
    }
    
    .export-info {
      flex: 1;
      text-align: left;
      
      .export-title {
        font-size: 14px;
        font-weight: $font-weight-medium;
        color: $primary-color;
        margin-bottom: 2px;
      }
      
      .export-desc {
        font-size: 12px;
        color: $dark-gray;
      }
    }
  }
}

.export-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
}

// 애니메이션
@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all $transition-normal ease-out;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

// 반응형
@media (max-width: $breakpoint-lg) {
  .map-action-bar {
    left: $spacing-md;
    right: $spacing-md;
    transform: none;
    max-width: none;
  }
  
  .action-bar-content {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .route-controls-section {
    align-self: stretch;
    min-width: auto;
  }
  
  .action-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: $breakpoint-md) {
  .map-action-bar {
    bottom: $spacing-md;
    left: $spacing-sm;
    right: $spacing-sm;
    padding: $spacing-md;
  }
  
  .route-controls-section {
    .route-day-controls {
      .route-day-btn {
        padding: $spacing-xs;
        font-size: 11px;
        min-height: 32px;
        
        .btn-text {
          display: none;
        }
      }
    }
  }
  
  .action-btn {
    padding: $spacing-sm;
    font-size: 12px;
    
    .btn-text {
      display: none;
    }
  }
}
</style>