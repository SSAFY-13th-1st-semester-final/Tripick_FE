<template>
  <div>
    <div
      v-if="showDevPanel || showMemberList"
      class="panel-backdrop"
      @click="closeAllPanels"
    ></div>

    <div
      v-if="showDevPanel"
      class="admin-panel glass-card"
      :class="{ collapsed: isDevPanelCollapsed }"
    >
      <div class="admin-panel-header" @click="toggleDevPanel">
        <h4>🛠️ {{ isAdmin ? "관리자도구" : "토큰 관리 도구" }}</h4>
        <button class="collapse-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ 'rotate-180': isDevPanelCollapsed }"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      <div v-if="!isDevPanelCollapsed" class="admin-panel-content">
        <!-- 인증 상태 -->
        <div class="status-section">
          <h5>🔐 인증 상태</h5>
          <div class="status-item">
            <span>로그인 상태:</span>
            <span :class="{ active: isAuthenticated }">
              {{ isAuthenticated ? "로그인됨" : "로그아웃됨" }}
            </span>
          </div>
          <div v-if="isAuthenticated" class="status-item">
            <span>사용자 역할:</span>
            <span :class="{ active: isAdmin }">
              {{ currentUser?.role || "Unknown" }}
            </span>
          </div>
          <div v-if="isAuthenticated" class="status-item">
            <span>로그인상태저장:</span>
            <span>{{ authService.isLoggedIn() || "Unknown" }}</span>
          </div>
        </div>

        <!-- 토큰 모니터링 상태 -->
        <div class="status-section">
          <h5>⏱️ 토큰 모니터링</h5>
          <div class="status-item">
            <span>모니터링:</span>
            <span :class="{ active: tokenStatus.isInitialized }">
              {{ tokenStatus.isInitialized ? "활성" : "비활성" }}
            </span>
          </div>
          <div v-if="tokenStatus.isInitialized" class="status-item">
            <span>토큰 남은 시간:</span>
            <span :class="getTimeStatusClass(tokenStatus.remainingTime)">
              {{ formatTime(tokenStatus.remainingTime) }}
            </span>
          </div>
        </div>

        <!-- API 상태 -->
        <div class="status-section">
          <h5>🌐 API 상태</h5>
          <div class="status-item">
            <span>리프레시 상태:</span>
            <span :class="{ warning: apiStatus.isRefreshing }">
              {{ apiStatus.isRefreshing ? "리프레시 중" : "정상" }}
            </span>
          </div>
          <div class="status-item">
            <span>대기 요청:</span>
            <span>{{ apiStatus.subscribersCount || 0 }}개</span>
          </div>
        </div>

        <!-- 관리자 전용 회원 관리 섹션 -->
        <div v-if="isAdmin" class="status-section">
          <h5>👥 회원 관리</h5>
          <div class="status-item">
            <span>회원 목록:</span>
            <span :class="{ active: showMemberList }">
              {{ showMemberList ? "열림" : "닫힘" }}
            </span>
          </div>
        </div>

        <!-- 컨트롤 버튼들 -->
        <div class="admin-controls">
          <button
            @click="forceTokenCheck"
            class="glass-btn"
            :disabled="!isAuthenticated"
          >
            로그인 연장
          </button>
          <button @click="showApiStatus" class="glass-btn">API 상태</button>
          <!-- ADMIN 전용 전체조회 버튼 -->
          <button
            v-if="isAdmin"
            @click="toggleMemberList"
            class="glass-btn"
            :disabled="!isAuthenticated"
          >
            {{ showMemberList ? "회원목록 닫기" : "전체조회" }}
          </button>
          <button @click="clearDevPanel" class="glass-btn">콘솔 클리어</button>
        </div>
      </div>
    </div>

    <!-- 관리자도구 토글 버튼 -->
    <button
      @click="toggleDevPanelVisibility"
      class="admin-toggle glass-btn"
      :title="
        showDevPanel
          ? isAdmin
            ? '관리자도구 숨기기'
            : '토큰 관리도구 숨기기'
          : isAdmin
          ? '관리자도구 보이기'
          : '토큰 관리도구 보이기'
      "
    >
      {{ isAdmin ? "🛠️" : "🔧" }}
    </button>

    <!-- ADMIN 전용 회원 관리 컴포넌트 -->
    <AdminMemberList
      v-if="isAdmin"
      :show-member-list="showMemberList"
      @close="closeMemberList"
    />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import authService from "@/services/auth.service";
