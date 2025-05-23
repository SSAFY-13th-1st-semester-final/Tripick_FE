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

      <AppInput
        v-model="formData.email"
        label="이메일"
        type="email"
        placeholder="이메일을 입력하세요"
        :invalid="!!errors.email"
        :error-message="errors.email"
        required
        autocomplete="email"
      />

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
import { ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppInput from "@/components/common/shared/AppInput.vue";
import AppButton from "@/components/common/shared/AppButton.vue";
import PasswordInput from "@/components/common/shared/PasswordInput.vue";
import {
  isUsernameAvailable,
  isValidEmail,
  isValidPhoneNumber,
  isRequired,
} from "@/utils/validators";

// 라우터와 Pinia 스토어 사용
const router = useRouter();
const authStore = useAuthStore();

// 폼 데이터 정의
const formData = reactive({
  username: "",
  password: "",
  nickname: "",
  email: "",
  phoneNumber: "",
  policyAgreed: false,
});

// 추가 상태 변수
const passwordConfirm = ref("");
const errors = reactive({});
const isLoading = ref(false);
const isPasswordValid = ref(false);
const isPasswordConfirmValid = ref(false);

let usernameDebounceTimer = null;

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

    // 회원가입 성공 후 홈 페이지로 이동
    router.push({ name: "home" });
  } catch (error) {
  } finally {
    // 로딩 상태 해제
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
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
</style>
