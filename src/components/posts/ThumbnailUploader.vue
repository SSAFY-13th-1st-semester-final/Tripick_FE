<template>
  <div class="thumbnail-uploader">
    <label class="form-label">썸네일 이미지</label>
    <div class="thumbnail-uploader__wrapper">
      <div
        class="thumbnail-uploader__preview glass-card"
        :class="{ 
          'has-image': imageUrl, 
          'is-uploading': isUploading,
          'is-disabled': disabled 
        }"
        @click="handlePreviewClick"
      >
        <img
          v-if="imageUrl && !isUploading"
          :src="imageUrl"
          alt="썸네일 미리보기"
          class="thumbnail-uploader__image"
          @error="handleImageError"
        />
        <div v-else-if="isUploading" class="thumbnail-uploader__uploading">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span>업로드 중...</span>
          <div class="upload-progress" v-if="uploadProgress > 0">
            <div class="upload-progress__bar" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
        </div>
        <div v-else class="thumbnail-uploader__placeholder">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="thumbnail-icon"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>{{ disabled ? '업로드 불가' : '이미지 선택' }}</span>
          <small v-if="!disabled">클릭하여 이미지를 업로드하세요</small>
        </div>
      </div>
      
      <input
        type="file"
        ref="fileInput"
        class="hidden-input"
        accept="image/*"
        :disabled="disabled || isUploading"
        @change="handleFileChange"
      />
      
      <div v-if="imageUrl && !isUploading && !disabled" class="thumbnail-actions">
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          @click.stop="changeImage"
          class="action-btn"
        >
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
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          변경
        </AppButton>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          @click.stop="removeImage"
          class="action-btn remove-btn"
        >
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
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          제거
        </AppButton>
      </div>
    </div>
    
    <div v-if="errorMessage" class="form-error">
      {{ errorMessage }}
    </div>
    
    <div class="upload-info">
      <small>
        지원 형식: JPEG, PNG, GIF, WEBP | 최대 크기: 5MB
      </small>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import {PostService} from '@/services/post.service'
import AppButton from '@/components/common/shared/AppButton.vue'

// Props 정의
const props = defineProps({
  initialImage: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  acceptedTypes: {
    type: Array,
    default: () => ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
})

// Emits 정의
const emit = defineEmits(['update:imageUrl', 'upload-start', 'upload-end', 'upload-error'])

// 상태 관리
const fileInput = ref(null)
const imageUrl = ref(props.initialImage)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')

// 스토어
const notificationStore = useNotificationStore()

// Props 변경 감지
watch(() => props.initialImage, (newValue) => {
  imageUrl.value = newValue
  clearError()
})

// 에러 메시지 클리어
const clearError = () => {
  errorMessage.value = ''
}

// 파일 유효성 검사
const validateFile = (file) => {
  clearError()

  if (!file) {
    errorMessage.value = '파일을 선택해주세요.'
    return false
  }

  // 파일 타입 검사
  if (!props.acceptedTypes.includes(file.type)) {
    errorMessage.value = `지원하지 않는 파일 형식입니다. (${props.acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')})`
    return false
  }

  // 파일 크기 검사
  if (file.size > props.maxSize) {
    const maxSizeMB = Math.round(props.maxSize / (1024 * 1024))
    errorMessage.value = `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`
    return false
  }

  return true
}

// 프리뷰 클릭 핸들러
const handlePreviewClick = () => {
  if (props.disabled || isUploading.value) return
  triggerFileInput()
}

// 파일 입력 트리거
const triggerFileInput = () => {
  if (props.disabled || isUploading.value) return
  fileInput.value?.click()
}

// 파일 변경 핸들러
const handleFileChange = async (event) => {
    
  const file = event.target.files[0]

  console.log("!!!!!!!!!!!!!!!!!!!!!!!!");

  if (!file || !validateFile(file)) return

  await upload(file)
  
  // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
  event.target.value = ''
}

// 이미지 업로드
const upload = async (file) => {
    console.log("1");
  if (props.disabled || isUploading.value) return
    console.log("2");
  isUploading.value = true
  uploadProgress.value = 0
  emit('upload-start')

  try {
    // 업로드 진행률 시뮬레이션 (실제 API에서 진행률을 제공하지 않는 경우)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 20
      }
    }, 200)

    // PostService를 통한 이미지 업로드
    const uploadedImageUrl = await PostService.uploadImage(file)
    
    console.log(">>>?>????:", uploadedImageUrl);

    clearInterval(progressInterval)
    uploadProgress.value = 100

    // 업로드 완료 후 짧은 지연으로 사용자가 100% 진행률을 볼 수 있도록 함
    setTimeout(() => {
      imageUrl.value = uploadedImageUrl
      emit('update:imageUrl', uploadedImageUrl)
      emit('upload-end', uploadedImageUrl)
      notificationStore.showSuccess('이미지 업로드가 완료되었습니다.')
      clearError()
    }, 300)

  } catch (error) {
    console.error('이미지 업로드 실패:', error)
    
    const errorMsg = error.message || '이미지 업로드에 실패했습니다.'
    errorMessage.value = errorMsg
    emit('upload-error', error)
    notificationStore.showError(errorMsg)
  } finally {
    setTimeout(() => {
      isUploading.value = false
      uploadProgress.value = 0
    }, 300)
  }
}

