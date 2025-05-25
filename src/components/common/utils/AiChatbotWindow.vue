<template>
  <div
    ref="chatWindowRef"
    class="ai-chatbot-window glass-card"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @mousedown="startDrag"
  >
    <!-- 헤더 -->
    <div class="chatbot-header" @mousedown="startDrag">
      <div class="chatbot-header__title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="chatbot-header__icon"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="22"></line>
          <line x1="8" y1="22" x2="16" y2="22"></line>
        </svg>
        <span>AI 여행 상담사</span>
        <div class="chatbot-status online">
          <span class="status-dot"></span>
          <span class="status-text">온라인</span>
        </div>
      </div>

      <div class="chatbot-header__actions">
        <button
          class="header-btn minimize-btn"
          @click="$emit('minimize')"
          title="최소화"
        >
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
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          class="header-btn close-btn"
          @click="$emit('close')"
          title="닫기"
        >
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
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- 채팅 메시지 영역 -->
    <div class="chatbot-messages" ref="messagesContainer">
      <!-- 웰컴 메시지 -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="ai-avatar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
            ></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
        </div>
        <div class="welcome-content">
          <h3>안녕하세요! 👋</h3>
          <p>AI 여행 상담사입니다.</p>
          <p>여행 관련 궁금한 점이 있으시면 언제든지 물어보세요!</p>
          <div class="suggested-questions">
            <button
              v-for="suggestion in suggestedQuestions"
              :key="suggestion"
              class="suggestion-btn glass-btn"
              @click="sendMessage(suggestion)"
              :disabled="isLoading || isTyping"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- 채팅 메시지들 -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="{
          'message--user': message.isUser,
          'message--ai': !message.isUser,
        }"
      >
        <div v-if="!message.isUser" class="message__avatar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
            ></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
        </div>

        <div class="message__content">
          <div class="message__bubble">
            <p v-if="message.isUser" class="message__text">
              {{ message.text }}
            </p>
            <div v-else class="message__text">
              <!-- 타이핑 중일 때는 원본 텍스트 표시 + 커서 -->
              <template v-if="message.isTyping">
                {{ message.text }}<span class="typing-cursor">|</span>
              </template>
              <!-- 타이핑 완료 시 마크다운 적용 -->
              <div v-else v-html="formatAiMessage(message.text)"></div>
            </div>
          </div>
          <div class="message__time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>

      <!-- 로딩 메시지 -->
      <div v-if="isLoading" class="message message--ai">
        <div class="message__avatar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
            ></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
        </div>
        <div class="message__content">
          <div class="message__bubble message__bubble--loading">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 입력 영역 -->
    <div class="chatbot-input">
      <div class="input-container">
        <textarea
          ref="messageInput"
          v-model="currentMessage"
          placeholder="여행 관련 질문을 입력해주세요..."
          class="message-input"
          rows="1"
          :disabled="isLoading || isTyping"
          @keydown="handleKeyDown"
          @input="adjustTextareaHeight"
        ></textarea>
        <button
          class="send-btn glass-btn"
          @click="sendCurrentMessage"
          :disabled="isLoading || isTyping || !currentMessage.trim()"
          title="전송"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="send-icon"
          >
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { useNotificationStore } from "@/stores/notification";
import aiService from "@/services/ai.service";

// Props 정의
const props = defineProps({
  initialPosition: {
    type: Object,
    default: () => ({ x: 100, y: 100 }),
  },
});

// Emits 정의
const emit = defineEmits(["close", "minimize"]);

// 상태 정의
const messages = ref([]);
const currentMessage = ref("");
const isLoading = ref(false);
const nextMessageId = ref(1);

// 타이핑 애니메이션 관련 상태
const isTyping = ref(false);
const typingMessageId = ref(null);
const typingText = ref("");
const typingSpeed = ref(20); // 타이핑 속도 (ms)

// 드래그 관련 상태
const chatWindowRef = ref(null);
const messagesContainer = ref(null);
const messageInput = ref(null);
const position = ref({ ...props.initialPosition });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// 스토어
const notificationStore = useNotificationStore();

