// src/composables/useAuth.js
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import TokenService from '@/services/token.service';

export function useAuth() {
  const store = useStore();
  const router = useRouter();

  const username = ref('');
  const password = ref('');
  const showPassword = ref(false);
  const messageKey = ref(0);

  const login = async () => {
    try {
      const res = await axios.post('/v1/auth/login', {
        username: username.value,
        password: password.value,
      });

      const authHeader = res.headers.authorization;
      const refreshToken = res.headers['refresh-token'];

      if (authHeader && refreshToken) {
        const accessToken = authHeader.split(' ')[1];
        TokenService.setAccessToken(accessToken);
        TokenService.setRefreshToken(refreshToken);

        store.commit('auth/login', accessToken);
        store.dispatch('notification/notify', '환영합니다.');
        router.push({ name: 'home' });
      } else {
        store.dispatch('notification/notify', '로그인 인증 정보가 없습니다.');
      }
    } catch (err) {
      console.error('로그인 실패:', err);
      store.dispatch('notification/notify', '로그인 실패. 다시 시도하세요.');
    }
  };

  const logout = () => {
    TokenService.clear();
    store.commit('auth/logout');
    router.push({ name: 'home' });
  };

  return {
    username,
    password,
    showPassword,
    messageKey,
    login,
    logout,
  };
}
