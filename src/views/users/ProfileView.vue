<template>
  <div class="profile-page">
    <div class="profile-container glass-container">
      <h1 class="profile-title">마이 페이지</h1>

      <!-- 유저 프로필 컴포넌트 -->
      <UserProfile
        :userData="userData"
        :loading="isLoading"
        :editMode="isEditMode"
        :editable="true"
        :errors="errors"
        @update:userData="updateEditData"
        @imageSelected="handleImageSelected"
        @validateField="handleValidationError"
      />

      <!-- 프로필 액션 버튼 -->
      <div class="profile-actions">
        <template v-if="!isEditMode">
          <AppButton
            @click="toggleEditMode"
            variant="outline"
            size="sm"
            class="edit-button"
          >
            <template #icon>
              <i class="icon-edit"></i>
            </template>
            정보 수정
          </AppButton>
        </template>
        <template v-else>
          <AppButton
            @click="saveChanges"
            variant="primary"
            size="sm"
            :loading="isSaving"
            class="save-button"
          >
            저장
          </AppButton>
          <AppButton
            @click="cancelEdit"
            variant="outline"
            size="sm"
            class="cancel-button"
          >
            취소
          </AppButton>
        </template>
      </div>

      <!-- 알림 메시지 -->
      <div
        v-if="notification.show"
        :class="[
          'profile-notification',
          `profile-notification--${notification.type}`,
        ]"
      >
        {{ notification.message }}
      </div>

      <!-- 추가 액션 버튼 -->
      <div class="profile-extra-actions">
        <AppButton
          variant="ghost"
          size="sm"
          class="password-change-button"
          @click="redirectToPasswordChange"
        >
          비밀번호 변경
        </AppButton>

        <AppButton
          variant="ghost"
          size="sm"
          class="logout-button"
          @click="logout"
        >
          로그아웃
        </AppButton>

        <AppButton
          variant="outline"
          size="sm"
          class="delete-account-button danger"
          @click="confirmDeleteAccount"
        >
          회원 탈퇴
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AuthService from "@/services/auth.service";
import AppButton from "@/components/common/shared/AppButton.vue";
import UserProfile from "@/components/user/UserProfile.vue";
import {
  isValidEmail,
  isValidPhoneNumber,
  isRequired,
} from "@/utils/validators";

// 라우터와 스토어 설정
const router = useRouter();
const authStore = useAuthStore();

// 상태 정의
const userData = ref({});
const isLoading = ref(true);
const isSaving = ref(false);
const isEditMode = ref(false);
const errors = reactive({});
const selectedImage = ref(null);
const notification = reactive({
  show: false,
  message: "",
  type: "success",
  timeout: null,
});

// 편집을 위한 데이터
const editData = reactive({
  nickname: "",
  email: "",
  phoneNumber: "",
  profileImageUrl: null,
  shouldUpdateProfileImage: false,
});

// 사용자 정보 불러오기
const fetchUserData = async () => {
  isLoading.value = true;

  try {
    const response = await AuthService.getCurrentUser();

    // API 응답 구조: { status: number, message: string, data: {...} }
    if (response.data && response.data.data) {
      userData.value = response.data.data;
    }
  } catch (error) {
    console.error("사용자 정보 불러오기 오류:", error);
    showNotification("사용자 정보를 불러오는데 실패했습니다.", "error");
  } finally {
    isLoading.value = false;
  }
};

// 편집 모드 토글
const toggleEditMode = () => {
  isEditMode.value = true;

  // 오류 초기화
  Object.keys(errors).forEach((key) => delete errors[key]);
};

// UserProfile에서 데이터 업데이트
const updateEditData = (data) => {
  Object.assign(editData, data);
};

// 이미지 선택 처리
const handleImageSelected = ({ file, previewUrl }) => {
  selectedImage.value = file;
  editData.shouldUpdateProfileImage = true;
  editData.profileImageUrl = previewUrl;
};

// 유효성 검사 오류 처리
const handleValidationError = ({ field, error }) => {
  if (error) {
    errors[field] = error;
  } else {
    delete errors[field];
  }
  showNotification(error, "error");
};

// 편집 취소
const cancelEdit = () => {
  isEditMode.value = false;
  selectedImage.value = null;
  editData.shouldUpdateProfileImage = false;

  // 오류 초기화
  Object.keys(errors).forEach((key) => delete errors[key]);
};

// 유효성 검사
const validateForm = () => {
  const newErrors = {};

  // 이메일 유효성 검사
  if (editData.email && !isValidEmail(editData.email)) {
    newErrors.email = "올바른 이메일 형식이 아닙니다.";
  }

  // 전화번호 유효성 검사
  if (editData.phoneNumber && !isValidPhoneNumber(editData.phoneNumber)) {
    newErrors.phoneNumber =
      "올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)";
  }

  // 오류 객체 업데이트
  Object.keys(errors).forEach((key) => delete errors[key]);
  Object.keys(newErrors).forEach((key) => {
    errors[key] = newErrors[key];
  });

  return Object.keys(newErrors).length === 0;
};

