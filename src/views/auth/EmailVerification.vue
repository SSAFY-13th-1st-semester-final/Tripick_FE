<template>
  <div class="email-verification">
    <!-- 헤더 -->
    <div class="email-verification__header">
      <h2 class="email-verification__title">이메일 인증</h2>
      <p class="email-verification__subtitle">
        이메일 주소를 입력하고 인증코드를 확인해 주세요
      </p>
    </div>

    <!-- 이메일 입력 -->
    <div class="form-group">
      <label for="email" class="form-label">이메일 주소</label>
      <div class="input-wrapper">
        <input
          id="email"
          v-model="emailForm.email"
          type="email"
          class="glass-input"
          :class="{ 'input-error': emailForm.errors.email }"
          placeholder="example@email.com"
          autocomplete="email"
          @input="clearEmailError"
          @keyup.enter="sendVerificationCode"
          :disabled="loading.sendCode"
        />
        <div v-if="emailForm.errors.email" class="error-message">
          {{ emailForm.errors.email }}
        </div>
      </div>
    </div>

    <button
      class="glass-btn accent send-btn"
      :class="{ 'btn-loading': loading.sendCode }"
      :disabled="!isEmailValid || loading.sendCode"
      @click="sendVerificationCode"
    >
      <span v-if="loading.sendCode" class="btn-spinner"></span>
      {{ loading.sendCode ? "전송 중..." : "인증코드 전송" }}
    </button>

    <!-- 인증코드 입력 섹션 -->
    <div v-if="showCodeSection" class="verification-section">
      <div class="section-divider">
        <span class="divider-text">인증코드 입력</span>
      </div>

      <div class="email-info">
        <div class="email-info__text">
          <strong>{{ emailForm.email }}</strong
          >로 인증코드를 전송했습니다.
        </div>
        <button class="email-info__change-btn" @click="resetEmailInput">
          이메일 변경
        </button>
      </div>

      <div class="form-group">
        <label for="verification-code" class="form-label"
          >인증코드 (6자리)</label
        >
        <div class="verification-code-wrapper">
          <div class="verification-code-inputs">
            <input
              v-for="(digit, index) in verificationForm.code"
              :key="index"
              :ref="(el) => setCodeInputRef(el, index)"
              v-model="verificationForm.code[index]"
              type="text"
              class="glass-input code-input"
              :class="{ 'input-error': verificationForm.errors.code }"
              maxlength="1"
              pattern="[0-9A-Za-z]"
              @input="handleCodeInput(index, $event)"
              @keydown="handleCodeKeydown(index, $event)"
              @paste="handleCodePaste"
              :disabled="loading.verifyCode"
            />
          </div>
          <div v-if="verificationForm.errors.code" class="error-message">
            {{ verificationForm.errors.code }}
          </div>
        </div>
      </div>

      <!-- 재전송 타이머 -->
      <div class="resend-section">
        <div v-if="resendTimer > 0" class="resend-timer">
          {{ formatTime(resendTimer) }} 후 재전송 가능
        </div>
        <button
          v-else
          class="resend-btn"
          :disabled="loading.sendCode"
          @click="resendVerificationCode"
        >
          <span v-if="loading.sendCode" class="btn-spinner"></span>
          {{ loading.sendCode ? "전송 중..." : "인증코드 재전송" }}
        </button>
      </div>

      <button
        class="glass-btn accent verify-btn"
        :class="{ 'btn-loading': loading.verifyCode }"
        :disabled="!isCodeComplete || loading.verifyCode"
        @click="verifyCode"
      >
        <span v-if="loading.verifyCode" class="btn-spinner"></span>
        {{ loading.verifyCode ? "인증 중..." : "인증하기" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import authService from "@/services/auth.service";

// Props & Emits
const emit = defineEmits(["success", "complete"]);

// Router
const router = useRouter();

// Stores
const notificationStore = useNotificationStore();

// Reactive state
const showCodeSection = ref(false);
const codeInputRefs = ref([]);
const resendTimer = ref(0);
let resendInterval = null;

// Form states
const emailForm = reactive({
  email: "",
  errors: {
    email: "",
  },
});

const verificationForm = reactive({
  code: ["", "", "", "", "", ""],
  errors: {
    code: "",
  },
});

// Loading states
const loading = reactive({
  sendCode: false,
  verifyCode: false,
});

// Computed
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailForm.email) && !emailForm.errors.email;
});

