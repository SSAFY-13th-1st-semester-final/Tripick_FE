<template>
  <div v-if="showMemberList" class="admin-member-panel glass-card">
    <div class="admin-panel-header">
      <h4>👥 회원 관리</h4>
      <button class="close-btn" @click="closeMemberList">
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

    <div class="admin-panel-content">
      <!-- 카테고리 필터 -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-buttons">
            <button
              @click="setFilter('all')"
              :class="['filter-btn', { active: currentFilter === 'all' }]"
            >
              전체회원
            </button>
            <button
              @click="setFilter('active')"
              :class="['filter-btn', { active: currentFilter === 'active' }]"
            >
              현재회원
            </button>
            <button
              @click="setFilter('deleted')"
              :class="['filter-btn', { active: currentFilter === 'deleted' }]"
            >
              탈퇴회원
            </button>
          </div>

          <!-- 선택 모드 토글 (전체회원 제외) -->
          <button
            v-if="currentFilter !== 'all'"
            @click="toggleSelectionMode"
            :class="['selection-toggle', { active: isSelectionMode }]"
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
          </button>
        </div>

        <!-- 선택된 항목 액션 -->
        <div
          v-if="isSelectionMode && selectedMembers.length > 0"
          class="batch-actions"
        >
          <span class="selected-count"
            >{{ selectedMembers.length }}명 선택됨</span
          >
          <button
            @click="executeBatchAction"
            :class="[
              'batch-action-btn',
              currentFilter === 'deleted' ? 'restore' : 'delete',
            ]"
            :disabled="isProcessing"
          >
            <svg
              v-if="currentFilter === 'deleted'"
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
              <path
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              ></path>
              <path d="M8 12l2 2 4-4"></path>
            </svg>
            <svg
              v-else
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
              <path d="M3 6h18l-1.5 15H4.5L3 6z"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            {{ currentFilter === "deleted" ? "복구" : "탈퇴처리" }}
          </button>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>로딩 중...</span>
      </div>

      <!-- 회원 테이블 -->
      <div v-else-if="members.length > 0" class="members-table-container">
        <div class="members-table">
          <!-- 테이블 헤더 -->
          <div class="table-header">
            <div v-if="isSelectionMode" class="header-cell checkbox-cell">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="member-checkbox"
              />
            </div>
            <div class="header-cell">ID</div>
            <div class="header-cell">닉네임</div>
            <div class="header-cell">이메일</div>
            <div class="header-cell">상태</div>
            <div v-if="currentFilter === 'all'" class="header-cell">액션</div>
          </div>

          <!-- 테이블 바디 -->
          <div class="table-body">
            <div
              v-for="member in members"
              :key="member.id"
              :class="[
                'table-row',
                { selected: selectedMembers.includes(member.id) },
              ]"
            >
              <div v-if="isSelectionMode" class="table-cell checkbox-cell">
                <input
                  type="checkbox"
                  :value="member.id"
                  :checked="selectedMembers.includes(member.id)"
                  @change="toggleMemberSelection(member.id)"
                  class="member-checkbox"
                />
              </div>
              <div class="table-cell">{{ member.id }}</div>
              <div class="table-cell">{{ member.nickname }}</div>
              <div class="table-cell">{{ member.email }}</div>
              <div class="table-cell">
                <span
                  :class="[
                    'status-badge',
                    member.isDeleted ? 'deleted' : 'active',
                  ]"
                >
                  {{ member.isDeleted ? "탈퇴" : "활성" }}
                </span>
              </div>
              <div v-if="currentFilter === 'all'" class="table-cell">
                <button
                  @click="handleMemberAction(member)"
                  :class="[
                    'action-btn',
                    member.isDeleted ? 'restore' : 'delete',
                  ]"
                  :disabled="isProcessing"
                >
                  {{ member.isDeleted ? "복구" : "탈퇴" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="empty-state">
        <div class="empty-icon">👤</div>
        <p>조회된 회원이 없습니다.</p>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 0"
          class="pagination-btn"
        >
          이전
        </button>
        <span class="page-info">
          {{ currentPage + 1 }} / {{ totalPages }}
        </span>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages - 1"
          class="pagination-btn"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useNotificationStore } from "@/stores/notification";
import AdminService from "@/services/admin.service";

// Props
const props = defineProps({
  showMemberList: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["close"]);

// 스토어
const notificationStore = useNotificationStore();

// 반응형 데이터
const loading = ref(false);
const isProcessing = ref(false);
const members = ref([]);
const currentFilter = ref("all"); // 'all', 'active', 'deleted'
const isSelectionMode = ref(false);
const selectedMembers = ref([]);

// 페이지네이션
const currentPage = ref(0);
const pageSize = ref(10);
const totalElements = ref(0);
const totalPages = ref(0);

// 계산된 속성
const isAllSelected = computed(() => {
  return (
    members.value.length > 0 &&
    selectedMembers.value.length === members.value.length
  );
});

// 메서드
const setFilter = (filter) => {
  currentFilter.value = filter;
  isSelectionMode.value = false;
  selectedMembers.value = [];
  currentPage.value = 0;
  loadMembers();
};

const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value;
  selectedMembers.value = [];
};

const toggleMemberSelection = (memberId) => {
  const index = selectedMembers.value.indexOf(memberId);
  if (index > -1) {
    selectedMembers.value.splice(index, 1);
  } else {
    selectedMembers.value.push(memberId);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedMembers.value = [];
  } else {
    selectedMembers.value = members.value.map((member) => member.id);
  }
};

const loadMembers = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
    };

    if (currentFilter.value === "active") {
      params.isDeleted = false;
    } else if (currentFilter.value === "deleted") {
      params.isDeleted = true;
    }

    const response = await AdminService.getMemberList(params);

    if (response.data.status === 200) {
      members.value = response.data.data.content || [];
      totalElements.value = response.data.data.totalElements || 0;
      totalPages.value = response.data.data.totalPages || 0;
    } else {
      throw new Error(response.message || "회원 목록 조회에 실패했습니다.");
    }
  } catch (error) {
    console.error("회원 목록 조회 실패:", error);
    notificationStore.showError("회원 목록 조회에 실패했습니다.");
    members.value = [];
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
    loadMembers();
  }
};