// 이미지 변경
const changeImage = () => {
  triggerFileInput()
}

// 이미지 제거
const removeImage = () => {
  imageUrl.value = ''
  emit('update:imageUrl', '')
  clearError()
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  
  notificationStore.showInfo('이미지가 제거되었습니다.')
}

// 이미지 로드 에러 핸들러
const handleImageError = () => {
  errorMessage.value = '이미지를 불러올 수 없습니다.'
  imageUrl.value = ''
  emit('update:imageUrl', '')
  notificationStore.showError('이미지 로드 중 문제가 발생했습니다.')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles' as *;

.thumbnail-uploader {
  &__wrapper {
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
    flex-wrap: wrap;
  }

  &__preview {
    width: 240px;
    height: 160px;
    border: 2px dashed rgba($primary-color, 0.3);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all $transition-normal;
    position: relative;

    &:hover:not(.is-disabled):not(.is-uploading) {
      border-color: $accent-color;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba($accent-color, 0.15);
    }

    &.has-image {
      border-style: solid;
      border-color: $accent-color;
    }

    &.is-uploading {
      cursor: not-allowed;
      opacity: 0.8;
      border-color: $accent-color;
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.5;
      border-color: $medium-gray;
    }

    @media (max-width: $breakpoint-md) {
      width: 200px;
      height: 120px;
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform $transition-normal;

    &:hover {
      transform: scale(1.02);
    }
  }

  &__uploading {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: $accent-color;
    text-align: center;
    padding: $spacing-md;

    svg {
      margin-bottom: $spacing-sm;
    }

    span {
      font-size: 0.875rem;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-sm;
    }
  }

  &__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: $primary-color;
    opacity: 0.7;
    text-align: center;
    padding: $spacing-md;

    .thumbnail-icon {
      margin-bottom: $spacing-sm;
    }

    span {
      font-size: 0.875rem;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-xs;
    }

    small {
      font-size: 0.75rem;
      color: $dark-gray;
    }
  }
}

.thumbnail-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;

  .action-btn {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    
    &.remove-btn {
      color: $error-color;
      border-color: rgba($error-color, 0.3);
      
      &:hover {
        background-color: rgba($error-color, 0.1);
        border-color: $error-color;
      }
    }
  }
}

.upload-progress {
  width: 100%;
  height: 4px;
  background-color: rgba($primary-color, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: $spacing-sm;

  &__bar {
    height: 100%;
    background: linear-gradient(90deg, $accent-color, #00b4d8);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}

.upload-info {
  margin-top: $spacing-sm;
  
  small {
    color: $dark-gray;
    font-size: 0.75rem;
  }
}

.hidden-input {
  display: none;
}

.form-label {
  display: block;
  margin-bottom: $spacing-sm;
  font-weight: $font-weight-medium;
  color: $primary-color;
  font-size: 1rem;
}

.form-error {
  margin-top: $spacing-sm;
  color: $error-color;
  font-size: 0.875rem;
  font-weight: $font-weight-medium;
}

// 애니메이션
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 반응형 조정
@media (max-width: $breakpoint-md) {
  .thumbnail-uploader {
    &__wrapper {
      flex-direction: column;
      align-items: center;
    }

    &__preview {
      order: 1;
    }

    .thumbnail-actions {
      order: 2;
      justify-content: center;
    }
  }
}
</style>