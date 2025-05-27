<template>
  <div class="signup-form">
    <h2 class="signup-form__title">회원가입</h2>

    <form @submit.prevent="submitForm" class="signup-form__form">
      <AppInput
        v-model="formData.username"
        label="아이디"
        placeholder="아이디를 입력하세요"
        :invalid="!!errors.username"
        :error-message="errors.username"
        required
        autocomplete="username"
      />

      <!-- 비밀번호 입력에 PasswordInput 컴포넌트 사용 -->
      <PasswordInput
        v-model="formData.password"
        id="password"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요"
        :showRequirements="true"
        :showStrengthMeter="true"
        @password-valid="onPasswordValid"
        @update:error="errors.password = $event"
        autocomplete="new-password"
        required
      />

      <!-- 비밀번호 확인에도 PasswordInput 컴포넌트 사용 -->
      <PasswordInput
        v-model="passwordConfirm"
        id="passwordConfirm"
        label="비밀번호 확인"
        placeholder="비밀번호를 다시 입력하세요"
        :showRequirements="false"
        :showStrengthMeter="false"
        :is-confirm-field="true"
        :confirm-password="formData.password"
        @password-valid="onConfirmPasswordValid"
        @update:error="errors.passwordConfirm = $event"
        autocomplete="new-password"
        required
      />

      <AppInput
        v-model="formData.nickname"
        label="닉네임"
        placeholder="닉네임을 입력하세요"
        :invalid="!!errors.nickname"
        :error-message="errors.nickname"
        required
      />

      <!-- 이메일 입력란 및 인증 기능 -->
      <div class="email-verification">
        <!-- 이메일 라벨 -->
        <label class="email-label">
          이메일 <span class="email-required">*</span>
        </label>

        <!-- 이메일 입력폼과 버튼을 같은 행에 배치 -->
        <div class="email-input-group">
          <div class="email-input-wrapper">
            <input
              v-model="formData.email"
              type="email"
              class="email-input-field"
              :class="{ 'email-input-field--invalid': !!errors.email }"
              placeholder="이메일을 입력하세요"
              autocomplete="email"
              required
            />
            <div v-if="errors.email" class="email-error">
              {{ errors.email }}
            </div>
          </div>

          <button
            type="button"
            class="verification-send-btn glass-btn"
            :class="{
              primary: !isEmailVerified,
              success: isEmailVerified,
              disabled: isSendingCode || !formData.email || !!errors.email,
            }"
            :disabled="
              isSendingCode ||
              !formData.email ||
              !!errors.email ||
              isEmailVerified
            "
            @click="sendVerificationCode"
            :title="
              isEmailVerified
                ? '인증완료'
                : codeSent
                ? '재전송'
                : '인증코드 전송'
            "
          >
            <span v-if="isSendingCode" class="loading-spinner"></span>
            <!-- 인증완료 아이콘 -->
            <svg
              v-else-if="isEmailVerified"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              ></path>
              <path d="M7.5 12.5L10.5 15.5L16 10"></path>
            </svg>
            <!-- 이메일 전송 아이콘 -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              ></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </button>
        </div>

        <!-- 인증코드 입력란 (이메일 전송 후 표시) -->
        <transition name="slide-down">
          <div
            v-if="codeSent && !isEmailVerified"
            class="verification-code-section"
          >
            <!-- 인증코드 라벨 -->
            <label class="verification-code-label">
              인증코드 <span class="verification-code-required">*</span>
            </label>

            <!-- 인증코드 입력폼과 버튼을 같은 행에 배치 -->
            <div class="verification-code-group">
              <div class="verification-code-input-wrapper">
                <input
                  v-model="verificationCode"
                  type="text"
                  class="verification-code-input-field"
                  :class="{
                    'verification-code-input-field--invalid':
                      !!errors.verificationCode,
                  }"
                  placeholder="6자리 인증코드를 입력하세요"
                  maxlength="6"
                  @input="formatVerificationCode"
                />
                <div
                  v-if="errors.verificationCode"
                  class="verification-code-error"
                >
                  {{ errors.verificationCode }}
                </div>
              </div>

              <button
                type="button"
                class="verification-confirm-btn glass-btn primary"
                :class="{
                  disabled: isVerifyingCode || verificationCode.length !== 6,
                }"
                :disabled="isVerifyingCode || verificationCode.length !== 6"
                @click="verifyVerificationCode"
                title="인증코드 확인"
              >
                <span v-if="isVerifyingCode" class="loading-spinner"></span>
                <!-- 확인 아이콘 -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </button>
            </div>

            <!-- 재전송 타이머 -->
            <div v-if="resendTimer > 0" class="resend-timer">
              {{ Math.floor(resendTimer / 60) }}:{{
                String(resendTimer % 60).padStart(2, "0")
              }}
              후 재전송 가능
            </div>
          </div>
        </transition>
      </div>

      <AppInput
        v-model="formData.phoneNumber"
        label="전화번호"
        placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
        :invalid="!!errors.phoneNumber"
        :error-message="errors.phoneNumber"
        required
        autocomplete="tel"
      />

      <div class="signup-form__agreement">
        <label class="signup-form__checkbox">
          <input
            type="checkbox"
            v-model="formData.policyAgreed"
            :class="{ 'is-invalid': !!errors.policyAgreed }"
          />
          <span class="signup-form__checkbox-text">
            이용약관 및 개인정보 처리방침에 동의합니다.
          </span>
        </label>
        <div v-if="errors.policyAgreed" class="signup-form__agreement-error">
          {{ errors.policyAgreed }}
        </div>
      </div>

      <div class="signup-form__actions">
        <AppButton
          type="submit"
          variant="primary"
          size="lg"
          block
          :loading="isLoading"
          :disabled="!isEmailVerified"
        >
          회원가입
        </AppButton>
      </div>

      <div class="signup-form__login-link">
        이미 계정이 있으신가요?
        <router-link to="/auth/login">로그인</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import AppInput from "@/components/common/shared/AppInput.vue";
