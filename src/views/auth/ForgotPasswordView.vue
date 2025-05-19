<template>
  <div class="forgot-password">
    <h2 class="text-center mb-lg">비밀번호 찾기</h2>

    <div v-if="!isCodeVerified">
      <!-- 이메일 입력 -->
      <div class="mb-md">
        <label for="email" class="input-label">이메일</label>
        <input
          type="email"
          id="email"
          v-model="email"
          class="glass-input full-width"
          placeholder="이메일 주소를 입력하세요"
          :disabled="isCodeSent"
          @keyup.enter="sendVerificationCode"
        />
        <p class="error-message" v-if="emailError">{{ emailError }}</p>
      </div>

      <!-- 인증 코드 입력 (코드 전송 후에만 표시) -->
      <div v-if="isCodeSent" class="mb-md">
        <div class="code-header">
          <label for="verification-code" class="input-label">인증코드</label>
          <div class="timer" v-if="remainingTime > 0">
            {{ formatTime(remainingTime) }}
          </div>
        </div>

        <!-- 숨겨진 입력 필드 (복사-붙여넣기 처리용) -->
        <input
          type="text"
          id="verification-code"
          ref="codeInput"
          v-model="verificationCode"
          class="hidden-input"
          maxlength="6"
          @input="handleCodeInput"
          @keydown="handleKeyDown"
          @paste="handlePaste"
        />

        <!-- 보이는 코드 입력 UI -->
        <div class="code-input-boxes">
          <div
            v-for="(digit, index) in codeDigits"
            :key="index"
            class="code-digit-box"
            :class="{
              active: index === activeDigitIndex,
              filled: digit !== '',
            }"
            @click="focusInput(index)"
          >
            {{ digit }}
          </div>
        </div>

        <div class="code-actions">
          <button
            class="glass-btn text-btn"
            :disabled="isResendDisabled"
            @click="sendVerificationCode"
          >
            재전송
          </button>
        </div>

        <p class="error-message" v-if="codeError">{{ codeError }}</p>
      </div>

      <!-- 다음 단계 버튼 -->
      <div class="btn-container">
        <button
          v-if="!isCodeSent"
          class="glass-btn primary full-width"
          @click="sendVerificationCode"
          :disabled="!isEmailValid || isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>인증코드 전송</span>
        </button>

        <button
          v-else
          class="glass-btn primary full-width"
          @click="verifyCode"
          :disabled="verificationCode.length !== 6 || isVerifying"
        >
          <span v-if="isVerifying" class="loading-spinner"></span>
          <span v-else>인증코드 확인</span>
        </button>
      </div>
    </div>

    <!-- 인증 후 비밀번호 재설정 페이지로 이동 안내 -->
    <div v-else class="verification-success">
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
      <h3 class="text-center mb-md">인증 완료</h3>
      <p class="text-center mb-lg">비밀번호 재설정 페이지로 이동합니다.</p>
      <button class="glass-btn primary full-width" @click="goToResetPassword">
        계속하기
      </button>
    </div>

    <div class="mt-lg text-center">
      <router-link to="/auth/login" class="link-text"
        >로그인으로 돌아가기</router-link
      >
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import AuthService from "@/services/auth.service";
import { isValidEmail } from "@/utils/validators";

