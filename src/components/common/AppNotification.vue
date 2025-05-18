<template>
  <transition-group 
    tag="div" 
    name="notification" 
    class="notification-container"
  >
    <div 
      v-for="notification in notifications" 
      :key="notification.id"
      :class="['notification-card', `notification-${notification.type}`, 'glass-card']"
    >
      <div class="notification-content">
        <div class="notification-icon">
          <!-- 성공 아이콘 -->
          <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="notification-svg">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="M7.5 12.5L10.5 15.5L16 10"></path>
          </svg>
          
          <!-- 오류 아이콘 -->
          <svg v-else-if="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="notification-svg">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="M15 9L9 15"></path>
            <path d="M9 9L15 15"></path>
          </svg>
          
          <!-- 경고 아이콘 -->
          <svg v-else-if="notification.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="notification-svg">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="M12 8L12 13"></path>
            <path d="M12 16L12.01 16"></path>
          </svg>
          
          <!-- 정보 아이콘 -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="notification-svg">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="M12 16L12 12"></path>
            <path d="M12 8L12.01 8"></path>
          </svg>
        </div>
        
        <div class="notification-message">
          {{ notification.message }}
        </div>
        
        <button 
          v-if="notification.closable"
          class="notification-close"
          @click="removeNotification(notification.id)"
          aria-label="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="notification-svg-small">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <!-- 진행 표시줄 (자동으로 사라지는 경우) -->
      <div 
        v-if="notification.timestamp && notification.duration > 0" 
        class="notification-progress"
        :style="getProgressStyle(notification)"
      ></div>
    </div>
  </transition-group>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

// Pinia 스토어에서 상태 및 메서드 가져오기
const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)
const { removeNotification } = notificationStore

// 진행 표시줄 스타일 계산
const getProgressStyle = (notification) => {
  // notification.timestamp이 없거나 duration이 없거나 0이면 진행 표시줄 없음
  if (!notification.timestamp || !notification.duration) return { width: '0%' }
  
  const elapsed = Date.now() - notification.timestamp
  const duration = notification.duration
  const percentage = Math.max(0, 100 - (elapsed / duration) * 100)
  
  return {
    width: `${percentage}%`,
    transition: `width ${duration}ms linear`
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.notification-container {
  position: fixed;
  top: $spacing-xl;
  right: $spacing-xl;
  z-index: $z-index-tooltip;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  max-width: 320px; // 알림 너비 줄임
  width: calc(100% - #{$spacing-xl * 2});
  pointer-events: none; // 컨테이너 자체는 클릭 이벤트를 통과시킴
}

.notification-card {
  padding: $spacing-md;
  border-radius: 12px;
  pointer-events: auto; // 알림 카드는 클릭 이벤트 수신
  overflow: hidden;
  position: relative;
  
  // Apple 스타일 그림자
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
  
  // 약간 어두운 반투명 배경 (기본)
  background-color: rgba(32, 38, 50, 0.85); // PANTONE 433 C와 유사한 약간 어두운 색상
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  
  // 테마 색상 (Toss Blue)
  &.notification-success {
    background-color: rgba(0, 100, 255, 0.85); // PANTONE 2175 C - 진한 버전
    
    .notification-icon {
      color: white;
    }
    
    .notification-message {
      color: white;
    }
    
    .notification-close {
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
    
    .notification-progress {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
  
  &.notification-error {
    background-color: rgba($error-color, 0.85);
    
    .notification-icon {
      color: white;
    }
    
    .notification-message {
      color: white;
    }
    
    .notification-close {
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
    
    .notification-progress {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
  
  &.notification-warning {
    background-color: rgba($warning-color, 0.85);
    
    .notification-icon {
      color: white;
    }
    
    .notification-message {
      color: white;
    }
    
    .notification-close {
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
    
    .notification-progress {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
  
  &.notification-info {
    background-color: rgba(0, 100, 255, 0.65); // PANTONE 2175 C - 연한 버전
    
    .notification-icon {
      color: white;
    }
    
    .notification-message {
      color: white;
    }
    
    .notification-close {
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
    
    .notification-progress {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-message {
  flex-grow: 1;
  font-size: 14px;
  line-height: 1.4;
  font-weight: $font-weight-medium;
  margin: 1px 0;
  
  // Apple SF Pro 텍스트 스타일 모방
  letter-spacing: -0.01em;
}

.notification-close {
  background: transparent;
  border: none;
  padding: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;
  margin-left: $spacing-xs;
  opacity: 0.8;
  
  // Apple 스타일 원형 버튼
  border-radius: 50%;
  width: 20px;
  height: 20px;
  
  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  &:focus {
    outline: none;
    opacity: 1;
  }
}

.notification-svg {
  width: 20px;
  height: 20px;
}

.notification-svg-small {
  width: 14px;
  height: 14px;
}

// 진행 표시줄
.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 0 3px 3px 0;
}

// 애니메이션 - Apple 스타일 부드러운 트랜지션
.notification-enter-active {
  transition: all 0.35s cubic-bezier(0.17, 0.67, 0.21, 0.99);
}

.notification-leave-active {
  transition: all 0.5s cubic-bezier(0.17, 0.67, 0.21, 0.99);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(10px) translateY(-5px) scale(0.97);
  filter: blur(2px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(10px) scale(0.97);
  filter: blur(1px);
}

// 모바일 대응
@media (max-width: $breakpoint-md) {
  .notification-container {
    top: $spacing-md;
    right: $spacing-md;
    width: calc(100% - #{$spacing-md * 2});
  }
}
</style>