<template>
  <div class="user-profile glass-card">
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
          v-if="editable"
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
                v-if="editable && editMode"
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
                v-if="editable && editMode"
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
                v-if="editable && editMode"
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
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import AppInput from "@/components/common/shared/AppInput.vue";

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
  editMode: {
    type: Boolean,
    default: false,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
});

// 이벤트 정의
const emit = defineEmits(["update:userData", "imageSelected", "validateField"]);

// 내부 상태
const imageUploadInput = ref(null);
const profileImageFile = ref(null); // 새로 업로드된 파일 객체 저장
const profileImagePreviewUrl = ref(props.userData.profileImageUrl || null); // 미리보기 URL

const editData = reactive({
  nickname: props.userData.nickname || "",
  email: props.userData.email || "",
  phoneNumber: props.userData.phoneNumber || "",
  // 파일은 별도로 관리하고, profileImageUrl은 참조만 함
});

// 이미지 업로드 입력란 선택
const triggerImageUpload = () => {
  if (props.editable && props.editMode && imageUploadInput.value) {
    imageUploadInput.value.click();
  }
};

// 프로필 이미지 업로드 처리
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file || !props.editable || !props.editMode) return;

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
  const maxSize = 5 * 1024 * 1024; // 5MB
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
  if (profileImagePreviewUrl.value) {
    URL.revokeObjectURL(profileImagePreviewUrl.value); // 이전 URL 해제
  }
  profileImagePreviewUrl.value = URL.createObjectURL(file);

  // 파일 객체와 미리보기 URL을 부모 컴포넌트로 전달
  emit("imageSelected", {
    file: profileImageFile.value,
    previewUrl: profileImagePreviewUrl.value,
  });

  // userData 업데이트 (파일 객체는 포함하지 않음 - 별도 이벤트로 전달)
  const updatedUserData = {
    ...editData,
    // profileImageUrl은 서버에서 업데이트된 후 설정될 것이므로 포함하지 않음
  };

  emit("update:userData", updatedUserData);
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

      // 서버에서 받은 프로필 이미지 URL 업데이트 (편집 모드가 아닐 때만)
      if (!props.editMode || !profileImageFile.value) {
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
    if (props.editMode) {
      emit("update:userData", { ...newValue });
    }
  },
  { deep: true }
);

// 컴포넌트가 언마운트될 때 메모리 누수 방지
const cleanup = () => {
  if (
    profileImagePreviewUrl.value &&
    profileImagePreviewUrl.value.startsWith("blob:")
  ) {
    URL.revokeObjectURL(profileImagePreviewUrl.value);
  }
};

// onBeforeUnmount(cleanup); // Vue 3에서는 이 부분 추가
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.user-profile {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    gap: $spacing-xl;
  }

  &__image-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: $spacing-lg;

    @media (min-width: $breakpoint-md) {
      margin-bottom: 0;
      width: 30%;
    }
  }

  &__image-wrapper {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    @include glassmorphism(0.3, 10px);
    padding: 5px;
    margin-bottom: $spacing-md;
    position: relative;
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
      font-size: 1.5rem;
      margin-bottom: $spacing-xs;
    }

    span {
      font-size: 0.8rem;
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
  }

  &__info-section {
    flex: 1;
    position: relative;
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

    @media (min-width: $breakpoint-md) {
      flex-direction: row;
      align-items: center;
    }

    label {
      color: $primary-color;
      font-weight: $font-weight-medium;
      min-width: 120px;

      @media (max-width: $breakpoint-md) {
        margin-bottom: $spacing-xs;
      }
    }

    .user-profile__form-input {
      flex: 1;
    }

    .user-profile__info-value {
      color: $primary-color;
      padding: $spacing-xs 0;
      margin: 0;
    }
  }
}
</style>
