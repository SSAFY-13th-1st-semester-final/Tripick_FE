<template>
  <div class="reset-password">
    <h2 class="page-title">비밀번호 재설정</h2>

    <div v-if="!isResetComplete">
      <!-- 새 비밀번호 입력 - 분리된 컴포넌트 사용 -->
      <PasswordInput
        v-model="password"
        id="password"
        label="새 비밀번호"
        placeholder="새 비밀번호를 입력하세요"
        :showRequirements="true"
        :showStrengthMeter="true"
        @password-valid="onPasswordValid"
        @update:error="passwordError = $event"
      />

      <!-- 비밀번호 확인 입력 - 분리된 컴포넌트 사용 -->
      <PasswordInput
        v-model="confirmPassword"
        id="confirmPassword"
        label="비밀번호 확인"
        placeholder="비밀번호를 다시 입력하세요"
        :showRequirements="false"
        :showStrengthMeter="false"
        :is-confirm-field="true"
        :confirm-password="password"
        @password-valid="onConfirmPasswordValid"
        @update:error="confirmPasswordError = $event"
        class="form-field-bottom"
      />

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
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import AuthService from "@/services/auth.service";
import PasswordInput from "@/components/common/PassWordInput.vue";

export default {
  components: {
    PasswordInput,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const notificationStore = useNotificationStore();

    // 상태 관리
    const email = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const isLoading = ref(false);
    const isResetComplete = ref(false);
    const passwordError = ref("");
    const confirmPasswordError = ref("");
    const isPasswordValid = ref(false);
    const doPasswordsMatch = ref(false);

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

    // 비밀번호 유효성 상태 업데이트 핸들러
    const onPasswordValid = (valid) => {
      isPasswordValid.value = valid;
    };

    // 비밀번호 확인 유효성 상태 업데이트 핸들러
    const onConfirmPasswordValid = (valid) => {
      doPasswordsMatch.value = valid;
    };

    // 비밀번호 재설정
    const resetPassword = async () => {
      if (!isPasswordValid.value) {
        return;
      }

      if (!doPasswordsMatch.value) {
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
      isLoading,
      isResetComplete,
      passwordError,
      confirmPasswordError,
      isPasswordValid,
      doPasswordsMatch,
      onPasswordValid,
      onConfirmPasswordValid,
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

.form-field-bottom {
  margin-bottom: $spacing-lg;
}

.full-width {
  width: 100%;
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
