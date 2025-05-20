<template>
  <div class="login-form">
    <h2 class="login-form__title">로그인</h2>

    <form @submit.prevent="submitForm" class="login-form__form">
      <AppInput
        v-model="formData.username"
        label="아이디"
        placeholder="아이디를 입력하세요"
        :invalid="!!errors.username"
        :error-message="errors.username"
        required
        autocomplete="username"
      />

      <AppInput
        v-model="formData.password"
        label="비밀번호"
        type="password"
        placeholder="비밀번호를 입력하세요"
        :invalid="!!errors.password"
        :error-message="errors.password"
        required
        autocomplete="current-password"
      />

      <div class="login-form__remember-me">
        <label class="remember-me-label">
          <input
            type="checkbox"
            v-model="rememberMe"
            class="remember-me-checkbox"
          />
          <span class="remember-me-text">로그인 상태 유지</span>
        </label>
      </div>

      <div class="login-form__help-links">
        <router-link to="/auth/forgot-username" class="login-form__help-link"
          >아이디를 잊으셨나요?</router-link
        >
        <span class="login-form__divider">|</span>
        <router-link to="/auth/forgot-password" class="login-form__help-link"
          >비밀번호를 잊으셨나요?</router-link
        >
      </div>

      <div class="login-form__actions">
        <AppButton
          type="submit"
          variant="primary"
          size="lg"
          block
          :loading="isLoading"
        >
          로그인
        </AppButton>
      </div>

      <div class="login-form__signup-link">
        계정이 없으신가요? <router-link to="/auth/signup">회원가입</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import AppInput from "@/components/common/shared/AppInput.vue";
import AppButton from "@/components/common/shared/AppButton.vue";
import { isRequired } from "@/utils/validators";

// 라우터와 Pinia 스토어 사용
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 폼 데이터 정의
const formData = reactive({
  username: "",
  password: "",
});

// 로그인 상태 유지 체크박스
const rememberMe = ref(authStore.isRememberMeChecked || false);

// 추가 상태 변수
const errors = reactive({});
const isLoading = ref(false);

// 인증 오류 메시지 가져오기
const authError = computed(() => authStore.authError);

// 폼 유효성 검사
const validateForm = () => {
  const newErrors = {};

  // 필수 필드 확인
  if (!isRequired(formData.username)) {
    newErrors.username = "아이디를 입력해주세요.";
  }

  if (!isRequired(formData.password)) {
    newErrors.password = "비밀번호를 입력해주세요.";
  }

  // 오류 객체 업데이트
  Object.keys(errors).forEach((key) => {
    delete errors[key];
  });

  Object.keys(newErrors).forEach((key) => {
    errors[key] = newErrors[key];
  });

  return Object.keys(newErrors).length === 0;
};

// 폼 제출 처리
const submitForm = async () => {
  try {
    // authStore.clearError가 정의되지 않은 경우를 대비한 안전한 처리
    if (typeof authStore.clearError === "function") {
      authStore.clearError();
    } else {
      // 직접 오류 상태 초기화
      authStore.authError = null;
      authStore.registerError = null;
    }
  } catch (e) {
    console.warn("오류 초기화 중 문제 발생:", e);
  }

  // 유효성 검사
  if (!validateForm()) {
    return;
  }

  // 로딩 상태 설정
  isLoading.value = true;

  try {
    console.log(rememberMe);
    // Pinia 스토어를 통한 로그인 요청 (Remember Me 상태 포함)
    await authStore.login({ ...formData }, rememberMe);

    // 로그인 성공 알림 표시
    notificationStore.showSuccess("로그인에 성공했습니다. 환영합니다!", {
      duration: 3000,
    });

    // 리다이렉트 경로가 있는 경우 해당 경로로 이동, 없으면 홈으로 이동
    const redirectPath = route.query.redirect || { name: "home" };
    router.push(redirectPath);
  } catch (error) {
    // 로그인 오류 알림 표시
    if (authStore.authError) {
      notificationStore.showError(authStore.authError, {
        duration: 5000, // 오류 메시지는 더 오래 표시
      });
    } else {
      notificationStore.showError("로그인에 실패했습니다. 다시 시도해주세요.", {
        duration: 5000,
      });
    }

    console.error("로그인 오류:", error);
  } finally {
    // 로딩 상태 해제
    isLoading.value = false;
  }
};

// 컴포넌트 마운트 시 상태 초기화
onMounted(() => {
  try {
    // 안전한 오류 초기화
    if (typeof authStore.clearError === "function") {
      authStore.clearError();
    } else {
      // 직접 오류 상태 초기화
      authStore.authError = null;
      authStore.registerError = null;
    }

    // Remember Me 상태 초기화
    if (typeof authStore.isRememberMeChecked !== "undefined") {
      rememberMe.value = authStore.isRememberMeChecked;
    }

    // 쿼리 파라미터 확인
    if (route.query.registered === "true") {
      // 회원가입 후 리다이렉트된 경우 환영 메시지 표시
      notificationStore.showSuccess(
        "회원가입이 완료되었습니다. 로그인해주세요.",
        {
          duration: 4000,
        }
      );
    } else if (route.query.logout === "true") {
      // 로그아웃 후 리다이렉트된 경우 메시지 표시
      notificationStore.showInfo("성공적으로 로그아웃되었습니다.", {
        duration: 3000,
      });
    } else if (route.query.sessionExpired === "true") {
      // 세션 만료로 리다이렉트된 경우 경고 메시지 표시
      notificationStore.showWarning(
        "세션이 만료되었습니다. 다시 로그인해주세요.",
        {
          duration: 5000,
        }
      );
    }
  } catch (e) {
    console.warn("마운트 시 오류 초기화 중 문제 발생:", e);
  }
});
</script>

<style lang="scss" scoped>
.login-form {
  width: 100%;

  &__title {
    text-align: center;
    margin-bottom: $spacing-xl;
    color: $primary-color;
  }

  &__form {
    width: 100%;
  }

  &__remember-me {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-md;

    .remember-me-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.875rem;
      user-select: none;
      color: $primary-color;
    }

    .remember-me-checkbox {
      appearance: none;
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border: 1.5px solid $dark-gray;
      border-radius: 4px;
      margin-right: $spacing-xs;
      position: relative;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(5px);
      transition: all $transition-fast;

      &:checked {
        background-color: $accent-color;
        border-color: $accent-color;

        &::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 6px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }

      &:hover {
        border-color: $accent-color;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba($accent-color, 0.3);
      }
    }

    .remember-me-text {
      margin-left: $spacing-xs;
    }
  }

  &__help-links {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: $spacing-md;
    font-size: 0.875rem;
  }

  &__help-link {
    color: $primary-color;
    text-decoration: none;

    &:hover {
      color: $accent-color;
      text-decoration: underline;
    }
  }

  &__divider {
    margin: 0 $spacing-xs;
    color: $dark-gray;
  }

  &__actions {
    margin-top: $spacing-lg;
    margin-bottom: $spacing-md;
  }

  &__signup-link {
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
