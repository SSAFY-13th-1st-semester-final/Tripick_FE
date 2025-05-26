<template>
  <div class="ai-chatbot-toggle">
    <!-- 토글 버튼 -->
    <button
      class="toggle-btn glass-btn"
      @click="toggleChatbot"
      :class="{ active: isChatbotVisible }"
      title="AI 여행 상담사"
    >
      <!-- AI 아이콘 (챗봇 닫혀있을 때) -->
      <img
        v-if="!isChatbotVisible"
        src="/src/assets/data/images/ai-icon.png"
        alt="AI"
        class="toggle-icon ai-icon"
      />

      <!-- 닫기 아이콘 (챗봇 열려있을 때) -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="toggle-icon close-icon"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>

      <!-- 새 메시지 알림 배지 -->
      <div v-if="hasNewMessage && !isChatbotVisible" class="notification-badge">
        <span class="badge-dot"></span>
      </div>
    </button>

    <!-- AI 챗봇 창 -->
    <AiChatbotWindow
      v-if="isChatbotVisible"
      :initial-position="chatbotPosition"
      @close="closeChatbot"
      @minimize="minimizeChatbot"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useNotificationStore } from "@/stores/notification";
import AiChatbotWindow from "./AiChatbotWindow.vue";

// 상태 정의
const isChatbotVisible = ref(false);
const hasNewMessage = ref(false);
const chatbotPosition = ref({ x: 100, y: 100 });

// 스토어
const notificationStore = useNotificationStore();

// 챗봇 토글
const toggleChatbot = () => {
  if (isChatbotVisible.value) {
    closeChatbot();
  } else {
    openChatbot();
  }
};

// 챗봇 열기
const openChatbot = () => {
  isChatbotVisible.value = true;
  hasNewMessage.value = false;

  // 챗봇 위치를 토글 버튼 기준으로 설정 (우측하단에서 약간 떨어진 위치)
  chatbotPosition.value = {
    x: Math.max(50, window.innerWidth - 450), // 우측에서 450px 떨어진 위치
    y: Math.max(50, (window.innerHeight - 600) / 2), // 세로 중앙
  };

  notificationStore.showInfo("AI 여행 상담사가 활성화되었습니다.");
};

// 챗봇 닫기
const closeChatbot = () => {
  isChatbotVisible.value = false;
  notificationStore.showInfo("AI 여행 상담사가 비활성화되었습니다.");
};

// 챗봇 최소화
const minimizeChatbot = () => {
  isChatbotVisible.value = false;
  hasNewMessage.value = true; // 최소화 시 새 메시지 알림 표시
};

// 키보드 단축키 (Ctrl + /)
const handleKeyboardShortcut = (event) => {
  if (event.ctrlKey && event.key === "/") {
    event.preventDefault();
    toggleChatbot();
  }

  // ESC 키로 챗봇 닫기
  if (event.key === "Escape" && isChatbotVisible.value) {
    closeChatbot();
  }
};

// 브라우저 리사이즈 시 챗봇 위치 조정
const handleResize = () => {
  if (isChatbotVisible.value) {
    const maxX = window.innerWidth - 400;
    const maxY = window.innerHeight - 600; // 새로운 높이에 맞게 수정

    chatbotPosition.value = {
      x: Math.max(50, Math.min(chatbotPosition.value.x, maxX)),
      y: Math.max(50, Math.min(chatbotPosition.value.y, maxY)),
    };
  }
};

// 라이프사이클
onMounted(() => {
  document.addEventListener("keydown", handleKeyboardShortcut);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyboardShortcut);
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.ai-chatbot-toggle {
  position: fixed;
  bottom: $spacing-2xl;
  right: $spacing-lg; // 위치를 우측하단으로 변경
  z-index: 1050;

  @media (max-width: $breakpoint-sm) {
    bottom: $spacing-lg;
    right: $spacing-md;
  }
}

.toggle-btn {
  position: relative;
  width: 52px; // 크기 줄이기 (60px → 52px)
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($white, 0.95); // 기본 흰 배경
  color: $accent-color; // 기본 토스블루 아이콘
  cursor: pointer;
  transition: all $transition-normal;
  box-shadow: $shadow-lg;
  border: 1px solid rgba($accent-color, 0.2);

  // 글래스모피즘 효과
  @include glassmorphism(0.95, 15px);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);

  &:hover {
    transform: scale(1.1) translateY(-2px);
    box-shadow: $shadow-xl;
    background: rgba($accent-color, 0.95); // 호버 시 토스블루 배경
    color: $white; // 호버 시 흰 아이콘
    border-color: rgba($accent-color, 0.8);

    .close-icon {
      color: $white;
    }
  }

  &:active {
    transform: scale(1.05) translateY(-1px);
  }

  &.active {
    background: rgba($error-color, 0.95);
    color: $white;
    border-color: rgba($error-color, 0.8);

    .close-icon {
      color: $white;
    }

    &:hover {
      background: rgba($error-color, 1);

      .close-icon {
        color: $white;
      }
    }
  }

  // 펄스 애니메이션 (처음 방문자용)
  &:not(.active) {
    animation: pulse-glow 3s infinite;
  }
}

.toggle-icon {
  position: relative;
  z-index: 10;
  transition: all $transition-fast;

  // AI 아이콘 (PNG 이미지)
  &.ai-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  // 닫기 아이콘 (SVG)
  &.close-icon {
    width: 32px;
    height: 32px;
    stroke-width: 3;
    color: inherit;
  }
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba($error-color, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $white;
    animation: pulse 2s infinite;
  }
}

// 애니메이션
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: $shadow-lg, 0 0 0 0 rgba($accent-color, 0.5);
  }
  50% {
    box-shadow: $shadow-xl, 0 0 0 8px rgba($accent-color, 0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}

// 모바일 최적화
@media (max-width: $breakpoint-sm) {
  .toggle-btn {
    width: 48px; // 모바일에서 더 작게 (56px → 48px)
    height: 48px;

    .toggle-icon {
      &.ai-icon {
        width: 24px;
        height: 24px;
      }

      &.close-icon {
        width: 20px;
        height: 20px;
        stroke-width: 2.5;
      }
    }
  }

  .notification-badge {
    top: 4px;
    right: 4px;
    width: 12px;
    height: 12px;

    .badge-dot {
      width: 5px;
      height: 5px;
    }
  }
}
</style>