export default {
  setup() {
    const router = useRouter();
    const notificationStore = useNotificationStore();
    const codeInput = ref(null);

    // 상태 관리
    const email = ref("");
    const verificationCode = ref("");
    const codeDigits = ref(Array(6).fill(""));
    const activeDigitIndex = ref(0);
    const isCodeSent = ref(false);
    const isCodeVerified = ref(false);
    const isLoading = ref(false);
    const isVerifying = ref(false);
    const emailError = ref("");
    const codeError = ref("");
    const remainingTime = ref(0);
    const timer = ref(null);

    // verificationCode 변경 시 codeDigits 업데이트
    watch(verificationCode, (newValue) => {
      const code = newValue.padEnd(6, "");
      for (let i = 0; i < 6; i++) {
        codeDigits.value[i] = code[i] || "";
      }
    });

    // 코드 디지트 업데이트 시 verificationCode 업데이트
    watch(
      codeDigits,
      (newDigits) => {
        verificationCode.value = newDigits.join("");
      },
      { deep: true }
    );

    // 인증코드 입력 처리
    const handleCodeInput = () => {
      // 입력된 코드 길이를 기준으로 활성 인덱스 설정
      activeDigitIndex.value = Math.min(verificationCode.value.length, 5);

      // codeDigits 배열 업데이트
      const codeArr = verificationCode.value.split("");
      for (let i = 0; i < 6; i++) {
        codeDigits.value[i] = codeArr[i] || "";
      }
    };

    // 키보드 이벤트 처리
    const handleKeyDown = (e) => {
      // Backspace 처리
      if (e.key === "Backspace" && verificationCode.value.length > 0) {
        // 마지막 문자 삭제 후 활성 인덱스 이동
        verificationCode.value = verificationCode.value.slice(0, -1);
        activeDigitIndex.value = Math.max(0, verificationCode.value.length);
      }
    };

    // 붙여넣기 이벤트 처리
    const handlePaste = (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData(
        "text"
      );

      // 숫자만 추출
      const numericText = pastedText.replace(/[^0-9]/g, "").slice(0, 6);

      // 전체 코드 설정
      verificationCode.value = numericText;
      activeDigitIndex.value = Math.min(numericText.length, 5);

      // 자동 검증 (6자리가 모두 입력된 경우)
      if (numericText.length === 6) {
        setTimeout(() => {
          verifyCode();
        }, 300);
      }
    };

    // 특정 인덱스 위치로 포커스 이동
    const focusInput = (index) => {
      if (codeInput.value) {
        codeInput.value.focus();
        activeDigitIndex.value = index;
      }
    };

    // 타이머 포맷
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // 이메일 유효성 검사
    const isEmailValid = computed(() => {
      return isValidEmail(email.value);
    });

    // 재전송 버튼 비활성화 상태
    const isResendDisabled = computed(() => {
      return remainingTime.value > 0;
    });

    // 인증코드 전송
    const sendVerificationCode = async () => {
      // 이메일 유효성 확인
      if (!isEmailValid.value) {
        emailError.value = "유효한 이메일 주소를 입력해주세요.";
        return;
      }

      emailError.value = "";
      isLoading.value = true;

      try {
        await AuthService.sendVerificationCode(email.value);
        isCodeSent.value = true;
        startTimer();
        notificationStore.showSuccess("인증코드가 이메일로 전송되었습니다.");

        // 코드 입력란 초기화 및 포커스
        verificationCode.value = "";
        activeDigitIndex.value = 0;
        codeDigits.value = Array(6).fill("");

        // 입력 필드에 포커스
        setTimeout(() => {
          if (codeInput.value) {
            codeInput.value.focus();
          }
        }, 100);
      } catch (error) {
        console.error("인증코드 전송 오류:", error);
        const errorMessage =
          error.response?.data?.message || "인증코드 전송에 실패했습니다.";
        emailError.value = errorMessage;
        notificationStore.showError(errorMessage);
      } finally {
        isLoading.value = false;
      }
    };

    // 인증코드 확인
    const verifyCode = async () => {
      if (verificationCode.value.length !== 6) {
        codeError.value = "6자리 인증코드를 입력해주세요.";
        return;
      }

      codeError.value = "";
      isVerifying.value = true;

      try {
        const verificationData = {
          email: email.value,
          code: verificationCode.value,
        };

        await AuthService.verifyCode(verificationData);
        clearTimer();
        isCodeVerified.value = true;
        notificationStore.showSuccess("인증이 완료되었습니다.");
      } catch (error) {
        console.error("인증코드 확인 오류:", error);
        const errorMessage =
          error.response?.data?.message || "인증코드가 올바르지 않습니다.";
        codeError.value = errorMessage;
        notificationStore.showError(errorMessage);
      } finally {
        isVerifying.value = false;
      }
    };

    // 타이머 시작
    const startTimer = () => {
      // 기존 타이머 정리
      clearTimer();

      // 3분(180초) 타이머 설정
      remainingTime.value = 300;

      // 타이머 시작
      timer.value = setInterval(() => {
        if (remainingTime.value > 0) {
          remainingTime.value--;
        } else {
          clearTimer();
        }
      }, 1000);
    };

    // 타이머 정리
    const clearTimer = () => {
      if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
      }
    };

    // 비밀번호 재설정 페이지로 이동
    const goToResetPassword = () => {
      router.push({
        name: "reset-password",
        params: { email: email.value },
      });
    };

    // 컴포넌트 마운트 시 이메일 필드에 포커스
    onMounted(() => {
      // 이메일 필드 초기 포커스
      const emailInput = document.getElementById("email");
      if (emailInput) {
        emailInput.focus();
      }
    });

    // 컴포넌트 언마운트 시 타이머 정리
    onUnmounted(() => {
      clearTimer();
    });

    return {
      email,
      verificationCode,
      codeDigits,
      activeDigitIndex,
      codeInput,
      isCodeSent,
      isCodeVerified,
      isLoading,
      isVerifying,
      emailError,
      codeError,
      remainingTime,
      isEmailValid,
      isResendDisabled,
      formatTime,
      sendVerificationCode,
      verifyCode,
      goToResetPassword,
      handleCodeInput,
      handleKeyDown,
      handlePaste,
      focusInput,
    };
  },
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.forgot-password {
  width: 100%;
  padding: $spacing-md 0;
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
  margin-top: $spacing-md;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xs;
}

.timer {
  font-size: 0.85rem;
  font-weight: $font-weight-medium;
  color: $accent-color;
}

// 숨겨진 입력 필드
.hidden-input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
}

// 코드 입력 박스 스타일
.code-input-boxes {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
  justify-content: center; // 중앙 정렬 추가
}

.code-digit-box {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: $font-weight-bold;
  background-color: rgba($light-gray, 0.5);
  border: 1px solid $medium-gray;
  color: $primary-color;
  cursor: pointer;
  transition: all $transition-fast;

  &.active {
    border-color: $accent-color;
    box-shadow: 0 0 0 2px rgba($accent-color, 0.2);
  }

  &.filled {
    background-color: rgba($white, 0.8);
  }
}

.code-actions {
  display: flex;
  justify-content: center; // 중앙 정렬로 변경
  margin-bottom: $spacing-xs;
}

.text-btn {
  background: transparent;
  box-shadow: none;
  border: none;
  color: $accent-color;
  padding: $spacing-xs $spacing-sm;
  font-size: 0.9rem;

  &:hover {
    background: rgba($accent-color, 0.1);
  }

  &:disabled {
    color: $dark-gray;
    cursor: not-allowed;

    &:hover {
      background: transparent;
    }
  }
}

.link-text {
  font-size: 0.9rem;
  color: $accent-color;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.verification-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md 0;
}

.success-icon {
  color: $success-color;
  margin-bottom: $spacing-md;
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
