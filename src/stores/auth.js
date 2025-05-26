import { defineStore } from "pinia";
import AuthService from "@/services/auth.service";
import TokenService from "@/services/token.service";
import router from "@/router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: AuthService.getStoredUser(),
    isAuthenticated: AuthService.isLoggedIn(),
    rememberMeChecked: localStorage.getItem("rememberMe") === "true",
    authError: null,
    registerError: null,
    loading: false,
  }),

  getters: {
    currentUser: (state) => state.user,
    isAdmin: (state) => state.user && state.user.role === "ADMIN",
    hasAuthError: (state) => !!state.authError,
    hasRegisterError: (state) => !!state.registerError,
  },

  actions: {
    /**
     * 오류 메시지 초기화
     */
    clearError() {
      this.authError = null;
      this.registerError = null;
    },

    /**
     * Remember Me 상태 설정
     * @param {boolean} value - 체크 상태
     */
    setRememberMe(value) {
      this.rememberMeChecked = value;
      localStorage.setItem("rememberMe", value);
    },

    /**
     * RememberMe 체크 상태 토글
     */
    toggleRememberMe() {
      this.setRememberMe(!this.rememberMeChecked);
    },

    /**
     * 사용자 로그인 처리
     * @param {Object} credentials - 로그인 정보
     * @param {boolean} [rememberMe] - 로그인 상태 기억 여부
     */
    async login(credentials, rememberMe) {
      this.authError = null;
      this.loading = true;

      try {
        const response = await AuthService.login(credentials, rememberMe);

        // 로그인 성공 후 사용자 정보 설정 (이미 서버에서 조회된 정보 포함)
        this.user = AuthService.getStoredUser();
        this.isAuthenticated = true;

        return response;
      } catch (error) {
        // 에러 메시지 설정
        if (error.response && error.response.data) {
          this.authError =
            error.response.data.message || "로그인에 실패했습니다.";
        } else {
          this.authError =
            "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.";
        }

        this.isAuthenticated = false;
        this.user = null;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 사용자 회원가입 처리
     * @param {Object} userData - 회원가입 정보
     */
    async register(userData) {
      this.registerError = null;
      this.loading = true;

      try {
        const response = await AuthService.register(userData);

        // 회원가입 성공 시 로그인 페이지로 이동
        router.push({ name: "login", query: { registered: "true" } });

        return response;
      } catch (error) {
        // 에러 메시지 설정
        if (error.response && error.response.data) {
          this.registerError =
            error.response.data.message || "회원가입에 실패했습니다.";
        } else {
          this.registerError =
            "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.";
        }

        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 사용자 로그아웃 처리
     */
    async logout() {
      this.loading = true;

      try {
        await AuthService.logout();
      } catch (error) {
        // 로그아웃 실패시에도 로컬 상태 정리는 수행
      } finally {
        // 상태 초기화
        this.user = null;
        this.isAuthenticated = false;
        this.loading = false;

        // 홈 페이지로 이동
        router.push("/");
      }
    },

    /**
     * 사용자 정보 갱신 (프로필 수정 후 등에 사용)
     */
    async refreshUserData() {
      if (!this.isAuthenticated) return;

      try {
        const response = await AuthService.getCurrentUser();

        if (response.data && response.data.data) {
          // 기존 저장된 사용자 정보 가져오기
          const rememberMe = localStorage.getItem("rememberMe") === "true";
          const storage = rememberMe ? localStorage : sessionStorage;
          const existingUserStr = storage.getItem("user");

          let existingUser = {};
          if (existingUserStr) {
            try {
              existingUser = JSON.parse(existingUserStr);
            } catch (e) {
              console.error("JSON 파싱 오류:", e);
            }
          }

          // 새 데이터 병합 (서버 데이터가 우선)
          const updatedUser = {
            ...existingUser, // 기존 토큰 정보 등 유지
            ...response.data.data, // 서버에서 가져온 최신 정보가 우선 적용됨
          };

          // 업데이트된 정보 저장
          storage.setItem("user", JSON.stringify(updatedUser));

          // 스토어 상태 업데이트
          this.user = updatedUser;
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // 인증 만료, 로그아웃 처리
          this.user = null;
          this.isAuthenticated = false;
          AuthService.clearAuthData();
        }
      }
    },

    /**
     * 초기 인증 상태 복원
     */
    initAuth() {
      const token = TokenService.getToken();
      const user = AuthService.getStoredUser();

      if (token && user && TokenService.isTokenValid()) {
        this.isAuthenticated = true;
        this.user = user;

        // 토큰이 유효하고 저장된 사용자 정보가 기본 정보만 있는 경우에만 갱신
        // (id, role, tokenExpires만 있고 다른 상세 정보가 없는 경우)
        const hasDetailedInfo = user.email || user.username || user.name;
        if (!hasDetailedInfo) {
          this.refreshUserData();
        }
      } else {
        this.isAuthenticated = false;
        this.user = null;

        // 토큰이 만료되었거나 유효하지 않은 경우 정리
        if (token && !TokenService.isTokenValid()) {
          AuthService.clearAuthData();
        }
      }
    },
  },
});