const isCodeComplete = computed(() => {
  return (
    verificationForm.code.every((digit) => digit.length === 1) &&
    verificationForm.code.join("").length === 6
  );
});

// Methods
const setCodeInputRef = (el, index) => {
  if (el) {
    codeInputRefs.value[index] = el;
  }
};

const clearEmailError = () => {
  emailForm.errors.email = "";
};

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailForm.email) {
    emailForm.errors.email = "이메일 주소를 입력해 주세요";
    return false;
  }

  if (!emailRegex.test(emailForm.email)) {
    emailForm.errors.email = "올바른 이메일 형식을 입력해 주세요";
    return false;
  }

  emailForm.errors.email = "";
  return true;
};

const sendVerificationCode = async () => {
  if (!validateEmail()) return;

  loading.sendCode = true;

  try {
    await authService.sendVerificationCode(emailForm.email);
    showCodeSection.value = true;
    startResendTimer();
    notificationStore.showSuccess("인증코드를 전송했습니다");

    // 첫 번째 코드 입력 필드에 포커스
    setTimeout(() => {
      if (codeInputRefs.value[0]) {
        codeInputRefs.value[0].focus();
      }
    }, 100);
  } catch (error) {
    console.error("이메일 전송 실패:", error);
    notificationStore.showError(
      error.message || "인증코드 전송에 실패했습니다"
    );
  } finally {
    loading.sendCode = false;
  }
};

const handleCodeInput = (index, event) => {
  const value = event.target.value.replace(/[^0-9A-Za-z]/g, "");
  verificationForm.code[index] = value;
  verificationForm.errors.code = "";

  // 자동으로 다음 입력 필드로 이동
  if (value && index < 5) {
    codeInputRefs.value[index + 1]?.focus();
  }
};

const handleCodeKeydown = (index, event) => {
  // 백스페이스 처리
  if (event.key === "Backspace" && !verificationForm.code[index] && index > 0) {
    codeInputRefs.value[index - 1]?.focus();
  }

  // 엔터 키 처리
  if (event.key === "Enter" && isCodeComplete.value) {
    verifyCode();
  }
};

const handleCodePaste = (event) => {
  event.preventDefault();
  const pasteData = event.clipboardData
    .getData("text")
    .replace(/[^0-9A-Za-z]/g, "");

  if (pasteData.length === 6) {
    pasteData.split("").forEach((char, index) => {
      verificationForm.code[index] = char;
    });
    verificationForm.errors.code = "";

    // 마지막 입력 필드에 포커스
    codeInputRefs.value[5]?.focus();
  }
};

const verifyCode = async () => {
  if (!isCodeComplete.value) {
    verificationForm.errors.code = "6자리 인증코드를 모두 입력해 주세요";
    return;
  }

  loading.verifyCode = true;

  try {
    const verificationData = {
      email: emailForm.email,
      code: verificationForm.code.join(""),
    };

    await authService.verifyCode(verificationData);
    clearResendTimer();
    notificationStore.showSuccess("이메일 인증이 완료되었습니다");

    emit("success", {
      email: emailForm.email,
      verified: true,
    });

    setTimeout(() => {
      router.push({
        name: "reset-password",
        params: { email: emailForm.email },
      });
    }, 1500);
  } catch (error) {
    console.error("인증 실패:", error);
    verificationForm.errors.code =
      error.message || "인증코드가 올바르지 않습니다";
    notificationStore.showError("인증에 실패했습니다. 다시 시도해 주세요");

    // 첫 번째 입력 필드에 포커스하고 모든 코드 초기화
    verificationForm.code = ["", "", "", "", "", ""];
    setTimeout(() => {
      if (codeInputRefs.value[0]) {
        codeInputRefs.value[0].focus();
      }
    }, 100);
  } finally {
    loading.verifyCode = false;
  }
};

const resendVerificationCode = async () => {
  if (resendTimer.value > 0) return;

  loading.sendCode = true;

  try {
    await authService.sendVerificationCode(emailForm.email);
    startResendTimer();
    notificationStore.showSuccess("인증코드를 다시 전송했습니다");

    // 코드 입력 필드 초기화
    verificationForm.code = ["", "", "", "", "", ""];
    verificationForm.errors.code = "";

    // 첫 번째 입력 필드에 포커스
    setTimeout(() => {
      if (codeInputRefs.value[0]) {
        codeInputRefs.value[0].focus();
      }
    }, 100);
  } catch (error) {
    console.error("인증코드 재전송 실패:", error);
    notificationStore.showError(
      error.message || "인증코드 재전송에 실패했습니다"
    );
  } finally {
    loading.sendCode = false;
  }
};

