// @/services/token-monitor.service.js

import TokenService from "@/services/token.service";
import AuthService from "@/services/auth.service";
import ApiService from "@/services/api.service";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

/**
 * 토큰 모니터링 서비스
 * - 백그라운드에서 토큰 상태를 모니터링합니다.
 * - api.service.js의 자동 토큰 리프레시 기능을 활용합니다.
 * - App.vue에서 초기화하여 앱 전체에서 토큰 상태를 관리합니다.
 */
class TokenMonitorService {
  constructor() {
    this.monitorTimerId = null;
    this.checkInterval = 30000; // 30초마다 체크
    this.refreshThreshold = 120; // 14분 전 리프레시 (테스트용)
    this.warningThreshold = 300; // 5분 전 경고
    this.criticalThreshold = 60; // 1분 전 긴급 알림
    this.isInitialized = false;
    this.hasShownWarning = false;
    this.hasShownCritical = false;
    this.hasTriggeredRefresh = false;
  }

  /**
   * 토큰 모니터링 시작
   */
  startMonitoring() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.checkTokenStatus();

    this.monitorTimerId = setInterval(() => {
      this.checkTokenStatus();
    }, this.checkInterval);

    this.bindWindowEvents();

    const notificationStore = useNotificationStore();
    notificationStore.showInfo("🔍 토큰 모니터링 서비스 시작");
  }

  /**
   * 토큰 모니터링 중지
   */
  stopMonitoring() {
    if (this.monitorTimerId) {
      clearInterval(this.monitorTimerId);
      this.monitorTimerId = null;
    }

    this.unbindWindowEvents();
    this.isInitialized = false;
    this.resetWarningFlags();

    const notificationStore = useNotificationStore();
    notificationStore.showInfo("🛑 토큰 모니터링 서비스 중지");
  }

  /**
   * 토큰 상태 확인 및 사용자 알림
   */
  async checkTokenStatus() {
    try {
      if (!AuthService.isLoggedIn()) {
        this.resetWarningFlags();
        return;
      }

      const remainingTime = this.getTokenRemainingTime();

      if (remainingTime <= 0) {
        await this.handleTokenExpired();
        return;
      }

      this.handleUserNotifications(remainingTime);

      // 14분 전 리프레시 트리거
      if (
        remainingTime <= this.refreshThreshold &&
        remainingTime > 0 &&
        !this.hasTriggeredRefresh
      ) {
        await this.triggerTokenRefresh();
        this.hasTriggeredRefresh = true;
      }

      // 1분 전 긴급 리프레시
      if (
        remainingTime <= this.criticalThreshold &&
        remainingTime > 0 &&
        !this.hasTriggeredRefresh
      ) {
        await this.triggerTokenRefresh();
        this.hasTriggeredRefresh = true;
      }
    } catch (error) {
      // 에러 발생 시 조용히 처리
    }
  }

  /**
   * 토큰 만료 처리
   */
  async handleTokenExpired() {
    try {
      await this.triggerTokenRefresh();
    } catch (error) {
      const authStore = useAuthStore();
      const notificationStore = useNotificationStore();

      // 재로그인 요청 알림
      notificationStore.showError(
        "❌ 로그인 세션이 만료되었습니다. 다시 로그인해주세요."
      );

      authStore.logout();
    }
  }

  /**
   * 사용자 알림 처리 (중요한 알림만)
   */
  handleUserNotifications(remainingTime) {
    const notificationStore = useNotificationStore();

    // 1분 전 긴급 알림만
    if (remainingTime <= this.criticalThreshold && !this.hasShownCritical) {
      notificationStore.showWarning(
        `⚠️ 로그인이 ${Math.ceil(
          remainingTime / 60
        )}분 후 만료됩니다. 작업을 저장해주세요.`
      );
      this.hasShownCritical = true;
    }

    // 알림 플래그 리셋 (토큰이 새로고침되어 시간이 늘어난 경우)
    if (remainingTime > this.refreshThreshold) {
      this.resetWarningFlags();
    }
  }

  /**
   * 토큰 리프레시 직접 호출
   */
  async triggerTokenRefresh() {
    try {
      const newToken = await ApiService.refreshToken();

      // 갱신 성공 알림만
      const notificationStore = useNotificationStore();
      notificationStore.showSuccess("✅ 로그인이 자동으로 연장되었습니다.");

      // 플래그 리셋 (1분 후)
      setTimeout(() => {
        this.hasTriggeredRefresh = false;
      }, 60000);

      return newToken;
    } catch (error) {
      this.hasTriggeredRefresh = false;
      throw error;
    }
  }

  /**
   * 토큰 남은 시간 계산 (초 단위)
   */
  getTokenRemainingTime() {
    try {
      const expiration = TokenService.getTokenExpiration();
      if (!expiration) return 0;

      const now = Math.floor(Date.now() / 1000);
      const remainingTime = expiration - now;

      return Math.max(0, remainingTime);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 경고 플래그 리셋
   */
  resetWarningFlags() {
    this.hasShownWarning = false;
    this.hasShownCritical = false;
    this.hasTriggeredRefresh = false;
  }

  /**
   * 윈도우 이벤트 바인딩
   */
  bindWindowEvents() {
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);

    window.addEventListener("focus", this.handleWindowFocus);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  /**
   * 윈도우 이벤트 언바인딩
   */
  unbindWindowEvents() {
    window.removeEventListener("focus", this.handleWindowFocus);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  }

  /**
   * 윈도우 포커스 이벤트 핸들러
   */
  handleWindowFocus() {
    this.checkTokenStatus();
  }

  /**
   * 페이지 언로드 이벤트 핸들러
   */
  handleBeforeUnload() {
    this.stopMonitoring();
  }

  /**
   * 수동 토큰 상태 확인
   */
  async forceCheck() {
    await this.checkTokenStatus();
  }

  /**
   * 모니터링 간격 설정
   */
  setCheckInterval(interval) {
    if (interval < 5000) {
      interval = 5000;
    }

    this.checkInterval = interval;

    if (this.isInitialized) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * 리프레시 임계값 설정 (테스트용)
   */
  setRefreshThreshold(seconds) {
    this.refreshThreshold = seconds;
    this.hasTriggeredRefresh = false;
  }

  /**
   * 경고 임계값 설정
   */
  setWarningThreshold(warning, critical) {
    this.warningThreshold = warning || this.warningThreshold;
    this.criticalThreshold = critical || this.criticalThreshold;
  }

  /**
   * 현재 모니터링 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      checkInterval: this.checkInterval,
      refreshThreshold: this.refreshThreshold,
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
      hasShownWarning: this.hasShownWarning,
      hasShownCritical: this.hasShownCritical,
      hasTriggeredRefresh: this.hasTriggeredRefresh,
      remainingTime: this.getTokenRemainingTime(),
    };
  }
}

// 싱글톤 인스턴스 export
export default new TokenMonitorService();
