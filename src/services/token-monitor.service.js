// @/services/token-monitor.service.js

import TokenService from "@/services/token.service";
import AuthService from "@/services/auth.service";
import apiClient from "@/services/api.service";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

/**
 * 토큰 모니터링 서비스
 * - 백그라운드에서 토큰 상태를 모니터링하고 자동으로 갱신합니다.
 * - App.vue에서 초기화하여 앱 전체에서 토큰 상태를 관리합니다.
 */
class TokenMonitorService {
  constructor() {
    this.refreshTimerId = null;
    this.checkInterval = 1000;
    this.refreshThreshold = 3;
    this.isInitialized = false;
    this._isRefreshing = false;
  }

  /**
   * 토큰 모니터링 시작
   */
  startMonitoring() {
    if (this.isInitialized) return;

    this.isInitialized = true;

    // 첫 실행 - 현재 토큰 상태 확인
    this.checkTokenStatus();

    // 정기적으로 토큰 상태 확인 설정
    this.refreshTimerId = setInterval(() => {
      this.checkTokenStatus();

      // 토큰 정보 콘솔에 출력
      this.logTokenInfo();
    }, this.checkInterval);

    // 앱이 포커스를 받을 때(탭 전환 등) 토큰 상태 확인
    window.addEventListener("focus", this.checkTokenStatus.bind(this));

    console.log("토큰 모니터링 서비스 시작됨");
  }

  /**
   * 토큰 모니터링 중지
   */
  stopMonitoring() {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    window.removeEventListener("focus", this.checkTokenStatus.bind(this));
    this.isInitialized = false;

    console.log("토큰 모니터링 서비스 중지됨");
  }

  /**
   * 토큰 상태 확인 및 필요시 갱신
   */
  async checkTokenStatus() {
    // 로그인 상태가 아니면 모니터링 불필요
    if (!AuthService.isLoggedIn()) return;

    const remainingTime = AuthService.getTokenRemainingTime();

    // 토큰이 아직 유효하고 만료 임계값보다 많이 남았으면 아무것도 하지 않음
    if (remainingTime && remainingTime > this.refreshThreshold) {
      return;
    }

    try {
      // 토큰 갱신 시도
      await this.refreshToken();
    } catch (error) {
      console.error("자동 토큰 갱신 실패:", error);

      // 리프레시에 실패하면 사용자 로그아웃 처리
      if (remainingTime <= 0) {
        const authStore = useAuthStore();
        const notificationStore = useNotificationStore();

        // 세션 만료 알림
        notificationStore.showWarning(
          "로그인 세션이 만료되었습니다. 다시 로그인해주세요."
        );

        // 로그아웃 처리
        authStore.logout();
      }
    }
  }

  /**
   * 토큰 정보를 콘솔에 출력하는 메서드
   */
  logTokenInfo() {
    // 로그인 상태가 아니면 출력하지 않음
    if (!AuthService.isLoggedIn()) return;

    // TokenService의 메서드를 사용하여 토큰 정보 가져오기
    const expiration = TokenService.getTokenExpiration();
    const remainingTime = TokenService.getTokenRemainingTime();

    // 콘솔에 토큰 정보 출력
    //console.log(`토큰 만료 시간: ${expiration}`);
    //console.log(`토큰 남은 시간: ${remainingTime}초`);
  }

  /**
   * 토큰 리프레시 수행
   * 리프레시 토큰을 이용해 새 액세스 토큰 발급
   */
  async refreshToken() {
    // 중복 요청 방지
    if (this._isRefreshing) return;

    this._isRefreshing = true;

    try {
      const refreshToken = TokenService.getRefreshToken();

      if (!refreshToken) {
        throw new Error("리프레시 토큰이 없습니다.");
      }

      console.log("백그라운드 토큰 리프레시 시도 중...");

      // 리프레시 토큰으로 새 액세스 토큰 요청
      // 기존의 api.service.js의 refreshAccessToken 함수와 유사하게 구현
      const response = await apiClient.post(
        "/auth/token/refresh",
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
          _isRefreshRequest: true, // 인터셉터에서 이 요청을 특별히 처리하도록 플래그 설정
        }
      );

      // 응답 헤더에서 새 액세스 토큰 추출
      const newAccessToken = response.headers["authorization"];

      if (!newAccessToken) {
        throw new Error("응답에 새 액세스 토큰이 없습니다.");
      }

      // Bearer 접두사 제거
      const tokenValue = newAccessToken.startsWith("Bearer ")
        ? newAccessToken.slice(7)
        : newAccessToken;

      // 새 액세스 토큰 저장
      TokenService.setToken(tokenValue);

      console.log("백그라운드 토큰 리프레시 성공");

      // 새 리프레시 토큰이 있다면 갱신
      const newRefreshToken = response.headers["refresh-token"];
      if (newRefreshToken) {
        TokenService.setRefreshToken(newRefreshToken);
      }

      return tokenValue;
    } catch (error) {
      console.error("백그라운드 토큰 리프레시 실패:", error);
      throw error;
    } finally {
      this._isRefreshing = false;
    }
  }
}

export default new TokenMonitorService();