const startResendTimer = () => {
  resendTimer.value = 300; // 5분
  resendInterval = setInterval(() => {
    resendTimer.value--;
    if (resendTimer.value <= 0) {
      clearResendTimer();
    }
  }, 1000);
};

const clearResendTimer = () => {
  if (resendInterval) {
    clearInterval(resendInterval);
    resendInterval = null;
  }
  resendTimer.value = 0;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const resetEmailInput = () => {
  showCodeSection.value = false;
  clearResendTimer();
  verificationForm.code = ["", "", "", "", "", ""];
  verificationForm.errors.code = "";
};

// Lifecycle
onUnmounted(() => {
  clearResendTimer();
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.email-verification {
  width: 100%;
  max-width: 100%;
}

.email-verification__header {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.email-verification__title {
  font-size: 1.75rem;
  font-weight: $font-weight-bold;
  color: $primary-color;
  margin-bottom: $spacing-sm;

  @media (max-width: $breakpoint-md) {
    font-size: 1.5rem;
  }
}

.email-verification__subtitle {
  font-size: 0.95rem;
  color: $dark-gray;
  margin: 0;
}

.form-group {
  margin-bottom: $spacing-lg;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: $font-weight-medium;
  color: $primary-color;
  margin-bottom: $spacing-sm;
}

.input-wrapper {
  position: relative;
}

.glass-input {
  width: 100%;
  padding: $spacing-md $spacing-lg;
  font-size: 1rem;
  border: none;
  outline: none;
  transition: all $transition-fast;

  &.input-error {
    border-color: $error-color;
    box-shadow: 0 0 0 3px rgba($error-color, 0.1);
  }

  &:focus {
    border-color: $accent-color;
    box-shadow: 0 0 0 3px rgba($accent-color, 0.1);
  }
}

.error-message {
  color: $error-color;
  font-size: 0.85rem;
  margin-top: $spacing-xs;
  font-weight: $font-weight-medium;
}

.send-btn,
.verify-btn {
  width: 100%;
  padding: $spacing-md $spacing-lg;
  font-size: 1rem;
  font-weight: $font-weight-medium;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  &.btn-loading {
    color: transparent;
  }
}

.btn-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.verification-section {
  margin-top: $spacing-xl;
  animation: fadeInUp 0.4s ease-out;
}

.section-divider {
  text-align: center;
  margin: $spacing-xl 0;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba($medium-gray, 0.5);
  }

  .divider-text {
    background: white;
    padding: 0 $spacing-md;
    font-size: 0.85rem;
    color: $dark-gray;
    font-weight: $font-weight-medium;
  }
}

.email-info {
  background: rgba($light-gray, 0.5);
  border-radius: 12px;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;

  @media (max-width: $breakpoint-md) {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
  }
}

.email-info__text {
  font-size: 0.9rem;
  color: $primary-color;

  strong {
    color: $accent-color;
    font-weight: $font-weight-medium;
  }
}

.email-info__change-btn {
  background: none;
  border: none;
  color: $accent-color;
  font-size: 0.85rem;
  font-weight: $font-weight-medium;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: 6px;
  transition: all $transition-fast;

  &:hover {
    background: rgba($accent-color, 0.1);
  }
}

.verification-code-wrapper {
  width: 100%;
}

.verification-code-inputs {
  display: flex;
  gap: $spacing-sm;
  justify-content: center;
  margin-bottom: $spacing-md;
}

.code-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: $font-weight-bold;
  padding: 0;
  border-radius: 12px;

  @media (max-width: $breakpoint-md) {
    width: 44px;
    height: 52px;
    font-size: 1.25rem;
  }
}

.resend-section {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.resend-timer {
  font-size: 0.9rem;
  color: $dark-gray;
  font-weight: $font-weight-medium;
}

.resend-btn {
  background: none;
  border: none;
  color: $accent-color;
  font-size: 0.9rem;
  font-weight: $font-weight-medium;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: 6px;
  transition: all $transition-fast;
  position: relative;

  &:hover:not(:disabled) {
    background: rgba($accent-color, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
