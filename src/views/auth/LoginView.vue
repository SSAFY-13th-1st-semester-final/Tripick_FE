<template>

  <div class="min-h-[calc(100vh-98px)] flex items-center justify-center bg-white">
        <!-- Notification 컴포넌트 -->
    <!-- <Notification
      v-if="message"
      :message="message"
      :key="messageKey"
      @clear-message="clearMessage"
    /> -->
    <div class="transform -translate-y-10 w-full max-w-lg p-6">
      <h2 class="text-2xl font-semibold text-center text-gray-900 mb-6 font-apple-sdgothic">
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
            'peer w-full max-w-lg pt-6 pb-2 px-4 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
            showPassword ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'
          ]"
          autocomplete="username"
        />
        <label
          :class="[
            'absolute left-4 text-gray-500 transition-all duration-200 pointer-events-none',
            username || isUsernameFocused
              ? 'text-sm top-1 text-blue-800'
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
          <img src="@/assets/icons/send_right_arrow.png" alt="다음" class="w-5 h-5" />
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
            class="peer w-full pt-6 pb-2 px-4 border border-gray-500 border-t-0 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            autocomplete="current-password"
          />
          <label
            :class="[
              'absolute left-4 text-gray-500 transition-all duration-200 pointer-events-none',
              password || isPasswordFocused
                ? 'text-sm top-1 text-blue-800'
                : 'text-base top-3.5'
            ]"
          >
            비밀번호
          </label>
          <button
            class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
            @click="login"
          >
            <img src="@/assets/icons/send_right_arrow.png" alt="로그인" class="w-5 h-5" />
          </button>
        </div>
      </transition>

      <!-- 추가 기능 영역 -->
      <div class="mt-32 text-center space-y-3 text-sm text-gray-600">
        <div>
          <label class="inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="rememberMe" class="form-checkbox text-blue-500" />
            <span class="ml-2">계정 저장</span>
          </label>
        </div>

        <!-- 암호를 잊으셨습니까 -->
        <div>
          <router-link
            to="/forgot-password"
            class="mt-6 text-xs inline-flex items-center justify-center text-blue-500 hover:underline ml-1"
          >
            <span>암호를 잊으셨습니까?</span>
            <ArrowUpRight class="w-4 h-4 ml-1" />
          </router-link>
        </div>

        <!-- SSAFY 계정 생성 -->
        <div class="text-xs">
          SSAFY 계정이 없습니까?
          <router-link
            to="/signup"
            class="text-xs inline-flex items-center text-blue-500 hover:underline ml-1"
          >
            <span>SSAFY 계정 생성</span>
            <ArrowUpRight class="w-4 h-4 ml-1" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowUpRight } from 'lucide-vue-next';
import Notification from '@/components/alert/Notification.vue';
</script>

<script>
import axios from 'axios';
import TokenService from '@/services/token.service';

export default {

  data() {
    return {
      username: '',
      password: '',
      message: '', // 로그인 실패 메시지
      messageKey: 0, // Notification 컴포넌트의 고유 키
      showPassword: false,
      isUsernameFocused: false,
      isPasswordFocused: false,
      rememberMe: false,
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
        const res = await axios.post('/v1/auth/login', {
          username: this.username,
          password: this.password,
        });

        const authHeader = res.headers.authorization;
        const refreshToken = res.headers['refresh-token'];

        if (authHeader && refreshToken) {
          const accessToken = authHeader.split(' ')[1];

          TokenService.setAccessToken(accessToken);
          TokenService.setRefreshToken(refreshToken);

          this.$store.dispatch('notification/notify', '환영합니다.');
          this.$store.commit('auth/login', accessToken);
          this.$router.push({ name: 'home' });
        } else {
          this.$store.dispatch('notification/notify', '로그인 인증 정보 만료 (JWT)');
        }
      } catch (err) {
        console.error("로그인 중 오류 발생:", err);
        this.$store.dispatch('notification/notify', '로그인에 실패했습니다. 다시 시도하세요.');
      }
    },
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>