// 추천 질문들
const suggestedQuestions = [
  "부산 여행 추천해주세요",
  "제주도 맛집 알려주세요",
  "서울 가볼만한 곳은?",
  "1박 2일 여행 코스 추천",
];

// 메시지 전송
const sendMessage = async (messageText = null) => {
  const text = messageText || currentMessage.value.trim();
  if (!text || isLoading.value || isTyping.value) return;

  // 사용자 메시지 추가
  const userMessage = {
    id: nextMessageId.value++,
    text: text,
    isUser: true,
    timestamp: new Date(),
  };
  messages.value.push(userMessage);

  // 입력창 초기화
  if (!messageText) {
    currentMessage.value = "";
    adjustTextareaHeight();
  }

  // 스크롤을 하단으로
  await nextTick();
  scrollToBottom();

  // AI 응답 요청
  isLoading.value = true;

  try {
    const response = await aiService.requestAiChat(text);

    // AI 응답 메시지 추가 (빈 텍스트로 시작)
    if (
      response &&
      response.data &&
      response.data.data &&
      response.data.data.response
    ) {
      const aiMessageId = nextMessageId.value++;
      const aiMessage = {
        id: aiMessageId,
        text: "", // 빈 텍스트로 시작
        isUser: false,
        timestamp: new Date(),
        isTyping: true, // 타이핑 중임을 표시
      };
      messages.value.push(aiMessage);

      // 로딩 상태 해제하고 타이핑 애니메이션 시작
      isLoading.value = false;
      await nextTick();
      scrollToBottom();

      // 타이핑 애니메이션 시작
      startTypingAnimation(aiMessageId, response.data.data.response);
    } else {
      throw new Error("응답 데이터를 찾을 수 없습니다.");
    }
  } catch (error) {
    // 에러 메시지 추가
    const errorMessageId = nextMessageId.value++;
    const errorMessage = {
      id: errorMessageId,
      text: "",
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    messages.value.push(errorMessage);

    isLoading.value = false;
    await nextTick();
    scrollToBottom();

    // 에러 메시지 타이핑 애니메이션
    startTypingAnimation(
      errorMessageId,
      "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    );

    notificationStore.showError("AI 상담 서비스 오류가 발생했습니다.");
  }
};

// 현재 입력된 메시지 전송
const sendCurrentMessage = () => {
  sendMessage();
};

// 키보드 이벤트 처리
const handleKeyDown = (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !isLoading.value &&
    !isTyping.value
  ) {
    event.preventDefault();
    sendCurrentMessage();
  }
};

// 텍스트에리어 높이 자동 조절
const adjustTextareaHeight = () => {
  if (!messageInput.value) return;

  messageInput.value.style.height = "auto";
  const scrollHeight = messageInput.value.scrollHeight;
  const maxHeight = 120; // 최대 높이 제한
  messageInput.value.style.height = Math.min(scrollHeight, maxHeight) + "px";
};

// 스크롤을 하단으로 이동
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 타이핑 애니메이션 시작
const startTypingAnimation = async (messageId, fullText) => {
  isTyping.value = true;
  typingMessageId.value = messageId;

  const message = messages.value.find((m) => m.id === messageId);
  if (!message) return;

  let currentIndex = 0;
  const textLength = fullText.length;

  const typeNextCharacter = async () => {
    if (currentIndex < textLength) {
      // 한글, 영문, 숫자, 특수문자에 따라 타이핑 속도 조절
      const char = fullText[currentIndex];
      let charsToAdd = 1;
      let delay = typingSpeed.value;

      // 한글 음절이나 영문 단어 단위로 처리
      if (/[가-힣]/.test(char)) {
        // 한글 - 조금 더 빠르게
        delay = typingSpeed.value * 0.8;
      } else if (/[a-zA-Z]/.test(char)) {
        // 영문 - 단어 단위로 빠르게 타이핑
        let wordEnd = currentIndex;
        while (wordEnd < textLength && /[a-zA-Z]/.test(fullText[wordEnd])) {
          wordEnd++;
        }
        // 짧은 단어는 한 번에, 긴 단어는 2-3글자씩
        const wordLength = wordEnd - currentIndex;
        if (wordLength <= 3) {
          charsToAdd = wordLength;
        } else {
          charsToAdd = Math.min(3, wordLength);
        }
        delay = typingSpeed.value * 0.6;
      } else if (/[0-9]/.test(char)) {
        // 숫자 - 빠르게
        delay = typingSpeed.value * 0.5;
      } else if (char === " ") {
        // 공백 - 약간의 일시정지 효과
        delay = typingSpeed.value * 1.5;
      } else if (/[.,!?;:]/.test(char)) {
        // 문장부호 - 일시정지 효과
        delay = typingSpeed.value * 2;
      }

      // 현재까지의 텍스트 업데이트
      currentIndex = Math.min(currentIndex + charsToAdd, textLength);
      message.text = fullText.substring(0, currentIndex);

      // 스크롤을 하단으로 (부드럽게)
      await nextTick();
      scrollToBottom();

      // 다음 글자 타이핑 예약
      setTimeout(typeNextCharacter, delay);
    } else {
      // 타이핑 완료
      message.isTyping = false;
      isTyping.value = false;
      typingMessageId.value = null;

      // 최종 스크롤
      await nextTick();
      scrollToBottom();
    }
  };

  // 타이핑 시작 (약간의 딜레이 후)
  setTimeout(typeNextCharacter, 200);
};

// AI 메시지 포맷팅 (마크다운 및 줄바꿈 처리)
const formatAiMessage = (text) => {
  let formatted = text;

  // 줄바꿈 처리
  formatted = formatted.replace(/\n/g, "<br>");

  // 볼드 텍스트 (**텍스트**)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 이탤릭 텍스트 (*텍스트*)
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // 인라인 코드 (`코드`)
  formatted = formatted.replace(
    /`(.*?)`/g,
    '<code class="inline-code">$1</code>'
  );

  // 헤딩 (### 텍스트)
  formatted = formatted.replace(
    /^### (.*$)/gm,
    '<h3 class="chat-heading">$1</h3>'
  );
  formatted = formatted.replace(
    /^## (.*$)/gm,
    '<h2 class="chat-heading">$1</h2>'
  );
  formatted = formatted.replace(
    /^# (.*$)/gm,
    '<h1 class="chat-heading">$1</h1>'
  );

  // 리스트 아이템 (- 텍스트)
  formatted = formatted.replace(
    /^- (.*$)/gm,
    '<li class="chat-list-item">$1</li>'
  );

  // 연속된 li 태그들을 ul로 감싸기
  formatted = formatted.replace(
    /(<li class="chat-list-item">.*<\/li>)/s,
    '<ul class="chat-list">$1</ul>'
  );
  formatted = formatted.replace(
    /(<\/li>)<br>(<li class="chat-list-item">)/g,
    "$1$2"
  );

  return formatted;
};

// 시간 포맷팅
const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 드래그 기능
const startDrag = (event) => {
  // 입력창이나 버튼 클릭 시에는 드래그하지 않음
  if (
    event.target.closest(".chatbot-input") ||
    event.target.closest(".header-btn") ||
    event.target.closest(".suggestion-btn") ||
    event.target.closest(".send-btn")
  ) {
    return;
  }

  isDragging.value = true;
  const rect = chatWindowRef.value.getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
  event.preventDefault();
};

const onDrag = (event) => {
  if (!isDragging.value) return;

  const maxX = window.innerWidth - 400; // 창 너비 고려
  const maxY = window.innerHeight - 600; // 새로운 창 높이 고려 (500px → 600px)

  position.value = {
    x: Math.max(0, Math.min(maxX, event.clientX - dragOffset.value.x)),
    y: Math.max(0, Math.min(maxY, event.clientY - dragOffset.value.y)),
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
};

// 컴포넌트 마운트 시 입력창 포커스
onMounted(() => {
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.focus();
    }
  });
});