import AppButton from "@/components/common/shared/AppButton.vue";
import PasswordInput from "@/components/common/shared/PassWordInput.vue";
import {
  isUsernameAvailable,
  isValidEmail,
  isValidPhoneNumber,
  isRequired,
} from "@/utils/validators";
import AuthService from "@/services/auth.service";

// 라우터와 Pinia 스토어 사용
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 폼 데이터 정의
const formData = reactive({
  username: "",
  password: "",
  nickname: "",
  email: "",
  phoneNumber: "",
  policyAgreed: false,
});

// 이메일 인증 관련 상태
const codeSent = ref(false);
const verificationCode = ref("");
const isEmailVerified = ref(false);
const isSendingCode = ref(false);
const isVerifyingCode = ref(false);
const resendTimer = ref(0);
let resendInterval = null;

// 추가 상태 변수
const passwordConfirm = ref("");
const errors = reactive({});
const isLoading = ref(false);
const isPasswordValid = ref(false);
const isPasswordConfirmValid = ref(false);

let usernameDebounceTimer = null;

// 인증코드 포맷팅 (대소문자, 숫자만 허용)
const formatVerificationCode = (event) => {
  const value = event.target.value.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6);
  verificationCode.value = value;
};

// 재전송 타이머 시작
const startResendTimer = () => {
  resendTimer.value = 180; // 3분
  resendInterval = setInterval(() => {
    resendTimer.value--;
    if (resendTimer.value <= 0) {
      clearInterval(resendInterval);
    }
  }, 1000);
};

