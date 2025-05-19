<template>
  <div class="password-input-wrapper">
    <!-- 라벨 -->
    <label :for="id" class="input-label" v-if="label">
      {{ label }} <span v-if="required" class="required-mark">*</span>
    </label>

    <!-- 비밀번호 입력 필드 -->
    <div class="password-input-container">
      <input
        :type="showPassword ? 'text' : 'password'"
        :id="id"
        v-model="passwordModel"
        class="glass-input full-width"
        :placeholder="placeholder"
        @input="validatePassword"
        @blur="touchField"
      />
      <button
        type="button"
        class="password-toggle"
        @click="togglePasswordVisibility"
        :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 표시'"
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

    <!-- 비밀번호 강도 표시 (비밀번호가 입력된 경우에만 표시) -->
    <div
      class="password-strength-container"
      v-if="passwordModel && showStrengthMeter"
    >
      <div class="password-strength">
        <span
          class="strength-bar"
          :class="strengthClass"
          :style="{ width: strengthPercentage + '%' }"
        ></span>
      </div>
      <div class="strength-text" :class="strengthClass">
        {{ strengthText }}
      </div>
    </div>

    <!-- 비밀번호 요구사항 안내 -->
    <p class="password-requirements" v-if="showRequirements">
      {{
        requirements || "비밀번호는 영문, 숫자 조합 8자리 이상이어야 합니다."
      }}
    </p>

    <!-- 에러 메시지 -->
    <p class="error-message" v-if="touched && errorMessage">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
import { ref, computed, watch } from "vue";

export default {
  name: "PasswordInput",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "비밀번호를 입력하세요",
    },
    requirements: {
      type: String,
      default: "",
    },
    showRequirements: {
      type: Boolean,
      default: true,
    },
    showStrengthMeter: {
      type: Boolean,
      default: true,
    },
    confirmPassword: {
      type: String,
      default: "",
    },
    isConfirmField: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "password-valid", "update:error"],
  setup(props, { emit }) {
    const passwordModel = ref(props.modelValue);
    const showPassword = ref(false);
    const errorMessage = ref("");
    const touched = ref(false);
    const isValid = ref(false);

    // v-model 양방향 바인딩
    watch(
      () => props.modelValue,
      (newValue) => {
        passwordModel.value = newValue;
      }
    );

    watch(
      () => passwordModel.value,
      (newValue) => {
        emit("update:modelValue", newValue);
        validatePassword();
      }
    );

    // 비밀번호 확인 필드인 경우 확인 패스워드 변경 감지
    watch(
      () => props.confirmPassword,
      () => {
        if (props.isConfirmField) {
          validatePassword();
        }
      }
    );

    // 비밀번호 유효성 검사
    const validatePassword = () => {
      touched.value = true;

      if (!passwordModel.value) {
        errorMessage.value = "비밀번호를 입력해주세요.";
        isValid.value = false;
      } else if (props.isConfirmField) {
        // 비밀번호 확인 필드인 경우
        if (passwordModel.value !== props.confirmPassword) {
          errorMessage.value = "비밀번호가 일치하지 않습니다.";
          isValid.value = false;
        } else {
          errorMessage.value = "";
          isValid.value = true;
        }
      } else {
        // 일반 비밀번호 필드인 경우
        // 비밀번호는 영문, 숫자 조합 8자리 이상
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

        if (!passwordRegex.test(passwordModel.value)) {
          errorMessage.value =
            "비밀번호는 영문, 숫자 조합 8자리 이상이어야 합니다.";
          isValid.value = false;
        } else {
          errorMessage.value = "";
          isValid.value = true;
        }
      }

      // 에러 메시지 업데이트
      emit("update:error", errorMessage.value);

      // 유효성 상태 업데이트
      emit("password-valid", isValid.value);
    };

    // 비밀번호 표시/숨김 전환
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value;
    };

    // 필드 터치 상태 설정
    const touchField = () => {
      touched.value = true;
      validatePassword();
    };

    // 비밀번호 강도 계산
    const calculatePasswordStrength = (password) => {
      if (!password) return 0;

      // 초기 점수
      let score = 0;

      // 기본 길이 점수
      score += Math.min(password.length * 4, 40); // 최대 40점 (10자 이상)

      // 대소문자, 숫자, 특수문자에 따른 추가 점수
      const hasLowerCase = /[a-z]/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^a-zA-Z0-9]/.test(password);

      if (hasLowerCase) score += 10;
      if (hasUpperCase) score += 10;
      if (hasNumber) score += 10;
      if (hasSpecial) score += 15;

      // 문자 조합에 따른 추가 점수
      let typesCount = 0;
      if (hasLowerCase) typesCount++;
      if (hasUpperCase) typesCount++;
      if (hasNumber) typesCount++;
      if (hasSpecial) typesCount++;

      // 2가지 이상 조합 시 추가 보너스
      if (typesCount >= 2) score += (typesCount - 1) * 5;

      // 3가지 이상 조합 시 추가 보너스
      if (typesCount >= 3) score += 5;

      // 점수 제한
      return Math.max(0, Math.min(100, score));
    };

    // 비밀번호 강도 퍼센트
    const strengthPercentage = computed(() => {
      return calculatePasswordStrength(passwordModel.value);
    });

    // 비밀번호 강도 클래스
    const strengthClass = computed(() => {
      const score = strengthPercentage.value;
      if (score >= 80) return "strong";
      if (score >= 40) return "medium";
      return "weak";
    });

    // 비밀번호 강도 텍스트
    const strengthText = computed(() => {
      const score = strengthPercentage.value;
      if (score >= 80) return "강함";
      if (score >= 40) return "보통";
      return "약함";
    });

    return {
      passwordModel,
      showPassword,
      errorMessage,
      touched,
      isValid,
      strengthPercentage,
      strengthClass,
      strengthText,
      validatePassword,
      togglePasswordVisibility,
      touchField,
    };
  },
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.password-input-wrapper {
  width: 100%;
  margin-bottom: $spacing-md;
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

.required-mark {
  color: $error-color;
  margin-left: 2px;
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
</style>
