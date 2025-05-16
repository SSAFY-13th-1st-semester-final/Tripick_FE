<template>
  <form @submit.prevent="signup" class="w-full max-w-lg mx-auto">
    <!-- 이름 -->
    <div class="mb-6">
      <FormInput
        label="이름"
        v-model="form.nickname"
        field="nickname"
        :focused="focused"
        @focus="setFocus"
      />
    </div>

    <!-- 아이디 -->
    <div class="mb-1">
      <FormInput
        label="아이디"
        v-model="form.username"
        field="username"
        :focused="focused"
        @focus="setFocus"
        @blur="checkUsernameDuplicate"
      />

      <!-- 아이디 중복 검사 메시지 -->
      <p
        v-if="usernameCheckMessage"
        :class="[
          'mt-1 text-sm flex justify-end',
          isUsernameAvailable ? 'text-green-600' : 'text-red-600',
        ]"
      >
        {{ usernameCheckMessage }}
      </p>
    </div>

    <!-- 비밀번호 -->
    <div class="mt-6 mb-1">
      <FormInput
        label="비밀번호"
        type="password"
        v-model="form.password"
        field="password"
        :focused="focused"
        @focus="setFocus"
      />

      <!-- 비밀번호 유효성 메시지 -->
      <p
        v-if="form.password && !isPasswordValid"
        class="mt-1 text-sm text-red-600"
      >
        비밀번호는 영문자와 숫자를 포함한 8자리 이상이어야 합니다.
      </p>
    </div>

    <!-- 비밀번호 재입력 -->
    <div class="mt-6 mb-1">
      <FormInput
        label="비밀번호 재입력"
        type="password"
        v-model="form.passwordConfirm"
        field="passwordConfirm"
        :focused="focused"
        @focus="setFocus"
      />

      <!-- 비밀번호 일치 메시지 -->
      <p
        v-if="form.passwordConfirm && form.password !== form.passwordConfirm"
        class="mt-1 text-sm text-red-600"
      >
        비밀번호가 일치하지 않습니다.
      </p>
    </div>

    <!-- 이메일 -->
    <div class="mt-6 mb-3">
      <FormInput
        label="이메일"
        type="email"
        v-model="form.email"
        field="email"
        :focused="focused"
        @focus="setFocus"
      />
    </div>

    <!-- 전화번호 -->
    <div class="mb-6">
      <label class="block text-left text-sm text-gray-600">전화번호</label>
      <div class="flex space-x-2">
        <input
          v-model="form.phone1"
          maxlength="3"
          inputmode="numeric"
          placeholder="000"
          class="w-1/3 text-center py-2 px-3 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="form.phone2"
          maxlength="4"
          inputmode="numeric"
          placeholder="0000"
          class="w-1/3 text-center py-2 px-3 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="form.phone3"
          maxlength="4"
          inputmode="numeric"
          placeholder="0000"
          class="w-1/3 text-center py-2 px-3 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <hr class="mb-6" />

    <!-- 개인정보 처리방침 동의 -->
    <div class="flex items-start space-x-2 mb-6">
      <input
        type="checkbox"
        id="isPolicyAgreed"
        v-model="form.isPolicyAgreed"
        class="w-4 h-4 border border-gray-400 rounded mt-1"
      />
      <label for="isPolicyAgreed" class="text-sm text-left">
        <a
          href="/privacy-policy"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          SSAFY의 개인정보 처리방침
        </a>
        에 따라 개인정보 수집 및 처리에 동의합니다.
      </label>
    </div>

    <hr class="mb-6" />

    <!-- 제출 버튼 -->
    <button
      type="submit"
      :class="[
        'w-full p-3 text-sm text-white font-semibold rounded-xl transition-colors duration-300',
        isFormValid ? 'bg-blue-500 hover:bg-blue-700' : 'bg-blue-300',
      ]"
      :disabled="!isFormValid"
    >
      계속
    </button>

    <p v-if="message" class="mt-4 text-sm text-red-500">{{ message }}</p>
  </form>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import { useRouter } from "vue-router";
import FormInput from "@/components/common/FormInput.vue";

const router = useRouter();
const store = useStore();

const form = reactive({
  nickname: "",
  username: "",
  password: "",
  passwordConfirm: "",
  email: "",
  phone1: "",
  phone2: "",
  phone3: "",
  isPolicyAgreed: false,
});

const focused = ref("");
const message = ref("");

const usernameCheckMessage = ref("");
const isUsernameAvailable = ref(false);

// 비밀번호 정규식
const passwordReg = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,25}$/;

const setFocus = (field) => {
  focused.value = field;
};

// 아이디 중복 검사
const checkUsernameDuplicate = async () => {
  usernameCheckMessage.value = "";
  isUsernameAvailable.value = false;

  if (!form.username) return;

  try {
    const res = await axios.get("/v1/member/check", {
      params: { username: form.username },
    });

    if (res.status === 200) {
      usernameCheckMessage.value = "사용 가능한 아이디입니다.";
      isUsernameAvailable.value = true;
    }
  } catch (err) {
    if (err.response?.status === 409) {
      usernameCheckMessage.value = "이미 사용중인 아이디입니다.";
      isUsernameAvailable.value = false;
    } else {
      usernameCheckMessage.value = "아이디 중복 검사 중 오류가 발생했습니다.";
      isUsernameAvailable.value = false;
    }
  }
};

// 비밀번호 유효성 검사
const isPasswordValid = computed(() => passwordReg.test(form.password));

// 폼 유효성 검사
const isFormValid = computed(() => {
  const filled =
    form.nickname &&
    form.username &&
    form.email &&
    form.phone1 &&
    form.phone2 &&
    form.phone3;

  const passwordsMatch = form.password === form.passwordConfirm;
  const passwordOk = isPasswordValid.value;
  const usernameOk = isUsernameAvailable.value;

  return (
    filled && passwordsMatch && passwordOk && form.isPolicyAgreed && usernameOk
  );
});

// 회원가입 처리
const signup = async () => {
  try {
    const phone = `${form.phone1}-${form.phone2}-${form.phone3}`;
    const response = await axios.post("/v1/member", {
      username: form.username,
      password: form.password,
      email: form.email,
      nickname: form.nickname,
      phoneNumber: phone,
      isPolicyAgreed: form.isPolicyAgreed,
    });

    if (response.status === 201) {
      $store.dispatch("notification/notify", `${form.nickname}님, 환영합니다.`);
      router.push("/login");
    } else {
      $store.dispatch("notification/notify", "회원가입에 실패했습니다.");
    }
  } catch (err) {
    $store.dispatch(
      "notification/notify",
      "회원가입 처리 중 오류가 발생했습니다."
    );
  }
};
</script>