import { useNotificationStore } from "@/stores/notification";
import TokenMonitorService from "@/services/token-monitor.service";
import ApiService from "@/services/api.service";
import AdminMemberList from "@/components/common/utils/AdminMemberList.vue";

// 스토어 접근
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { isAuthenticated, isAdmin, currentUser } = storeToRefs(authStore);

// 관리자 패널 상태
const showDevPanel = ref(false);
const isDevPanelCollapsed = ref(false);
const tokenStatus = ref({});
const apiStatus = ref({});
const showMemberList = ref(false);

// 상태 업데이트 타이머
let statusUpdateTimer = null;
let keyboardCleanup = null;

// body 스크롤 제어
const controlBodyScroll = (disable) => {
  if (disable) {
    // 스크롤 차단
    document.body.classList.add("no-scroll");
  } else {
    // 스크롤 허용
    document.body.classList.remove("no-scroll");
  }
};

// 패널 상태 감시 및 스크롤 제어
const hasOpenPanels = computed(
  () => showDevPanel.value || showMemberList.value
);

watch(hasOpenPanels, (newValue) => {
  controlBodyScroll(newValue);
});

// 계산된 속성
const formatTime = computed(() => (seconds) => {
  if (!seconds || seconds <= 0) return "만료됨";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}분 ${remainingSeconds}초`;
  }
  return `${remainingSeconds}초`;
});

const getTimeStatusClass = computed(() => (seconds) => {
  if (!seconds || seconds <= 0) return "error";
  if (seconds <= 60) return "critical";
  if (seconds <= 300) return "warning";
  return "success";
});

// 메서드들
const updateDevPanelStatus = () => {
  if (showDevPanel.value && !isDevPanelCollapsed.value) {
    try {
      tokenStatus.value = TokenMonitorService.getStatus();
      apiStatus.value = ApiService.getStatus();
    } catch (error) {}
  }
};

const toggleDevPanel = () => {
  isDevPanelCollapsed.value = !isDevPanelCollapsed.value;
};

const toggleDevPanelVisibility = () => {
  showDevPanel.value = !showDevPanel.value;

  if (showDevPanel.value) {
    updateDevPanelStatus();
    statusUpdateTimer = setInterval(updateDevPanelStatus, 1000);
  } else {
    if (statusUpdateTimer) {
      clearInterval(statusUpdateTimer);
      statusUpdateTimer = null;
    }
    // 패널이 닫히면 회원 목록도 닫기
    if (isAdmin.value) {
      showMemberList.value = false;
    }
  }
};

const toggleMemberList = () => {
  // ADMIN 권한 체크
  if (!isAdmin.value) {
    notificationStore.showWarning("관리자 권한이 필요합니다.");
    return;
  }

  if (!isAuthenticated.value) {
    notificationStore.showWarning("로그인이 필요합니다.");
    return;
  }

  showMemberList.value = !showMemberList.value;
};

const closeMemberList = () => {
  showMemberList.value = false;
};

const closeAllPanels = () => {
  showDevPanel.value = false;
  if (isAdmin.value) {
    showMemberList.value = false;
  }

  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer);
    statusUpdateTimer = null;
  }
};

const forceTokenCheck = async () => {
  try {
    await ApiService.refreshToken();
    updateDevPanelStatus();
    notificationStore.showSuccess("로그인이 연장되었습니다.");
  } catch (error) {
    notificationStore.showError("로그인 연장에 실패했습니다.");
  }
};

const showApiStatus = () => {
  try {
    const status = ApiService.getStatus();
    console.table(status);
    notificationStore.showInfo("API 상태가 콘솔에 출력되었습니다.");
  } catch (error) {
    notificationStore.showError("API 상태 조회에 실패했습니다.");
  }
};

const clearDevPanel = () => {
  console.clear();
  notificationStore.showInfo("콘솔이 클리어되었습니다.");
};

const setupKeyboardShortcuts = () => {
  const handleKeydown = (e) => {
    // ESC: 모든 패널 닫기
    if (e.key === "Escape" && hasOpenPanels.value) {
      e.preventDefault();
      closeAllPanels();
    }

    // Ctrl + Shift + D: 관리자도구 패널 토글
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      e.preventDefault();
      toggleDevPanelVisibility();
    }

    // Ctrl + Shift + M: 회원 목록 토글 (ADMIN 전용)
    if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key === "M" &&
      isAuthenticated.value &&
      isAdmin.value
    ) {
      e.preventDefault();
      toggleMemberList();
    }

    // Ctrl + Shift + T: 토큰 강제 체크
    if (e.ctrlKey && e.shiftKey && e.key === "T" && isAuthenticated.value) {
      e.preventDefault();
      forceTokenCheck();
    }

    // Ctrl + Shift + C: 콘솔 클리어
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      clearDevPanel();
    }
  };

  window.addEventListener("keydown", handleKeydown);

  // cleanup 함수 반환
  return () => {
    window.removeEventListener("keydown", handleKeydown);
  };
};

const setupGlobalObjects = () => {
  // 전역 접근 객체 설정
  window.__VUE_ADMIN__ = {
    authStore,
    notificationStore,
    TokenMonitorService,
    ApiService,
    // 유틸리티 함수들
    utils: {
      forceTokenCheck,
      showApiStatus,
      toggleDevPanel: toggleDevPanelVisibility,
      toggleMemberList: isAdmin.value ? toggleMemberList : null, // ADMIN만 접근 가능
      clearDevPanel,
      closeAllPanels,
    },
  };
};

// 라이프사이클 훅
onMounted(() => {
  keyboardCleanup = setupKeyboardShortcuts();

  setupGlobalObjects();
});

onBeforeUnmount(() => {
  // 타이머 정리
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer);
    statusUpdateTimer = null;
  }

  // 키보드 이벤트 정리
  if (keyboardCleanup) {
    keyboardCleanup();
  }

  // 스크롤 복원
  controlBodyScroll(false);
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

/* 배경 오버레이 */
.panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: $z-index-modal-backdrop;
  cursor: pointer;
}

/* 관리자 패널 */
.admin-panel {
  position: fixed;
  top: $spacing-md;
  left: $spacing-md;
  z-index: $z-index-modal;
  width: 300px;
  max-height: 70vh;
  overflow-y: auto;
  transition: all $transition-normal;

  &.collapsed {
    .admin-panel-content {
      display: none;
    }
  }
}

.admin-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: $spacing-sm 0;
  border-bottom: 1px solid rgba($medium-gray, 0.3);

  h4 {
    margin: 0;
    font-size: 0.9rem;
    color: $primary-color;
  }

  .collapse-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;
    border-radius: 4px;
    transition: all $transition-fast;

    &:hover {
      background-color: rgba($accent-color, 0.1);
    }

    svg {
      transition: transform $transition-fast;
      color: $dark-gray;

      &.rotate-180 {
        transform: rotate(180deg);
      }
    }
  }
}

.admin-panel-content {
  padding: $spacing-sm 0;
}

.status-section {
  margin-bottom: $spacing-md;

  h5 {
    margin: 0 0 $spacing-xs 0;
    font-size: 0.8rem;
    color: $primary-color;
    font-weight: $font-weight-medium;
  }
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xs;
  font-size: 0.75rem;

  span:first-child {
    color: $dark-gray;
  }

  span:last-child {
    font-weight: $font-weight-medium;
    color: $primary-color;

    &.active {
      color: $success-color;
    }

    &.warning {
      color: $warning-color;
    }

    &.critical {
      color: $error-color;
    }

    &.error {
      color: $error-color;
      font-weight: $font-weight-bold;
    }

    &.success {
      color: $success-color;
    }
  }
}

.admin-controls {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  button {
    padding: $spacing-xs;
    font-size: 0.75rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* 관리자도구 토글 버튼 */
.admin-toggle {
  position: fixed;
  bottom: $spacing-md;
  left: $spacing-md;
  z-index: $z-index-fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  padding: 0;

  &:hover {
    transform: scale(1.1);
  }
}

/* 모바일 대응 */
@media (max-width: $breakpoint-md) {
  .admin-panel {
    top: $spacing-sm;
    left: $spacing-sm;
    right: $spacing-sm;
    width: auto;
    max-height: 50vh;
  }

  .admin-toggle {
    bottom: $spacing-sm;
    left: $spacing-sm;
  }
}

/* 스크롤바 스타일링 */
.admin-panel {
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba($light-gray, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($dark-gray, 0.3);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba($primary-color, 0.4);
  }
}
</style>

<style lang="scss">
/* 전역 스타일 - body 스크롤 제어 */
body.no-scroll {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}
</style>