// 이메일 인증코드 전송
const sendVerificationCode = async () => {
  // 이메일 유효성 검사
  if (!isRequired(formData.email)) {
    errors.email = "이메일을 입력해주세요.";
    return;
  }

  if (!isValidEmail(formData.email)) {
    errors.email = "올바른 이메일 형식을 입력해주세요.";
    return;
  }

  // 오류 초기화
  delete errors.email;
  isSendingCode.value = true;

  try {
    await AuthService.sendVerificationCode(formData.email);

    codeSent.value = true;
    verificationCode.value = "";
    isEmailVerified.value = false;

    // 재전송 타이머 시작
    startResendTimer();

    notificationStore.showSuccess("인증코드가 이메일로 전송되었습니다.", {
      duration: 3000,
    });
  } catch (error) {
    notificationStore.showError(
      error.response?.data?.message || "인증코드 전송에 실패했습니다.",
      { duration: 5000 }
    );
  } finally {
    isSendingCode.value = false;
  }
};

// 인증코드 확인
const verifyVerificationCode = async () => {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    errors.verificationCode = "6자리 인증코드를 입력해주세요.";
    return;
  }

  delete errors.verificationCode;
  isVerifyingCode.value = true;

  try {
    await AuthService.verifyCode({
      email: formData.email,
      code: verificationCode.value,
    });

    isEmailVerified.value = true;
    codeSent.value = false;

    // 타이머 정리
    if (resendInterval) {
      clearInterval(resendInterval);
      resendTimer.value = 0;
    }

    notificationStore.showSuccess("이메일 인증이 완료되었습니다.", {
      duration: 3000,
    });
  } catch (error) {
    errors.verificationCode =
      error.response?.data?.message || "인증코드가 올바르지 않습니다.";
    notificationStore.showError(
      error.response?.data?.message || "인증코드 확인에 실패했습니다.",
      { duration: 5000 }
    );
  } finally {
    isVerifyingCode.value = false;
  }
};

// 아이디 중복 확인
watch(
  () => formData.username,
  (newUsername) => {
    clearTimeout(usernameDebounceTimer);

    if (!isRequired(newUsername)) {
      errors.username = "아이디를 입력해주세요.";
      return;
    }

    usernameDebounceTimer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(newUsername);
        if (!available) {
          errors.username = "이미 사용 중인 아이디입니다.";
        } else {
          delete errors.username;
        }
      } catch (error) {}
    }, 500);
  }
);

// 이메일 변경 시 인증 상태 초기화
watch(
  () => formData.email,
  () => {
    if (isEmailVerified.value) {
      isEmailVerified.value = false;
      codeSent.value = false;
      verificationCode.value = "";

      // 타이머 정리
      if (resendInterval) {
        clearInterval(resendInterval);
        resendTimer.value = 0;
      }
    }
  }
);

// 비밀번호 유효성 상태 업데이트 핸들러
const onPasswordValid = (valid) => {
  isPasswordValid.value = valid;
};

// 비밀번호 확인 유효성 상태 업데이트 핸들러
const onConfirmPasswordValid = (valid) => {
  isPasswordConfirmValid.value = valid;
};

// 폼 유효성 검사
const validateForm = () => {
  const newErrors = {};

  // 필수 필드 확인
  if (!isRequired(formData.username)) {
    newErrors.username = "아이디를 입력해주세요.";
  }

  // 비밀번호는 PasswordInput 컴포넌트에서 유효성 검사
  if (!isPasswordValid.value) {
    newErrors.password =
      "비밀번호는 영문과 숫자를 조합하여 8자리 이상이어야 합니다.";
  }

  // 비밀번호 확인은 PasswordInput 컴포넌트에서 유효성 검사
  if (!isPasswordConfirmValid.value) {
    newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
  }

  // 닉네임 확인
  if (!isRequired(formData.nickname)) {
    newErrors.nickname = "닉네임을 입력해주세요.";
  }

  // 이메일 유효성 검사
  if (!isRequired(formData.email)) {
    newErrors.email = "이메일을 입력해주세요.";
  } else if (!isValidEmail(formData.email)) {
    newErrors.email = "유효한 이메일 주소를 입력해주세요.";
  }

  // 이메일 인증 확인
  if (!isEmailVerified.value) {
    newErrors.email = "이메일 인증을 완료해주세요.";
  }

  // 전화번호 유효성 검사
  if (!isRequired(formData.phoneNumber)) {
    newErrors.phoneNumber = "전화번호를 입력해주세요.";
  } else if (!isValidPhoneNumber(formData.phoneNumber)) {
    newErrors.phoneNumber =
      "유효한 전화번호 형식을 입력해주세요. (예: 010-1234-5678)";
  }

  // 이용약관 동의 확인
  if (!formData.policyAgreed) {
    newErrors.policyAgreed = "이용약관 및 개인정보 처리방침에 동의해주세요.";
  }

  // 오류 객체 업데이트 (비밀번호 관련 필드는 컴포넌트에서 처리)
  Object.keys(errors).forEach((key) => {
    if (key !== "password" && key !== "passwordConfirm") {
      delete errors[key];
    }
  });

  Object.keys(newErrors).forEach((key) => {
    if (key !== "password" && key !== "passwordConfirm") {
      errors[key] = newErrors[key];
    }
  });

  return Object.keys(newErrors).length === 0;
};