// 변경사항 저장
const saveChanges = async () => {
  if (!validateForm()) return;

  isSaving.value = true;

  try {
    // 프로필 이미지 파일이 있으면 먼저 업로드
    let imageUrl = null;
    if (selectedImage.value && editData.shouldUpdateProfileImage) {
      try {
        // 실제 구현에서는 이미지 업로드 API 호출
        // const uploadResponse = await UserService.uploadProfileImage(selectedImage.value)
        // imageUrl = uploadResponse.data.imageUrl

        // 현재는 선택한 이미지의 임시 URL 사용
        imageUrl = editData.profileImageUrl;
      } catch (uploadError) {
        console.error("이미지 업로드 오류:", uploadError);
        showNotification("이미지 업로드에 실패했습니다.", "error");
        isSaving.value = false;
        return;
      }
    }

    // 수정할 데이터 객체 생성 - 변경된 필드만 포함, 나머지는 null
    const updateData = {
      profileImageUrl: editData.shouldUpdateProfileImage ? imageUrl : null,
      nickname:
        editData.nickname !== userData.value.nickname
          ? editData.nickname
          : null,
      email: editData.email !== userData.value.email ? editData.email : null,
      phoneNumber:
        editData.phoneNumber !== userData.value.phoneNumber
          ? editData.phoneNumber
          : null,
    };

    // API 요청
    await AuthService.updateProfile(updateData);

    // 사용자 정보 다시 불러오기
    await fetchUserData();

    // 편집 모드 종료
    isEditMode.value = false;
    selectedImage.value = null;
    editData.shouldUpdateProfileImage = false;

    // 성공 메시지 표시
    showNotification("정보가 성공적으로 업데이트되었습니다.", "success");
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    showNotification("정보 업데이트에 실패했습니다.", "error");
  } finally {
    isSaving.value = false;
  }
};

// 알림 메시지 표시
const showNotification = (message, type = "success") => {
  // 이전 타임아웃이 있으면 제거
  if (notification.timeout) {
    clearTimeout(notification.timeout);
  }

  // 새 알림 설정
  notification.show = true;
  notification.message = message;
  notification.type = type;

  // 3초 후 자동 제거
  notification.timeout = setTimeout(() => {
    notification.show = false;
  }, 3000);
};

// 비밀번호 변경 페이지로 이동
const redirectToPasswordChange = () => {
  router.push({
    name: "change-password", // 변경된 라우트 이름 사용
    params: { email: userData.value.email }, // 이메일 파라미터 전달
  });
};

// 로그아웃
const logout = async () => {
  try {
    await authStore.logout();
    router.push({ name: "home" });
  } catch (error) {
    console.error("로그아웃 오류:", error);
  }
};

// 회원 탈퇴 확인
const confirmDeleteAccount = () => {
  // 확인 대화상자 표시
  if (
    window.confirm(
      "정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    )
  ) {
    deleteAccount();
  }
};

// 회원 탈퇴 처리
const deleteAccount = async () => {
  try {
    await AuthService.deleteMember();

    // 로그아웃 처리 및 홈으로 이동
    await authStore.logout();
    showNotification("회원 탈퇴가 완료되었습니다.", "success");
    router.push({ name: "home" });
  } catch (error) {
    console.error("회원 탈퇴 오류:", error);
    showNotification("회원 탈퇴에 실패했습니다.", "error");
  }
};

// 컴포넌트 마운트 시 사용자 정보 불러오기
onMounted(() => {
  fetchUserData();
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.profile-page {
  padding: $spacing-lg;
  min-height: calc(100vh - 60px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-container {
  @include glassmorphism(0.7, 15px);
  width: 100%;
  max-width: 800px;
  padding: $spacing-xl;
  border-radius: 16px;
  margin: $spacing-xl 0;
}

.profile-title {
  color: $primary-color;
  text-align: center;
  margin-bottom: $spacing-xl;
  font-weight: $font-weight-bold;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin: $spacing-lg 0;
}

.profile-notification {
  padding: $spacing-md;
  border-radius: 8px;
  text-align: center;
  margin: $spacing-md 0;

  &--success {
    background-color: rgba($success-color, 0.1);
    color: $success-color;
  }

  &--error {
    background-color: rgba($error-color, 0.1);
    color: $error-color;
  }
}

.profile-extra-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $spacing-md;
  margin-top: $spacing-2xl;
  padding-top: $spacing-lg;
  border-top: 1px solid rgba($primary-color, 0.1);

  .danger {
    color: $error-color;

    &:hover {
      background-color: rgba($error-color, 0.1);
    }
  }
}
</style>