// 컴포넌트 해제 시 이벤트 리스너 정리
onUnmounted(() => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles/glassmorphism" as *;

.ai-chatbot-window {
  position: fixed;
  width: 400px;
  height: 600px;
  z-index: 1060;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  cursor: move;
  padding: 0 !important;

  @media (max-width: $breakpoint-sm) {
    width: calc(100vw - 32px);
    height: calc(100vh - 32px);
    left: 16px !important;
    top: 16px !important;
  }
}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid rgba($primary-color, 0.1);
  flex-shrink: 0;
  cursor: move;

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-weight: $font-weight-medium;
    color: $primary-color;
    font-size: 0.95rem;
  }

  &__icon {
    color: $accent-color;
    flex-shrink: 0;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }
}

.chatbot-status {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-left: $spacing-sm;

  &.online .status-dot {
    background-color: $success-color;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  font-size: 0.8rem;
  color: rgba($primary-color, 0.7);
}

.header-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba($white, 0.1);
  color: rgba($primary-color, 0.7);
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;
  z-index: 10;

  svg {
    position: relative;
    z-index: 11;
    color: inherit;
    stroke-width: 2;
    display: block;
  }

  &:hover {
    background-color: rgba($white, 0.2);
    color: $primary-color;

    svg {
      color: inherit;
    }
  }

  &.close-btn:hover {
    background-color: rgba($error-color, 0.2);
    color: $error-color;

    svg {
      color: $error-color;
    }
  }
}

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba($light-gray, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($dark-gray, 0.4);
    border-radius: 3px;

    &:hover {
      background: rgba($primary-color, 0.4);
    }
  }
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: $spacing-lg 0;

  .ai-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba($accent-color, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-md;
    color: $accent-color;

    svg {
      color: $accent-color;
      stroke-width: 2;
      display: block;
    }
  }

  h3 {
    margin: 0 0 $spacing-sm;
    color: $primary-color;
    font-size: 1.1rem;
  }

  p {
    margin: 0 0 $spacing-xs;
    color: rgba($primary-color, 0.7);
    font-size: 0.9rem;
  }
}

