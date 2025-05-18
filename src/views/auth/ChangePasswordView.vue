<template>
  <div class="change-password-page">
    <div class="change-password-container glass-card">
      <h1 class="change-password-title">비밀번호 변경</h1>
      
      <form @submit.prevent="handleSubmit" class="change-password-form">
        <AppInput
          v-model="formData.currentPassword"
          type="password"
          label="현재 비밀번호"
          placeholder="현재 비밀번호를 입력하세요"
          :invalid="!!errors.currentPassword"
          :error-message="errors.currentPassword"
          required
          autocomplete="current-password"
        />
        
        <AppInput
          v-model="formData.newPassword"
          type="password"
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          :invalid="!!errors.newPassword"
          :error-message="errors.newPassword"
          required
          autocomplete="new-password"
        >
          <template #hint>
            <div class="password-hint">
              영문과 숫자 조합으로 8자리 이상 입력해주세요.
            </div>
          </template>
        </AppInput>
        
        <AppInput
          v-model="formData.confirmPassword"
          type="password"
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 다시 입력하세요"
          :invalid="!!errors.confirmPassword"
          :error-message="errors.confirmPassword"
          required
          autocomplete="new-password"
        />
        
        <div v-if="notification.show" :class="['notification', `notification--${notification.type}`]">
          {{ notification.message }}
        </div>
        
        <div class="form-actions">
          <AppButton 
            type="submit" 
            variant="primary" 
            size="lg" 
            :loading="isLoading"
            :disabled="isLoading"
          >
            비밀번호 변경
          </AppButton>
          
          <AppButton 
            type="button" 
            variant="outline" 
            size="lg" 
            @click="navigateBack"
            :disabled="isLoading"
          >
            취소
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '@/services/Auth.service'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { isValidPassword, isRequired, isMatching } from '@/utils/validators'

// 라우터
const router = useRouter()

// 상태 정의
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = reactive({})
const isLoading = ref(false)
const notification = reactive({
  show: false,
  message: '',
  type: 'success',
  timeout: null
})

// 유효성 검사
const validateForm = () => {
  const newErrors = {}
  
  // 현재 비밀번호 검사
  if (!isRequired(formData.currentPassword)) {
    newErrors.currentPassword = '현재 비밀번호를 입력해주세요.'
  }
  
  // 새 비밀번호 검사
  if (!isRequired(formData.newPassword)) {
    newErrors.newPassword = '새 비밀번호를 입력해주세요.'
  } else if (!isValidPassword(formData.newPassword)) {
    newErrors.newPassword = '비밀번호는 영문과 숫자 조합으로 8자리 이상이어야 합니다.'
  }
  
  // 비밀번호 확인 검사
  if (!isRequired(formData.confirmPassword)) {
    newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
  } else if (!isMatching(formData.newPassword, formData.confirmPassword)) {
    newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
  }
  
  // 오류 객체 업데이트
  Object.keys(errors).forEach(key => delete errors[key])
  Object.keys(newErrors).forEach(key => {
    errors[key] = newErrors[key]
  })
  
  return Object.keys(newErrors).length === 0
}

// 폼 제출
const handleSubmit = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  
  try {
    // API 요청용 데이터 객체 생성
    const passwordData = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    }
    
    // 비밀번호 변경 API 호출
    await AuthService.changePassword(passwordData)
    
    // 성공 메시지 표시
    showNotification('비밀번호가 성공적으로 변경되었습니다.', 'success')
    
    // 3초 후 마이페이지로 이동
    setTimeout(() => {
      router.push({ name: 'profile' })
    }, 3000)
  } catch (error) {
    console.error('비밀번호 변경 오류:', error)
    
    // 에러 메시지 처리
    if (error.response && error.response.data) {
      if (error.response.status === 401) {
        showNotification('현재 비밀번호가 올바르지 않습니다.', 'error')
      } else {
        showNotification(error.response.data.message || '비밀번호 변경에 실패했습니다.', 'error')
      }
    } else {
      showNotification('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

// 알림 메시지 표시
const showNotification = (message, type = 'success') => {
  // 이전 타임아웃이 있으면 제거
  if (notification.timeout) {
    clearTimeout(notification.timeout)
  }
  
  // 새 알림 설정
  notification.show = true
  notification.message = message
  notification.type = type
  
  // 5초 후 자동 제거
  notification.timeout = setTimeout(() => {
    notification.show = false
  }, 5000)
}

// 뒤로 가기
const navigateBack = () => {
  router.push({ name: 'profile' })
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.change-password-page {
  padding: $spacing-lg;
  min-height: calc(100vh - 60px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.change-password-container {
  @include glassmorphism(0.7, 15px);
  width: 100%;
  max-width: 500px;
  padding: $spacing-xl;
  border-radius: 16px;
  margin: $spacing-xl auto;
}

.change-password-title {
  color: $primary-color;
  text-align: center;
  margin-bottom: $spacing-xl;
  font-weight: $font-weight-bold;
}

.change-password-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.password-hint {
  font-size: 0.85rem;
  color: rgba($primary-color, 0.7);
  margin-top: $spacing-xs;
}

.notification {
  padding: $spacing-md;
  border-radius: 8px;
  text-align: center;
  
  &--success {
    background-color: rgba($success-color, 0.1);
    color: $success-color;
  }
  
  &--error {
    background-color: rgba($error-color, 0.1);
    color: $error-color;
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-md;
  
  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    justify-content: space-between;
  }
  
  button {
    flex: 1;
  }
}
</style>