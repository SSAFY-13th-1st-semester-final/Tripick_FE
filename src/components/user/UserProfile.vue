<template>
  <div class="user-profile-container">
    <div class="user-profile glass-card">
      <!-- 1행: 프로필 이미지 + 사용자 정보 -->
      <div class="user-profile__main-row">
        <!-- 프로필 이미지 섹션 -->
        <div class="user-profile__image-section">
          <div class="user-profile__image-wrapper">
            <img
              :src="profileImagePreviewUrl || 'https://picsum.photos/200'"
              alt="프로필 이미지"
              class="user-profile__image"
              @error="handleImageError"
            />
            <div
              v-if="editMode"
              class="user-profile__image-overlay"
              @click="triggerImageUpload"
            >
              <div class="user-profile__image-upload-label">
                <i class="icon-camera"></i>
                <span>이미지 변경</span>
              </div>
              <input
                type="file"
                ref="imageUploadInput"
                class="user-profile__image-upload"
                accept="image/*"
                @change="handleImageUpload"
              />
            </div>
          </div>
          <p class="user-profile__role">{{ userData.role || "일반 회원" }}</p>
        </div>

        <!-- 프로필 정보 섹션 -->
        <div class="user-profile__info-section">
          <div v-if="loading" class="user-profile__loading">
            <div class="loading-spinner"></div>
            <p>정보를 불러오는 중...</p>
          </div>

          <template v-else>
            <!-- 사용자 정보 폼 -->
            <div class="user-profile__form">
              <div class="user-profile__form-item">
                <label>닉네임</label>
                <div class="user-profile__form-input">
                  <AppInput
                    v-if="editMode"
                    v-model="editData.nickname"
                    placeholder="닉네임을 입력하세요"
                    :invalid="!!errors.nickname"
                    :error-message="errors.nickname"
                  />
                  <p v-else class="user-profile__info-value">
                    {{ userData.nickname || "-" }}
                  </p>
                </div>
              </div>

              <div class="user-profile__form-item">
                <label>이메일</label>
                <div class="user-profile__form-input">
                  <AppInput
                    v-if="editMode"
                    v-model="editData.email"
                    placeholder="이메일을 입력하세요"
                    :invalid="!!errors.email"
                    :error-message="errors.email"
                  />
                  <p v-else class="user-profile__info-value">
                    {{ userData.email || "-" }}
                  </p>
                </div>
              </div>

              <div class="user-profile__form-item">
                <label>전화번호</label>
                <div class="user-profile__form-input">
                  <AppInput
                    v-if="editMode"
                    v-model="editData.phoneNumber"
                    placeholder="전화번호를 입력하세요"
                    :invalid="!!errors.phoneNumber"
                    :error-message="errors.phoneNumber"
                  />
                  <p v-else class="user-profile__info-value">
                    {{ userData.phoneNumber || "-" }}
                  </p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 2행: 액션 버튼들 -->
      <div class="user-profile__actions">
        <template v-if="!editMode">
          <AppButton
            @click="toggleEditMode"
            variant="outline"
            size="sm"
            class="action-button"
          >
            <template #icon>
              <i class="icon-edit"></i>
            </template>
            정보 수정
          </AppButton>
          
          <AppButton
            variant="ghost"
            size="sm"
            class="action-button"
            @click="$emit('passwordChange')"
          >
            비밀번호 변경
          </AppButton>

          <AppButton
            variant="ghost"
            size="sm"
            class="action-button"
            @click="$emit('logout')"
          >
            로그아웃
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            class="action-button danger"
            @click="$emit('deleteAccount')"
          >
            회원 탈퇴
          </AppButton>
        </template>
        
        <template v-else>
          <AppButton
            @click="saveChanges"
            variant="primary"
            size="sm"
            :loading="isSaving"
            class="action-button"
          >
            저장
          </AppButton>
          <AppButton
            @click="cancelEdit"
            variant="outline"
            size="sm"
            class="action-button"
          >
            취소
          </AppButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import AppInput from "@/components/common/shared/AppInput.vue";
import AppButton from "@/components/common/shared/AppButton.vue";

// Props 정의
const props = defineProps({
  userData: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
});

// 이벤트 정의
const emit = defineEmits([
  "update:userData", 
  "imageSelected", 
  "validateField",
  "save",
  "passwordChange",
  "logout",
  "deleteAccount"
]);

// 내부 상태
const editMode = ref(false);
const imageUploadInput = ref(null);
const profileImageFile = ref(null);
const profileImagePreviewUrl = ref(props.userData.profileImageUrl || null);

const editData = reactive({
  nickname: props.userData.nickname || "",
  email: props.userData.email || "",
  phoneNumber: props.userData.phoneNumber || "",
});

// 편집 모드 토글
const toggleEditMode = () => {
  editMode.value = true;
  // 이미지 상태 초기화
  profileImageFile.value = null;
  if (profileImagePreviewUrl.value && profileImagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(profileImagePreviewUrl.value);
    profileImagePreviewUrl.value = props.userData.profileImageUrl || null;
  }
};

// 편집 취소
const cancelEdit = () => {
  editMode.value = false;
  // 원래 데이터로 복원
  editData.nickname = props.userData.nickname || "";
  editData.email = props.userData.email || "";
  editData.phoneNumber = props.userData.phoneNumber || "";
  
  // 이미지 상태 초기화
  profileImageFile.value = null;
  if (profileImagePreviewUrl.value && profileImagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(profileImagePreviewUrl.value);
  }
  profileImagePreviewUrl.value = props.userData.profileImageUrl || null;
};

// 변경사항 저장
const saveChanges = () => {
  const saveData = {
    ...editData,
    profileImageFile: profileImageFile.value
  };
  emit('save', saveData);
  editMode.value = false;
};