.suggested-questions {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-top: $spacing-md;
  width: 100%;
}

.suggestion-btn {
  padding: $spacing-sm $spacing-md;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: left;
  transition: $transition-fast;
  cursor: pointer;
  color: $primary-color;
  background-color: rgba($white, 0.8);
  border: 1px solid rgba($primary-color, 0.1);

  &:hover:not(:disabled) {
    background-color: rgba($accent-color, 0.1);
    color: $accent-color;
    border-color: rgba($accent-color, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: rgba($primary-color, 0.5);
  }
}

.message {
  display: flex;
  gap: $spacing-sm;
  align-items: flex-end;

  &--user {
    flex-direction: row-reverse;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba($accent-color, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $accent-color;
    flex-shrink: 0;

    svg {
      color: inherit;
      stroke-width: 2;
      display: block;
    }

    &--user {
      background: rgba($primary-color, 0.1);
      color: $primary-color;

      svg {
        color: $primary-color;
      }
    }
  }

  &__content {
    max-width: 70%;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__bubble {
    padding: $spacing-sm $spacing-md;
    border-radius: 16px;
    background: rgba($white, 0.8);
    border: 1px solid rgba($primary-color, 0.1);

    .message--user & {
      background: rgba($accent-color, 0.1);
      border-color: rgba($accent-color, 0.2);
      margin-left: auto;
    }

    &--loading {
      padding: $spacing-md;
    }
  }

  &__text {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
    color: $primary-color;

    // 마크다운 요소 스타일링
    strong {
      font-weight: $font-weight-bold;
      color: $primary-color;
    }

    em {
      font-style: italic;
      color: rgba($primary-color, 0.9);
    }

    .inline-code {
      background-color: rgba($accent-color, 0.1);
      color: $accent-color;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: "Courier New", Consolas, Monaco, monospace;
      font-size: 0.85em;
      font-weight: $font-weight-medium;
    }

    .chat-heading {
      margin: $spacing-sm 0;
      font-weight: $font-weight-bold;
      color: $primary-color;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    h1.chat-heading {
      font-size: 1.1rem;
    }

    h2.chat-heading {
      font-size: 1.05rem;
    }

    h3.chat-heading {
      font-size: 1rem;
    }

    .chat-list {
      margin: $spacing-sm 0;
      padding-left: $spacing-md;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    .chat-list-item {
      margin-bottom: $spacing-xs;
      color: $primary-color;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  &__time {
    font-size: 0.75rem;
    color: rgba($primary-color, 0.5);

    .message--user & {
      text-align: right;
    }
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgba($accent-color, 0.6);
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) {
      animation-delay: 0ms;
    }
    &:nth-child(2) {
      animation-delay: 160ms;
    }
    &:nth-child(3) {
      animation-delay: 320ms;
    }
  }
}

// 타이핑 커서 애니메이션
.typing-cursor {
  display: inline-block;
  color: $accent-color;
  font-weight: $font-weight-bold;
  animation: blink 1s infinite;
  margin-left: 1px;
}

.chatbot-input {
  padding: $spacing-md;
  border-top: 1px solid rgba($primary-color, 0.1);
  flex-shrink: 0;
}

.input-container {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.message-input {
  width: 100%;
  padding: $spacing-md $spacing-3xl $spacing-md $spacing-md; // 우측에 버튼 공간 확보
  border: 1px solid rgba($primary-color, 0.2);
  border-radius: 20px;
  background: rgba($white, 0.8);
  color: $primary-color;
  font-size: 0.9rem;
  resize: none;
  min-height: 44px; // 버튼 높이와 맞춤
  max-height: 120px;
  outline: none;
  transition: $transition-fast;
  box-sizing: border-box;
  overflow: hidden; // 스크롤바 숨김

  // 스크롤바 완전히 제거
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // Internet Explorer 10+

  &::-webkit-scrollbar {
    display: none; // Chrome, Safari, Opera
  }

  &:focus {
    border-color: $accent-color;
    box-shadow: 0 0 0 2px rgba($accent-color, 0.2);
  }

  &::placeholder {
    color: rgba($primary-color, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 수정된 전송 버튼 스타일 - 입력창 내부 배치
.send-btn {
  position: absolute;
  right: 6px; // 입력창 내부 우측에 배치
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  min-width: 32px; // 완전한 원형을 위한 고정 크기
  max-width: 32px;
  min-height: 32px;
  max-height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-normal;
  flex-shrink: 0;
  border: none;
  z-index: 3;
  box-sizing: border-box; // 패딩, 보더 포함한 크기 계산
  overflow: hidden; // 내용 넘침 방지
  padding: 0; // 패딩 제거하여 완전한 원형 유지
  margin-top: -1px; // 정확한 중앙 정렬을 위한 미세 조정

  // 기본 상태 (활성화) - 토스블루 배경 + 흰색 아이콘
  &:not(:disabled) {
    background: linear-gradient(
      135deg,
      $accent-color,
      color.scale($accent-color, $lightness: -5%)
    );
    color: white;
    box-shadow: 0 2px 8px rgba($accent-color, 0.3),
      0 1px 3px rgba($accent-color, 0.2);

    &:hover {
      background: linear-gradient(
        135deg,
        color.scale($accent-color, $lightness: -5%),
        color.scale($accent-color, $lightness: -10%)
      );
      color: white;
      // transform에서 scale만 변경하여 원형 유지
      transform: translateY(-50%) scale(1.05);
      margin-top: -1px; // 정확한 중앙 정렬 유지
      box-shadow: 0 4px 12px rgba($accent-color, 0.4),
        0 2px 6px rgba($accent-color, 0.3);

      .send-icon {
        // 아이콘만 살짝 이동, scale은 제거
        transform: translateX(1px);
      }
    }

    &:active {
      // 클릭 시에도 원형 유지
      transform: translateY(-50%) scale(0.95);
      margin-top: -1px; // 정확한 중앙 정렬 유지
      box-shadow: 0 1px 4px rgba($accent-color, 0.4);
    }
  }

  // 비활성화 상태 - 회색 배경 + 회색 아이콘
  &:disabled {
    background: rgba($medium-gray, 0.6);
    color: rgba($dark-gray, 0.6);
    box-shadow: none;
    cursor: not-allowed;
  }

  // 전송 아이콘 스타일링
  .send-icon {
    width: 18px !important; // 약간 작게 조정하여 원형 버튼에 잘 맞도록
    height: 18px !important;
    transition: all $transition-fast;
    position: relative;
    z-index: 2;
    display: block !important;
    pointer-events: none;
    min-width: 18px;
    min-height: 18px;
    color: inherit;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
