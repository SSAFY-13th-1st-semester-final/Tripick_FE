<template>
  <div class="forgot-username">
    <h2 class="page-title">아이디 찾기</h2>

    <div v-if="!isUserFound">
      <div class="form-field">
        <label for="email" class="input-label">이메일</label>
        <input
          type="email"
          id="email"
          v-model="email"
          class="glass-input full-width"
          placeholder="가입 시 등록한 이메일 주소를 입력하세요"
          :disabled="isLoading"
          @keyup.enter="findUsername"
        />
        <p class="error-message" v-if="emailError">{{ emailError }}</p>
      </div>

      <div class="form-field-bottom">
        <label for="phoneNumber" class="input-label">전화번호</label>
        <input
          type="tel"
          id="phoneNumber"
          v-model="phoneNumber"
          class="glass-input full-width"
          placeholder="가입 시 등록한 전화번호를 입력하세요 (예: 010-1234-5678)"
          :disabled="isLoading"
          @keyup.enter="findUsername"
        />
        <p class="error-message" v-if="phoneError">{{ phoneError }}</p>
      </div>

      <!-- 버튼 -->
      <div class="btn-container">
        <button
          class="glass-btn primary full-width"
          @click="findUsername"
          :disabled="!isFormValid || isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>아이디 찾기</span>
        </button>
      </div>
    </div>

    <!-- 아이디 찾기 성공 시 표시 -->
    <div v-else class="result-container">
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
          <path
            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
          ></path>
          <path d="M7.5 12.5L10.5 15.5L16 10"></path>
        </svg>
      </div>
      <h3 class="result-title">아이디 찾기 완료</h3>
      <div class="username-display">
        <p class="username-label">회원님의 아이디</p>
        <p class="username-value">{{ foundUsername }}</p>
      </div>
      <p class="result-message">비밀번호가 기억나지 않으신가요?</p>
      <div class="action-buttons">
        <button class="glass-btn primary full-width" @click="goToLogin">
          로그인하기
        </button>
        <button
          class="glass-btn outline full-width"
          @click="goToForgotPassword"
        >
          비밀번호 찾기
        </button>
      </div>
    </div>

    <div class="footer-link">
      <router-link to="/auth/login" class="link-text">
        로그인으로 돌아가기
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import AuthService from "@/services/auth.service";
import { isValidEmail, isValidPhoneNumber } from "@/utils/validators";

export default {
  setup() {
    const router = useRouter();
    const notificationStore = useNotificationStore();

    // 상태 관리
    const email = ref("");
    const phoneNumber = ref("");
    const emailError = ref("");
    const phoneError = ref("");
    const isLoading = ref(false);
    const isUserFound = ref(false);
    const foundUsername = ref("");

    // 유효성 검사
    const validateEmail = () => {
      if (!email.value) {
        emailError.value = "이메일을 입력해주세요.";
        return false;
      }

      if (!isValidEmail(email.value)) {
        emailError.value = "유효한 이메일 주소를 입력해주세요.";
        return false;
      }

      emailError.value = "";
      return true;
    };

    const validatePhoneNumber = () => {
      if (!phoneNumber.value) {
        phoneError.value = "전화번호를 입력해주세요.";
        return false;
      }

      if (!isValidPhoneNumber(phoneNumber.value)) {
        phoneError.value =
          "유효한 전화번호 형식이 아닙니다. (예: 010-1234-5678)";
        return false;
      }

      phoneError.value = "";
      return true;
    };

    // 폼 전체 유효성 검사
    const isFormValid = computed(() => {
      return (
        email.value &&
        phoneNumber.value &&
        isValidEmail(email.value) &&
        isValidPhoneNumber(phoneNumber.value)
      );
    });

    // 아이디 찾기 요청
    const findUsername = async () => {
      // 유효성 검사
      const isEmailValid = validateEmail();
      const isPhoneValid = validatePhoneNumber();

      if (!isEmailValid || !isPhoneValid) {
        return;
      }

      isLoading.value = true;

      try {
        const verificationData = {
          email: email.value,
          phoneNumber: phoneNumber.value,
        };

        const response = await AuthService.findUsername(verificationData);

        // 응답 처리
        if (
          response &&
          response.data &&
          response.data.data &&
          response.data.data.loginId
        ) {
          foundUsername.value = response.data.data.loginId;
          isUserFound.value = true;
          notificationStore.showSuccess("아이디를 찾았습니다.");
        } else {
          notificationStore.showError(
            "아이디 찾기에 실패했습니다. 입력 정보를 다시 확인해주세요."
          );
        }
      } catch (error) {
        // 서버 응답 에러 메시지 확인
        const errorMessage =
          error.response?.data?.message ||
          "아이디 찾기에 실패했습니다. 입력 정보를 다시 확인해주세요.";

        notificationStore.showError(errorMessage);
      } finally {
        isLoading.value = false;
      }
    };

    // 로그인 페이지로 이동
    const goToLogin = () => {
      router.push("/auth/login");
    };

    // 비밀번호 찾기 페이지로 이동
    const goToForgotPassword = () => {
      router.push("/auth/forgot-password");
    };

    return {
      email,
      phoneNumber,
      emailError,
      phoneError,
      isLoading,
      isUserFound,
      foundUsername,
      isFormValid,
      findUsername,
      goToLogin,
      goToForgotPassword,
    };
  },
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.forgot-username {
  width: 100%;
  padding: $spacing-md 0;
}

.page-title {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.form-field {
  margin-bottom: $spacing-md;
}

.form-field-bottom {
  margin-bottom: $spacing-lg;
}

.input-label {
  display: block;
  margin-bottom: $spacing-xs;
  font-weight: $font-weight-medium;
  font-size: 0.9rem;
  color: $primary-color;
}

.full-width {
  width: 100%;
}

.error-message {
  color: $error-color;
  font-size: 0.85rem;
  margin-top: $spacing-xs;
  min-height: 20px;
}

.btn-container {
  margin-bottom: $spacing-lg;
}

.footer-link {
  margin-top: $spacing-lg;
  text-align: center;
}

.link-text {
  font-size: 0.9rem;
  color: $accent-color;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// 아이디 찾기 결과 화면 스타일
.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg 0;
}

.success-icon {
  color: $success-color;
  margin-bottom: $spacing-md;
}

.result-title {
  text-align: center;
  margin-bottom: $spacing-md;
}

.username-display {
  width: 100%;
  padding: $spacing-md;
  background-color: rgba($light-gray, 0.5);
  border-radius: 8px;
  margin-bottom: $spacing-md;
  text-align: center;
}

.username-label {
  font-size: 0.9rem;
  color: $dark-gray;
  margin-bottom: $spacing-xs;
}

.username-value {
  font-size: 1.2rem;
  font-weight: $font-weight-bold;
  color: $primary-color;
}

.result-message {
  text-align: center;
  margin-bottom: $spacing-md;
  color: $dark-gray;
}

.action-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.glass-btn.outline {
  background: transparent;
  border: 1px solid $accent-color;
  color: $accent-color;

  &:hover {
    background: rgba($accent-color, 0.1);
  }
}

// 로딩 스피너
.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.8s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
