// stores/notification.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  // 알림 상태
  const notifications = ref([])
  const nextId = ref(1)

  // 알림 타입
  const types = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning'
  }

  // 알림 추가
  const addNotification = ({
    message,
    type = types.INFO,
    duration = 3000, // 기본 3초
    closable = true
  }) => {
    const id = nextId.value++
    const notification = {
      id,
      message,
      type,
      closable,
      timestamp: Date.now()
    }
    
    notifications.value.push(notification)
    
    // 자동 제거 타이머 설정 (duration이 0 이상인 경우에만)
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }
  
  // 편의 함수들
  const showSuccess = (message, options = {}) => {
    return addNotification({ ...options, message, type: types.SUCCESS })
  }
  
  const showError = (message, options = {}) => {
    return addNotification({ ...options, message, type: types.ERROR })
  }
  
  const showInfo = (message, options = {}) => {
    return addNotification({ ...options, message, type: types.INFO })
  }
  
  const showWarning = (message, options = {}) => {
    return addNotification({ ...options, message, type: types.WARNING })
  }

  // 알림 제거
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  // 모든 알림 제거
  const clearAll = () => {
    notifications.value = []
  }

  return {
    notifications,
    types,
    addNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeNotification,
    clearAll
  }
})