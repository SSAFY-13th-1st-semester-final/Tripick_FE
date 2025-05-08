<template>
  <div class="flex flex-col items-center justify-start min-h-screen pt-12 p-6 text-center font-apple-sdgothic">
    <h1 class="text-3xl font-bold mb-4">SSAFY 계정 생성</h1>

    <div class="text-ms mb-6">
      SSAFY 계정을 가지고 계십니까?
      <router-link
        to="/login"
        class="text-ms inline-flex items-center text-blue-500 hover:underline ml-1"
      >
        <span>로그인</span>
        <ArrowUpRight class="w-4 h-4 ml-1" />
      </router-link>
    </div>

    <form @submit.prevent="signup" class="w-full max-w-lg">
      <!-- 성 + 이름 -->
      <div class="flex space-x-2 mb-4">
        <div class="relative w-1/2">
          <input
            v-model="form.lastName"
            @focus="focused = 'lastName'"
            @blur="focused = ''"
            class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label
            :class="[
              'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
              form.lastName || focused === 'lastName'
                ? 'text-xs top-1 text-blue-800'
                : 'top-3.5'
            ]"
          >성</label>
        </div>

        <div class="relative w-1/2">
          <input
            v-model="form.firstName"
            @focus="focused = 'firstName'"
            @blur="focused = ''"
            class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label
            :class="[
              'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
              form.firstName || focused === 'firstName'
                ? 'text-xs top-1 text-blue-800'
                : 'top-3.5'
            ]"
          >이름</label>
        </div>
      </div>

      <!-- 아이디 -->
      <div class="relative mb-4">
        <input
          v-model="form.username"
          @focus="focused = 'username'"
          @blur="focused = ''"
          class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label
          :class="[
            'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
            form.username || focused === 'username'
              ? 'text-xs top-1 text-blue-800'
              : 'top-3.5'
          ]"
        >아이디</label>
      </div>

      <!-- 비밀번호 -->
      <div class="relative mb-4">
        <input
          v-model="form.password"
          type="password"
          @focus="focused = 'password'"
          @blur="focused = ''"
          class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label
          :class="[
            'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
            form.password || focused === 'password'
              ? 'text-xs top-1 text-blue-800'
              : 'top-3.5'
          ]"
        >비밀번호</label>
      </div>

      <!-- 비밀번호 재입력 -->
      <div class="relative mb-4">
        <input
          v-model="form.passwordConfirm"
          type="password"
          @focus="focused = 'passwordConfirm'"
          @blur="focused = ''"
          class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label
          :class="[
            'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
            form.passwordConfirm || focused === 'passwordConfirm'
              ? 'text-xs top-1 text-blue-800'
              : 'top-3.5'
          ]"
        >비밀번호 재입력</label>
      </div>

      <!-- 이메일 -->
      <div class="relative mb-6">
        <input
          v-model="form.email"
          type="email"
          @focus="focused = 'email'"
          @blur="focused = ''"
          class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label
          :class="[
            'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
            form.email || focused === 'email'
              ? 'text-xs top-1 text-blue-800'
              : 'top-3.5'
          ]"
        >이메일</label>
      </div>

      <hr class="mb-6" />

      <!-- 개인정보 처리방침 동의 -->
      <div class="flex items-start space-x-2 mb-6">
        <input
          type="checkbox"
          id="agree"
          v-model="form.agree"
          class="w-4 h-4 border border-gray-400 rounded"
        />
        <label for="agree" class="text-sm text-left m-0">
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

      <button
        type="submit"
        :class="{ 'bg-blue-300': !isFormValid, 'bg-blue-500 hover:bg-blue-700': isFormValid }"
        :disabled="!isFormValid"
        class="w-full p-3 text-sm text-white font-semibold rounded-xl transition-colors duration-300"
      >
        계속
      </button>
    </form>

    <p v-if="message" class="mt-4 text-sm text-red-500">{{ message }}</p>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ArrowUpRight } from 'lucide-vue-next'

const router = useRouter()

const form = reactive({
  lastName: '',
  firstName: '',
  username: '',
  password: '',
  passwordConfirm: '',
  email: '',
  agree: false
})

const focused = ref('')
const message = ref('')

// 모든 필드 입력 확인 및 유효성 검사
const isFormValid = computed(() => {
  const requiredFilled = form.lastName && form.firstName && form.username && form.email
  const passwordMatch = form.password === form.passwordConfirm
  return requiredFilled && passwordMatch && form.agree
})

const signup = async () => {
  try {
    const fullName = `${form.lastName}${form.firstName}`
    const response = await axios.post('http://localhost:8000/signup', {
      username: form.username,
      password: form.password,
      email: form.email,
      name: fullName
    })

    if (response.status === 201) {
      router.push('/login')
    } else {
      message.value = response.data.message || '회원가입 실패'
    }
  } catch (error) {
    message.value = error.response?.data?.message || '회원가입 중 오류 발생'
  }
}
</script>
