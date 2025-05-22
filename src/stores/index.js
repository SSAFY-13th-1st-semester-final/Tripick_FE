import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

/**
 * Pinia 스토어 설정
 * pinia-plugin-persistedstate 플러그인을 포함
 */
export const pinia = createPinia();

// pinia-plugin-persistedstate 플러그인 등록
pinia.use(piniaPluginPersistedstate);

// 개발 환경에서 디버깅 정보 표시
if (import.meta.env.DEV) {
  console.log('🏪 Pinia store initialized with persistedstate plugin');
}

export default pinia;