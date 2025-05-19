<template>
  <div class="reset-password">
    <h2 class="page-title">비밀번호 재설정</h2>

    <div v-if="!isResetComplete">
      <!-- 새 비밀번호 입력 -->
      <div class="form-field">
        <label for="password" class="input-label">새 비밀번호</label>
        <div class="password-input-container">
          <input
            :type="showPassword ? 'text' : 'password'"
            id="password"
            v-model="password"
            class="glass-input full-width"
            placeholder="새 비밀번호를 입력하세요"
          />
          <button
            type="button"
            class="password-toggle"
            @click="togglePasswordVisibility"
            aria-label="비밀번호 표시 전환"
          >
            <!-- 비밀번호 숨김 아이콘 -->
            <svg
              v-if="!showPassword"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <!-- 비밀번호 표시 아이콘 -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="4" y1="22" x2="20" y2="2"></line>
            </svg>
          </button>
        </div>
        <div class="password-strength-container" v-if="password">
          <div class="password-strength">
            <span
              class="strength-bar"
              :class="passwordStrengthClass"
              :style="{ width: strengthPercentage + '%' }"
            ></span>
          </div>
          <div class="strength-text" :class="passwordStrengthClass">
            {{ passwordStrengthText }}
          </div>
        </div>
        <p class="password-requirements">
          비밀번호는 영문, 숫자 조합 8자리 이상이어야 합니다.
        </p>
        <p class="error-message" v-if="passwordError">
          {{ passwordError }}
        </p>
      </div>

      <!-- 비밀번호 확인 입력 -->
      <div class="form-field-bottom">
        <label for="confirmPassword" class="input-label">비밀번호 확인</label>
        <div class="password-input-container">
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            id="confirmPassword"
            v-model="confirmPassword"
            class="glass-input full-width"
            placeholder="비밀번호를 다시 입력하세요"
          />
          <button
            type="button"
            class="password-toggle"
            @click="toggleConfirmPasswordVisibility"
            aria-label="비밀번호 확인 표시 전환"
          >
            <!-- 비밀번호 숨김 아이콘 -->
            <svg
              v-if="!showConfirmPassword"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <!-- 비밀번호 표시 아이콘 -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="4" y1="22" x2="20" y2="2"></line>
            </svg>
          </button>
        </div>
        <p class="error-message" v-if="confirmPasswordError">
          {{ confirmPasswordError }}
        </p>
      </div>

      <!-- 비밀번호 변경 버튼 -->
      <button
        class="glass-btn primary full-width"
        @click="resetPassword"
        :disabled="!isPasswordValid || !doPasswordsMatch || isLoading"
      >
        <span v-if="isLoading" class="loading-spinner"></span>
        <span v-else>비밀번호 변경</span>
      </button>
    </div>

    <!-- 비밀번호 변경 완료 -->
    <div v-else class="success-container">
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
      <h3 class="success-title">비밀번호 변경 완료</h3>
      <p class="success-message">새로운 비밀번호로 로그인할 수 있습니다.</p>
      <button class="glass-btn primary full-width" @click="goToLogin">
        로그인하기
      </button>
    </div>

    <div class="footer-link">
      <router-link to="/auth/login" class="link-text">
        로그인으로 돌아가기
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import AuthService from "@/services/auth.service";
import { isValidPassword, isMatching } from "@/utils/validators";
import { analyzePasswordStrength } from "@/utils/passwordStrength";

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const notificationStore = useNotificationStore();

    // 상태 관리
    const email = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);
    const isLoading = ref(false);
    const isResetComplete = ref(false);
    const passwordError = ref("");
    const confirmPasswordError = ref("");

    // URL 파라미터에서 이메일 가져오기
    onMounted(() => {
      if (route.params.email) {
        email.value = route.params.email;
      } else {
        // 이메일 파라미터가 없으면 비밀번호 찾기 페이지로 리다이렉트
        notificationStore.showError(
          "비밀번호 재설정을 위해 이메일 인증이 필요합니다."
        );
        router.push({ name: "forgot-password" });
      }
    });

    // 비밀번호 표시/숨김 전환
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value;
    };

    const toggleConfirmPasswordVisibility = () => {
      showConfirmPassword.value = !showConfirmPassword.value;
    };

    // 비밀번호 유효성 검사
    const isPasswordValid = computed(() => {
      return isValidPassword(password.value);
    });

    // 비밀번호 일치 확인
    const doPasswordsMatch = computed(() => {
      return (
        password.value && isMatching(password.value, confirmPassword.value)
      );
    });

    // 비밀번호 강도 관련 계산
    const passwordStrength = computed(() => {
      return analyzePasswordStrength(password.value);
    });

    // 비밀번호 강도 퍼센트
    const strengthPercentage = computed(() => {
      return passwordStrength.value.strength;
    });

    // 비밀번호 강도 클래스
    const passwordStrengthClass = computed(() => {
      return passwordStrength.value.strengthClass;
    });

    // 비밀번호 강도 텍스트
    const passwordStrengthText = computed(() => {
      return passwordStrength.value.strengthText;
    });

    // 비밀번호 재설정
    const resetPassword = async () => {
      // 비밀번호 유효성 확인
      if (!isPasswordValid.value) {
        passwordError.value =
          "비밀번호는 영문, 숫자 조합 8자리 이상이어야 합니다.";
        return;
      }

      // 비밀번호 일치 확인
      if (!doPasswordsMatch.value) {
        confirmPasswordError.value = "비밀번호가 일치하지 않습니다.";
        return;
      }

      passwordError.value = "";
      confirmPasswordError.value = "";
      isLoading.value = true;

      try {
        const resetData = {
          email: email.value,
          password: password.value,
        };

        await AuthService.resetPassword(resetData);
        isResetComplete.value = true;
        notificationStore.showSuccess("비밀번호가 성공적으로 변경되었습니다.");
      } catch (error) {
        console.error("비밀번호 재설정 오류:", error);
        const errorMessage =
          error.response?.data?.message || "비밀번호 변경에 실패했습니다.";
        passwordError.value = errorMessage;
        notificationStore.showError(errorMessage);
      } finally {
        isLoading.value = false;
      }
    };

    // 로그인 페이지로 이동
    const goToLogin = () => {
      router.push("/auth/login");
    };

    return {
      email,
      password,
      confirmPassword,
      showPassword,
      showConfirmPassword,
      isLoading,
      isResetComplete,
      passwordError,
      confirmPasswordError,
      isPasswordValid,
      doPasswordsMatch,
      strengthPercentage,
      passwordStrengthClass,
      passwordStrengthText,
      togglePasswordVisibility,
      toggleConfirmPasswordVisibility,
      resetPassword,
      goToLogin,
    };
  },
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.reset-password {
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

.password-input-container {
  position: relative;

  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $dark-gray;
    padding: 4px;
    border-radius: 50%;
    transition: all $transition-fast;

    &:hover {
      background-color: rgba($dark-gray, 0.1);
      color: $primary-color;
    }

    &:focus {
      outline: none;
    }
  }
}

.password-strength-container {
  margin-top: $spacing-xs;
}

.password-strength {
  height: 4px;
  background-color: rgba($medium-gray, 0.5);
  border-radius: 2px;
  margin-bottom: 4px;
  overflow: hidden;

  .strength-bar {
    display: block;
    height: 100%;
    transition: width $transition-normal ease;

    &.weak {
      background-color: $error-color;
    }

    &.medium {
      background-color: $warning-color;
    }

    &.strong {
      background-color: $success-color;
    }
  }
}

.strength-text {
  font-size: 0.8rem;

  &.weak {
    color: $error-color;
  }

  &.medium {
    color: $warning-color;
  }

  &.strong {
    color: $success-color;
  }
}

.password-requirements {
  font-size: 0.8rem;
  color: $dark-gray;
  margin-top: $spacing-xs;
}

.error-message {
  color: $error-color;
  font-size: 0.85rem;
  margin-top: $spacing-xs;
  min-height: 20px;
}

.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg 0;
}

.success-icon {
  color: $success-color;
  margin-bottom: $spacing-md;
}

.success-title {
  text-align: center;
  margin-bottom: $spacing-md;
}

.success-message {
  text-align: center;
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