const handleMemberAction = async (member) => {
  if (isProcessing.value) return;

  const action = member.isDeleted ? "복구" : "탈퇴처리";

  try {
    isProcessing.value = true;

    if (member.isDeleted) {
      // 복구 처리
      await AdminService.restoreMember(member.id);
      notificationStore.showSuccess(`${member.nickname}님이 복구되었습니다.`);
    } else {
      // 탈퇴 처리 (API가 없으므로 로그만 출력)
      console.log(`탈퇴 처리: ${member.nickname} (${member.id})`);
      notificationStore.showWarning(
        "탈퇴 처리 기능은 아직 구현되지 않았습니다."
      );
      return;
    }

    // 목록 새로고침
    await loadMembers();
  } catch (error) {
    console.error(`${action} 실패:`, error);
    notificationStore.showError(`${action}에 실패했습니다.`);
  } finally {
    isProcessing.value = false;
  }
};

const executeBatchAction = async () => {
  if (isProcessing.value || selectedMembers.value.length === 0) return;

  const action = currentFilter.value === "deleted" ? "복구" : "탈퇴처리";

  try {
    isProcessing.value = true;

    if (currentFilter.value === "deleted") {
      // 일괄 복구
      const promises = selectedMembers.value.map((memberId) =>
        AdminService.restoreMember(memberId)
      );
      await Promise.all(promises);
      notificationStore.showSuccess(
        `${selectedMembers.value.length}명이 복구되었습니다.`
      );
    } else {
      // 일괄 탈퇴 처리 (API가 없으므로 로그만 출력)
      console.log(`일괄 탈퇴 처리: ${selectedMembers.value}`);
      notificationStore.showWarning(
        "일괄 탈퇴 처리 기능은 아직 구현되지 않았습니다."
      );
      return;
    }

    // 선택 상태 초기화 및 목록 새로고침
    selectedMembers.value = [];
    isSelectionMode.value = false;
    await loadMembers();
  } catch (error) {
    console.error(`일괄 ${action} 실패:`, error);
    notificationStore.showError(`일괄 ${action}에 실패했습니다.`);
  } finally {
    isProcessing.value = false;
  }
};

const closeMemberList = () => {
  emit("close");
};

// 워처
watch(
  () => props.showMemberList,
  (newVal) => {
    if (newVal) {
      loadMembers();
    }
  }
);

