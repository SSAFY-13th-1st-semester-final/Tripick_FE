<template>
  <div class="change-password">
    <!-- 성공 메시지 화면 -->
    <div v-if="isSuccess" class="success-container">
      <div class="success-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <path d="M7.5 12.5L10.5 15.5L16 10"></path>
        </svg>
      </div>
      <h2 class="success-message">비밀번호가 변경되었습니다</h2>
      <p class="countdown">{{ countdownValue }}초 후 이동합니다...</p>
    </div>

    <!-- 비밀번호 변경 폼 -->
    <div v-else>
      <h1 class="change-password-title">비밀번호 변경</h1>

      <form @submit.prevent="handleSubmit" class="change-password-form">
        <!-- 현재 비밀번호 입력 -->
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

        <!-- 새 비밀번호 입력 (PasswordInput 컴포넌트 사용) -->
        <PasswordInput
          v-model="formData.newPassword"
          id="newPassword"
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          :showRequirements="true"
          :showStrengthMeter="true"
          @password-valid="onNewPasswordValid"
          @update:error="errors.newPassword = $event"
          autocomplete="new-password"
          required
        />

        <!-- 비밀번호 확인 입력 (PasswordInput 컴포넌트 사용) -->
        <PasswordInput
          v-model="formData.confirmPassword"
          id="confirmPassword"
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 다시 입력하세요"
          :showRequirements="false"
          :showStrengthMeter="false"
          :is-confirm-field="true"
          :confirm-password="formData.newPassword"
          @password-valid="onConfirmPasswordValid"
          @update:error="errors.confirmPassword = $event"
          autocomplete="new-password"
          required
        />

        <div v-if="notification.show" :class="['notification', `notification--${notification.type}`]">
          {{ notification.message }}
        </div>

        <div class="form-actions">
          <AppButton type="submit" variant="primary" size="lg" :loading="isLoading" :disabled="isLoading || !formValid">
            비밀번호 변경
          </AppButton>

          <AppButton type="button" variant="outline" size="lg" @click="navigateBack" :disabled="isLoading">
            취소
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AuthService from "@/services/auth.service";
import AppInput from "@/components/common/shared/AppInput.vue";
import AppButton from "@/components/common/shared/AppButton.vue";
import PasswordInput from "@/components/common/shared/PassWordInput.vue";
import { isRequired } from "@/utils/validators";

// 라우터
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// props로 전달된 이메일 파라미터 (URL에서의 :email)
const email = ref(route.params.email || "");

// 상태 정의
const formData = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const errors = reactive({});
const isLoading = ref(false);
const isNewPasswordValid = ref(false);
const isConfirmPasswordValid = ref(false);
const isSuccess = ref(false);
const countdownValue = ref(3);
let countdownTimer = null;

const notification = reactive({
  show: false,
  message: "",
  type: "success",
  timeout: null,
});

// 컴포넌트 마운트 시 사용자 정보 가져오기
onMounted(async () => {
  try {
    // 인증 여부 확인
    if (!authStore.isAuthenticated && !email.value) {
      // 로그인되지 않고 이메일도 없는 경우 로그인 페이지로 리다이렉트
      router.push({ name: "login" });
      return;
    }

    // 이메일이 전달되지 않았다면 현재 로그인된 사용자의 이메일 사용
    if (!email.value && authStore.user?.email) {
      email.value = authStore.user.email;
    }
    // 이메일이 없고 스토어에도 없다면 API에서 사용자 정보 가져오기
    else if (!email.value && authStore.isAuthenticated) {
      const response = await AuthService.getCurrentUser();
      email.value = response.data?.email || response.data?.data?.email;
    }
  } catch (error) {
    showNotification("사용자 정보를 가져오는데 실패했습니다.", "error");
  }
});

// 컴포넌트 언마운트 전 타이머 정리
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  if (notification.timeout) {
    clearTimeout(notification.timeout);
    notification.timeout = null;
  }
});

