<template>
  <div class="map-action-bar glass-card">
    <button
      class="action-btn glass-btn"
      @click="$emit('temporary-save')"
      :disabled="isTemporarySaving"
      :class="{ saved: isTemporarySaved }"
      title="임시저장"
    >
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
      >
        <path
          d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      <span class="btn-text">임시저장</span>
    </button>

    <button
      class="action-btn glass-btn"
      @click="$emit('toggle-ai-evaluation')"
      :class="{ active: isAiEvaluationVisible }"
      title="AI 일정 평가"
    >
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
      >
        <path d="M9 12l2 2 4-4"></path>
        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
        <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
        <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
      </svg>
      <span class="btn-text">AI 평가</span>
    </button>

    <button
      class="action-btn glass-btn"
      @click="$emit('optimize-paths')"
      title="경로최적화"
    >
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
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <span class="btn-text">경로최적화</span>
    </button>

    <button
      class="action-btn glass-btn"
      @click="toggleFullscreen"
      :title="isFullscreen ? '전체화면 나가기' : '전체화면'"
    >
      <svg
        v-if="!isFullscreen"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
        />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
        />
      </svg>
      <span class="btn-text">전체화면</span>
    </button>

    <button
      class="action-btn glass-btn primary"
      @click="handleSaveClick"
      :disabled="isSaveDisabled"
      :title="saveButtonTitle"
    >
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
      >
        <path
          d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      <span class="btn-text">{{ saveButtonText }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useNotificationStore } from "@/stores/notification";

defineProps({
  isTemporarySaved: Boolean,
  isTemporarySaving: Boolean,
  isAiEvaluationVisible: Boolean,
});

const emit = defineEmits([
  "temporary-save",
  "optimize-paths",
  "save-trip",
  "toggle-ai-evaluation",
]);

const isFullscreen = ref(false);
const notificationStore = useNotificationStore();

// 저장 버튼 쿨다운 관련 상태
const cooldownRemaining = ref(0);
const cooldownTimer = ref(null);

// 저장 버튼 계산된 속성
const isSaveDisabled = computed(() => {
  return cooldownRemaining.value > 0;
});

const saveButtonText = computed(() => {
  return cooldownRemaining.value > 0
    ? `${cooldownRemaining.value}초`
    : "저장하기";
});

const saveButtonTitle = computed(() => {
  return cooldownRemaining.value > 0
    ? `${cooldownRemaining.value}초 후 다시 저장할 수 있습니다`
    : "저장하기";
});

// 저장 버튼 클릭 핸들러
const handleSaveClick = () => {
  if (isSaveDisabled.value) return;

  // 부모에게 저장 이벤트 전달
  emit("save-trip");

  // 5초 쿨다운 시작
  startCooldown();
};

// 쿨다운 시작
const startCooldown = () => {
  cooldownRemaining.value = 5;

  const countdown = () => {
    if (cooldownRemaining.value > 0) {
      cooldownRemaining.value--;
      cooldownTimer.value = setTimeout(countdown, 1000);
    }
  };

  countdown();
};

// 전체화면 관련 기능
const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      notificationStore.showSuccess("전체화면 모드로 전환되었습니다.");
    } else {
      await document.exitFullscreen();
      notificationStore.showSuccess("전체화면 모드를 나갔습니다.");
    }
  } catch (error) {
    notificationStore.showError("전체화면 전환에 실패했습니다.");
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  isFullscreen.value = !!document.fullscreenElement;
});

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  // 타이머 정리
  if (cooldownTimer.value) {
    clearTimeout(cooldownTimer.value);
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.map-action-bar.glass-card {
  padding: $spacing-md !important;
}

.map-action-bar {
  position: fixed;
  bottom: 120px;
  right: $spacing-md;
  z-index: $z-index-modal;
  @include glassmorphism(0.8, 15px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 1px;
  border-radius: 18px;
  box-shadow: $shadow-xl;
}

.action-btn {
  width: 60px;
  height: 60px;
  min-width: 60px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 12px;
  background-color: rgba($white, 0.05);
  color: $primary-color;
  transition: all $transition-fast;

  svg {
    color: inherit;
    flex-shrink: 0;
  }

  .btn-text {
    font-size: 10px;
    margin-top: 4px;
    color: inherit;
    text-align: center;
  }

  &:hover {
    color: $accent-color;
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      color: inherit;
      transform: none;
    }
  }

  &.primary {
    background: rgba($accent-color, 0.9);
    color: $white;

    &:hover {
      background: rgba($accent-color, 1);
    }

    &:disabled {
      background: rgba($accent-color, 0.4);

      &:hover {
        background: rgba($accent-color, 0.4);
      }
    }
  }

  &.saved {
    background: rgba($success-color, 0.1);
    color: $success-color;
    border: 1px solid rgba($success-color, 0.3);

    &:hover {
      background: rgba($success-color, 0.2);
    }
  }

  &.active {
    background: rgba($accent-color, 0.2);
    color: $accent-color;
    border: 1px solid rgba($accent-color, 0.4);

    &:hover {
      background: rgba($accent-color, 0.3);
    }
  }
}
</style>