// 마운트시 실행
onMounted(() => {
  if (props.showMemberList) {
    loadMembers();
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.admin-member-panel {
  position: fixed;
  top: $spacing-md;
  left: calc(300px + #{$spacing-md * 2}); // DevPanel 너비 + 간격 * 2
  z-index: $z-index-modal;
  width: 800px;
  max-height: 70vh; // 최대 높이 고정
  display: flex;
  flex-direction: column;
  transition: all $transition-normal;
}

.admin-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1px solid rgba($medium-gray, 0.3);
  margin-bottom: $spacing-md;
  flex-shrink: 0; // 헤더는 줄어들지 않음

  h4 {
    margin: 0;
    font-size: 0.9rem;
    color: $primary-color;
  }

  .close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;
    border-radius: 4px;
    transition: all $transition-fast;

    &:hover {
      background-color: rgba($error-color, 0.1);
    }

    svg {
      color: $dark-gray;
    }
  }
}

.admin-panel-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  flex: 1;
  min-height: 0; // flex 아이템이 줄어들 수 있도록 함
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  flex-shrink: 0; // 필터 섹션은 줄어들지 않음
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-buttons {
  display: flex;
  gap: $spacing-xs;
}

.filter-btn {
  @include glassmorphism(0.3, 5px);
  padding: $spacing-xs $spacing-sm;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all $transition-fast;
  color: $primary-color;

  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  &.active {
    background: rgba($accent-color, 0.8);
    color: white;
  }
}

.selection-toggle {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: $spacing-xs;
  cursor: pointer;
  transition: all $transition-fast;
  color: $primary-color;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background: rgba($primary-color, 0.1);
  }

  &.active {
    background: rgba($accent-color, 0.8);
    color: white;
  }

  svg {
    transition: all $transition-fast;
  }
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .selected-count {
    font-size: 0.75rem;
    color: $dark-gray;
  }

  .batch-action-btn {
    @include glassmorphism(0.3, 5px);
    padding: $spacing-xs $spacing-sm;
    border: none;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all $transition-fast;
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    &.restore {
      background: rgba($success-color, 0.8);
      color: white;

      &:hover {
        background: rgba($success-color, 0.9);
      }
    }

    &.delete {
      background: rgba($error-color, 0.8);
      color: white;

      &:hover {
        background: rgba($error-color, 0.9);
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-xl;
  color: $dark-gray;
  font-size: 0.8rem;

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba($primary-color, 0.2);
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.members-table-container {
  @include glassmorphism(0.2, 8px);
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  max-height: 400px; // 명시적 최대 높이 설정
}

.members-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 50px 2fr 2fr 50px 50px;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: rgba($primary-color, 0.05);
  font-weight: $font-weight-medium;
  font-size: 0.75rem;
  color: $primary-color;
  flex-shrink: 0;
  border-bottom: 1px solid rgba($medium-gray, 0.2);

  &:has(.checkbox-cell) {
    grid-template-columns: 40px 50px 2fr 2fr 60px 70px;
  }
}

.header-cell {
  padding: $spacing-xs;
  text-align: left;

  &.checkbox-cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.table-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: 320px; // 명시적 최대 높이 설정

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba($light-gray, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($dark-gray, 0.5);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba($primary-color, 0.6);
  }
}

.table-row {
  display: grid;
  grid-template-columns: 50px 2fr 2fr 50px 50px;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-bottom: 1px solid rgba($medium-gray, 0.2);
  transition: all $transition-fast;
  flex-shrink: 0;

  &:has(.checkbox-cell) {
    grid-template-columns: 40px 50px 2fr 2fr 60px 70px;
  }

  &:hover {
    background: rgba($primary-color, 0.02);
  }

  &.selected {
    background: rgba($accent-color, 0.1);
  }

  &:last-child {
    border-bottom: none;
  }
}

.table-cell {
  padding: $spacing-xs;
  font-size: 0.75rem;
  color: $primary-color;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.checkbox-cell {
    justify-content: center;
    overflow: visible;
  }
}

.member-checkbox {
  width: 14px;
  height: 14px;
  accent-color: $accent-color;
}

.status-badge {
  padding: 2px $spacing-xs;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: $font-weight-medium;
  text-align: center;
  white-space: nowrap;

  &.active {
    background: rgba($success-color, 0.2);
    color: $success-color;
  }

  &.deleted {
    background: rgba($error-color, 0.2);
    color: $error-color;
  }
}

.action-btn {
  @include glassmorphism(0.3, 5px);
  padding: 2px $spacing-xs;
  border: none;
  border-radius: 4px;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all $transition-fast;
  white-space: nowrap;
  text-align: center;

  &.restore {
    background: rgba($success-color, 0.8);
    color: white;

    &:hover {
      background: rgba($success-color, 0.9);
    }
  }

  &.delete {
    background: rgba($error-color, 0.8);
    color: white;

    &:hover {
      background: rgba($error-color, 0.9);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  color: $dark-gray;

  .empty-icon {
    font-size: 2rem;
    margin-bottom: $spacing-sm;
  }

  p {
    font-size: 0.8rem;
    margin: 0;
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-sm 0;
  flex-shrink: 0; // 페이지네이션은 줄어들지 않음

  .pagination-btn {
    @include glassmorphism(0.3, 5px);
    padding: $spacing-xs $spacing-sm;
    border: none;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all $transition-fast;
    color: $primary-color;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .page-info {
    font-size: 0.75rem;
    color: $dark-gray;
  }
}

/* 모바일 대응 */
@media (max-width: $breakpoint-lg) {
  .admin-member-panel {
    right: $spacing-sm;
    left: $spacing-sm;
    width: auto;
    max-height: 60vh;
  }

  .table-header,
  .table-row {
    grid-template-columns: 50px 2fr 2fr 50px 50px;
    font-size: 0.7rem;

    &:has(.checkbox-cell) {
      grid-template-columns: 50px 2fr 2fr 50px 50px;
    }
  }
}
</style>