// 카운트다운 시작 함수
const startCountdown = () => {
  countdownValue.value = 3;

  countdownTimer = setInterval(() => {
    countdownValue.value--;

    if (countdownValue.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;

      // 카운트다운 완료 후 리다이렉션
      redirectAfterSuccess();
    }
  }, 1000);
};

// 성공 후 리다이렉션 처리
const redirectAfterSuccess = () => {
  if (authStore.isAuthenticated) {
    router.push({ name: "profile" });
  } else {
    router.push({ name: "login" });
  }
};

// 비밀번호 유효성 상태 업데이트 핸들러
const onNewPasswordValid = (valid) => {
  isNewPasswordValid.value = valid;
};

// 비밀번호 확인 유효성 상태 업데이트 핸들러
const onConfirmPasswordValid = (valid) => {
  isConfirmPasswordValid.value = valid;
};

// 전체 폼 유효성 계산
const formValid = computed(() => {
  return (
    !!formData.currentPassword && !errors.currentPassword && isNewPasswordValid.value && isConfirmPasswordValid.value
  );
});

// 유효성 검사
const validateForm = () => {
  const newErrors = {};

  // 현재 비밀번호 검사
  if (!isRequired(formData.currentPassword)) {
    newErrors.currentPassword = "현재 비밀번호를 입력해주세요.";
  }

  // 비밀번호 및 비밀번호 확인은 컴포넌트에서 처리

  // 오류 객체 업데이트
  if (errors.currentPassword) delete errors.currentPassword;
  if (newErrors.currentPassword) errors.currentPassword = newErrors.currentPassword;

  return Object.keys(newErrors).length === 0 && isNewPasswordValid.value && isConfirmPasswordValid.value;
};

// 폼 제출
const handleSubmit = async () => {
  if (!validateForm()) return;

  isLoading.value = true;

  try {
    // API 요청용 데이터 객체 생성
    const passwordData = {
      email: email.value,
      password: formData.newPassword,
    };

    // 비밀번호 변경 API 호출
    await AuthService.resetPassword(passwordData);

    // 성공 상태 설정 및 카운트다운 시작
    isSuccess.value = true;
    startCountdown();
  } catch (error) {
    // 에러 메시지 처리
    if (error.response && error.response.data) {
      if (error.response.status === 401) {
        showNotification("현재 비밀번호가 올바르지 않습니다.", "error");
      } else {
        showNotification(error.response.data.message || "비밀번호 변경에 실패했습니다.", "error");
      }
    } else {
      showNotification("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
    }
  } finally {
    isLoading.value = false;
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

  // 5초 후 자동 제거
  notification.timeout = setTimeout(() => {
    notification.show = false;
  }, 5000);
};

// 뒤로 가기
const navigateBack = () => {
  // 로그인 상태이면 프로필로, 아니면 로그인 페이지로
  if (authStore.isAuthenticated) {
    router.push({ name: "profile" });
  } else {
    router.push({ name: "login" });
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

/* 루트 엘리먼트 */
.change-password {
  width: 100%;

  &-title {
    color: $primary-color;
    text-align: center;
    margin-bottom: $spacing-xl;
    font-weight: $font-weight-bold;
    font-size: 1.75rem;
  }
}

.change-password-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.notification {
  padding: $spacing-md;
  border-radius: 8px;
  text-align: center;
  margin: $spacing-sm 0;

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
  gap: $spacing-md;
  margin-top: $spacing-md;
  width: 100%;

  @media (max-width: $breakpoint-md) {
    flex-direction: column;
  }

  button {
    flex: 1;
  }
}

/* 성공 화면 스타일 */
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: $spacing-lg 0;
}

.success-icon {
  color: $success-color;
  margin-bottom: $spacing-md;
  animation: success-bounce 1s ease-in-out;
}

.success-message {
  font-size: 1.5rem;
  color: $primary-color;
  margin-bottom: $spacing-md;
  font-weight: $font-weight-bold;
}

.countdown {
  font-size: 1rem;
  color: $dark-gray;
  margin-top: $spacing-sm;
}

/* 성공 아이콘 애니메이션 */
@keyframes success-bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}
</style>
