<template>
  <div class="min-h-[calc(100vh-48px)] flex items-center justify-center bg-white">
    <div class="transform -translate-y-10 w-full max-w-md p-6">
      <h2 class="text-2xl font-semibold text-center text-gray-800 mb-6">
        Wanna enjoy your trip?
      </h2>

      <!-- 아이디 입력 -->
      <div class="relative mb-0">
        <input
          v-model="username"
          type="text"
          id="username"
          ref="usernameInput"
          @focus="isUsernameFocused = true"
          @blur="isUsernameFocused = false"
          @keyup.enter="showPasswordField"
          :class="[
            'peer w-full pt-6 pb-2 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
            showPassword ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'
          ]"
          autocomplete="username"
        />
        <label
          :class="[
            'absolute left-4 text-gray-500 transition-all duration-200 pointer-events-none',
            username || isUsernameFocused
              ? 'text-xs top-1 text-blue-500'
              : 'text-base top-3.5'
          ]"
        >
          아이디
        </label>

        <button
          v-if="!showPassword"
          @click="showPasswordField"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
        >
          ➡
        </button>
      </div>

      <!-- 비밀번호 입력 -->
      <transition name="fade">
        <div v-if="showPassword" class="relative mt-0">
          <input
            v-model="password"
            type="password"
            id="password"
            ref="passwordInput"
            @focus="isPasswordFocused = true"
            @blur="isPasswordFocused = false"
            @keyup.enter="login"
            class="peer w-full pt-6 pb-2 px-4 border border-gray-300 border-t-0 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            autocomplete="current-password"
          />
          <label
            :class="[
              'absolute left-4 text-gray-500 transition-all duration-200 pointer-events-none',
              password || isPasswordFocused
                ? 'text-xs top-1 text-blue-500'
                : 'text-base top-3.5'
            ]"
          >
            비밀번호
          </label>
          <button
            @click="login"
            class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
          >
            ➡
          </button>
        </div>
      </transition>

      <p v-if="message" class="text-center text-red-500 mt-4">{{ message }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import TokenService from '../services/token.service'; // TokenService import

export default {
  data() {
    return {
      username: '',
      password: '',
      message: '',
      showPassword: false,
      isUsernameFocused: false,
      isPasswordFocused: false,
    };
  },
  methods: {
    showPasswordField() {
      if (this.username.trim()) {
        this.showPassword = true;
        this.$nextTick(() => {
          this.$refs.passwordInput.focus();
        });
      }
    },
    async login() {
  try {
    const res = await axios.post('/login', {
      username: this.username,
      password: this.password,
    });

    // 로그인 성공 시 JWT 토큰 저장
    const token = res.headers.authorization;
    if (token) {
      // 'Bearer '를 제외한 토큰만 저장
      const accessToken = token.split(" ")[1]; // Bearer 뒤의 토큰만 추출
      TokenService.saveLoginData({ accessToken }); // 토큰 저장
      this.$store.commit('login', accessToken);
      this.$router.push({ name: 'home' });
    } else {
      this.message = '로그인에 실패했습니다. 다시 시도해주세요.';
    }
  } catch (err) {
    console.error("로그인 중 오류 발생:", err);
    this.message = '로그인 실패';
  }
},
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