// 폼 제출 처리
const submitForm = async () => {
  // 유효성 검사
  if (!validateForm()) {
    return;
  }

  // 로딩 상태 설정
  isLoading.value = true;

  try {
    // Pinia 스토어를 통한 회원가입 요청
    await authStore.register({ ...formData });

    // 회원가입 성공 알림
    notificationStore.showSuccess(
      "회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.",
      {
        duration: 3000,
      }
    );

    // 회원가입 성공 후 로그인 페이지로 이동
    router.push({
      name: "login",
      query: { registered: "true" },
    });
  } catch (error) {
    // 회원가입 오류 처리
    if (authStore.registerError) {
      notificationStore.showError(authStore.registerError, {
        duration: 5000,
      });
    } else {
      notificationStore.showError(
        "회원가입에 실패했습니다. 다시 시도해주세요.",
        {
          duration: 5000,
        }
      );
    }
  } finally {
    // 로딩 상태 해제
    isLoading.value = false;
  }
};

// 컴포넌트 언마운트 시 타이머 정리
onUnmounted(() => {
  if (resendInterval) {
    clearInterval(resendInterval);
  }
  if (usernameDebounceTimer) {
    clearTimeout(usernameDebounceTimer);
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.signup-form {
  width: 100%;

  &__title {
    text-align: center;
    margin-bottom: $spacing-xl;
    color: $primary-color;
  }

  &__form {
    width: 100%;
  }

  &__agreement {
    margin-bottom: $spacing-lg;
  }

  &__checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border: 1px solid rgba($primary-color, 0.3);
      border-radius: 4px;
      margin-right: $spacing-sm;
      position: relative;
      background-color: rgba($white, 0.7);
      transition: all $transition-fast;
      cursor: pointer;

      &:checked {
        background-color: $primary-color;
        border-color: $primary-color;

        &::after {
          content: "";
          position: absolute;
          left: 7px;
          top: 3px;
          width: 6px;
          height: 10px;
          border: solid $white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }

      &.is-invalid {
        border-color: $error-color;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.3);
      }
    }
  }

  &__checkbox-text {
    font-size: 0.9rem;
    color: $primary-color;
  }

  &__agreement-error {
    margin-top: $spacing-xs;
    font-size: 0.75rem;
    color: $error-color;
    margin-left: 28px;
  }

  &__actions {
    margin-top: $spacing-xl;
    margin-bottom: $spacing-md;
  }

  &__login-link {
    text-align: center;
    font-size: 0.9rem;
    color: $primary-color;

    a {
      color: $accent-color;
      font-weight: $font-weight-medium;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// 이메일 인증 관련 스타일
.email-verification {
  margin-bottom: $spacing-md;
}

.email-label {
  display: block;
  font-size: 0.875rem;
  font-weight: $font-weight-medium;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.email-required {
  color: $error-color;
  margin-left: 2px;
}

.email-input-group {
  display: flex;
  gap: $spacing-sm;
  align-items: flex-start; // 상단 정렬로 변경

  .email-input-wrapper {
    flex: 1;
  }

  .email-input-field {
    width: 100%;
    height: 48px;
    padding: $spacing-sm $spacing-md;
    border-radius: 8px;
    font-family: $font-family;
    font-size: 1rem;
    color: $primary-color;
    border: 1px solid rgba($primary-color, 0.2);

    @include glassmorphism(0.4, 5px);

    &::placeholder {
      color: rgba($primary-color, 0.5);
    }

    &:focus {
      outline: none;
      border-color: rgba($primary-color, 0.5);
      box-shadow: 0 0 0 1px rgba($primary-color, 0.5);
    }

    &--invalid {
      border-color: $error-color;

      &:focus {
        box-shadow: 0 0 0 1px $error-color;
      }
    }
  }

  .verification-send-btn {
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all $transition-fast;
    flex-shrink: 0;
    cursor: pointer;

    // 글래스모피즘 스타일 적용
    @include glassmorphism(0.5, 8px);
    color: $primary-color;

    &:hover {
      background: rgba(255, 255, 255, 0.7);
      box-shadow: 0 10px 20px rgba(31, 38, 135, 0.2);
      transform: translateY(-1px);
    }

    &:active {
      transform: scale(0.98);
    }

    &.primary {
      background: rgba($accent-color, 0.85);
      color: white;

      &:hover {
        background: rgba($accent-color, 0.95);
      }
    }

    &.success {
      background: rgba($success-color, 0.85);
      color: white;

      &:hover {
        background: rgba($success-color, 0.95);
      }
    }

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
}

.email-error {
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $error-color;
}

.verification-code-section {
  margin-top: $spacing-md;
}

.verification-code-label {
  display: block;
  font-size: 0.875rem;
  font-weight: $font-weight-medium;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.verification-code-required {
  color: $error-color;
  margin-left: 2px;
}

.verification-code-group {
  display: flex;
  gap: $spacing-sm;
  align-items: flex-start; // 상단 정렬로 변경

  .verification-code-input-wrapper {
    flex: 1;
  }

  .verification-code-input-field {
    width: 100%;
    height: 48px;
    padding: $spacing-sm $spacing-md;
    border-radius: 8px;
    font-family: $font-family;
    font-size: 1rem;
    color: $primary-color;
    border: 1px solid rgba($primary-color, 0.2);

    @include glassmorphism(0.4, 5px);

    &::placeholder {
      color: rgba($primary-color, 0.5);
    }

    &:focus {
      outline: none;
      border-color: rgba($primary-color, 0.5);
      box-shadow: 0 0 0 1px rgba($primary-color, 0.5);
    }

    &--invalid {
      border-color: $error-color;

      &:focus {
        box-shadow: 0 0 0 1px $error-color;
      }
    }
  }

  .verification-confirm-btn {
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all $transition-fast;
    flex-shrink: 0;
    cursor: pointer;

    // 글래스모피즘 스타일 적용
    @include glassmorphism(0.5, 8px);
    background: rgba($accent-color, 0.85);
    color: white;

    &:hover {
      background: rgba($accent-color, 0.95);
      box-shadow: 0 10px 20px rgba(31, 38, 135, 0.2);
      transform: translateY(-1px);
    }

    &:active {
      transform: scale(0.98);
    }

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
}

.verification-code-error {
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $error-color;
}

.resend-timer {
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $dark-gray;
  text-align: center;
}

// 로딩 스피너
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 슬라이드 다운 애니메이션
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
  transform-origin: top;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.8);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.8);
}

// 모바일 반응형 - 수정된 부분
@media (max-width: $breakpoint-sm) {
  .email-input-group,
  .verification-code-group {
    flex-direction: column;
    align-items: stretch;

    .verification-send-btn,
    .verification-confirm-btn {
      width: 100%;
      height: 44px;
      margin-top: $spacing-xs;
    }
  }
}

// 태블릿 이상에서는 항상 가로 배치 유지
@media (min-width: $breakpoint-sm) {
  .email-input-group,
  .verification-code-group {
    flex-direction: row;
    align-items: flex-start;
  }
}
</style>