// 이미지 업로드 입력란 선택
const triggerImageUpload = () => {
  if (editMode.value && imageUploadInput.value) {
    imageUploadInput.value.click();
  }
};

// 프로필 이미지 업로드 처리
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file || !editMode.value) return;

  // 파일 유효성 검사
  const validImageTypes = [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
  ];
  if (!validImageTypes.includes(file.type)) {
    emit("validateField", {
      field: "profileImageUrl",
      error: "이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WEBP)",
    });
    return;
  }

  // 파일 크기 제한 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    emit("validateField", {
      field: "profileImageUrl", 
      error: "이미지 크기는 5MB 이하여야 합니다.",
    });
    return;
  }

  // 파일 객체 저장
  profileImageFile.value = file;

  // 미리보기 URL 생성
  if (profileImagePreviewUrl.value && profileImagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(profileImagePreviewUrl.value);
  }
  profileImagePreviewUrl.value = URL.createObjectURL(file);

  // 파일 객체와 미리보기 URL을 부모 컴포넌트로 전달
  emit("imageSelected", {
    file: profileImageFile.value,
    previewUrl: profileImagePreviewUrl.value,
  });
};

// 프로필 이미지 로딩 오류 처리
const handleImageError = (event) => {
  event.target.src = "/default-profile.jpg";
};

// userData가 변경되면 editData 업데이트
watch(
  () => props.userData,
  (newValue) => {
    if (newValue) {
      editData.nickname = newValue.nickname || "";
      editData.email = newValue.email || "";
      editData.phoneNumber = newValue.phoneNumber || "";

      if (!editMode.value || !profileImageFile.value) {
        profileImagePreviewUrl.value = newValue.profileImageUrl || null;
      }
    }
  },
  { deep: true }
);

// editData의 변경사항을 부모 컴포넌트에 전달
watch(
  editData,
  (newValue) => {
    if (editMode.value) {
      emit("update:userData", { ...newValue });
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.user-profile-container {
  padding: $spacing-lg;
  max-width: 1000px;
  margin: 0 auto;
  height: 100%; // 부모 높이에 맞춤
  display: flex;
  flex-direction: column;
}

.user-profile {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm; // gap 더 줄임
  overflow: hidden;
  width: 100%;
  padding: $spacing-lg $spacing-lg $spacing-sm; // 하단 패딩 줄임
  height: 100%; // 부모 높이에 맞춤
  flex: 1; // flex로 공간 차지
  justify-content: space-between;

  // 1행: 프로필 이미지 + 사용자 정보 (수직 배치)
  &__main-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xl;
  }

  &__image-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  &__image-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    @include glassmorphism(0.3, 10px);
    padding: 5px;
    margin-bottom: $spacing-md;
    position: relative;

    @media (max-width: $breakpoint-md) {
      width: 100px;
      height: 100px;
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  &__image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba($primary-color, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity $transition-fast;
    border-radius: 50%;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }

  &__image-upload-label {
    color: $white;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    i {
      font-size: 1.2rem;
      margin-bottom: $spacing-xs;
    }

    span {
      font-size: 0.7rem;
      text-align: center;
    }
  }

  &__image-upload {
    display: none;
  }

  &__role {
    color: $primary-color;
    font-weight: $font-weight-medium;
    background-color: rgba($accent-color, 0.1);
    padding: $spacing-xs $spacing-sm;
    border-radius: 20px;
    font-size: 0.9rem;
    text-align: center;
  }

  &__info-section {
    width: 100%;
    max-width: 400px;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-xl 0;

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba($primary-color, 0.1);
      border-top-color: $accent-color;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: $spacing-md;
    }

    p {
      color: $primary-color;
      margin: 0;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__form-item {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    @media (min-width: $breakpoint-sm) {
      flex-direction: row;
      align-items: center;
    }

    label {
      color: $primary-color;
      font-weight: $font-weight-medium;
      min-width: 100px;

      @media (max-width: $breakpoint-sm) {
        margin-bottom: $spacing-xs;
      }
    }
  }

  &__form-input {
    flex: 1;
  }

  &__info-value {
    color: $primary-color;
    padding: $spacing-xs 0;
    margin: 0;
    font-size: $font-size-base;
  }

  // 2행: 액션 버튼들
  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $spacing-md;
    padding-top: $spacing-lg;
    padding-bottom: $spacing-md; // 하단 패딩 추가
    margin-top: auto; // 상단 여백을 자동으로 조정하여 하단으로 밀어냄
  }
}

// 액션 버튼 스타일
.action-button {
  min-width: 120px;
  flex: 0 0 auto;
  border: none !important; // 모든 버튼의 테두리 제거
  transition: all $transition-fast ease-in-out;
  position: relative;
  overflow: hidden;
  
  // 기본 hover 효과 (모든 버튼 공통) - ghost 버튼 스타일에 맞춤
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($primary-color, 0.15);
    background-color: rgba($accent-color, 0.1) !important; // ghost 버튼과 동일한 배경색으로 통일
  }
  
  &:active {
    transform: translateY(0px);
    box-shadow: 0 2px 4px rgba($primary-color, 0.1);
  }
  
  &.danger {
    color: $error-color;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($error-color, 0.15);
      background-color: rgba($error-color, 0.1) !important;
    }
    
    &:active {
      transform: translateY(0px);
      box-shadow: 0 2px 4px rgba($error-color, 0.1);
    }
  }

  @media (max-width: $breakpoint-md) {
    flex: 1;
    min-width: calc(50% - #{$spacing-md} / 2);
  }

  @media (max-width: $breakpoint-sm) {
    width: 100%;
    min-width: unset;
    flex: 1 1 100%;
  }
}
</style>