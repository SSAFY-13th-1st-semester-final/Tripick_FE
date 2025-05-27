<template>
  <div class="post-form-page">
    <div class="app-background"></div>
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <div class="post-form">
      <div class="container">
        <!-- 헤더 -->
        <div class="post-form__header glass-card">
          <h1 class="post-form__title">
            {{ isEditing ? "게시글 수정" : "게시글 작성" }}
          </h1>
          <div class="post-form__actions">
            <AppButton
              @click="navigateBack"
              variant="ghost"
              size="sm"
              class="back-btn"
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
                class="post-form__icon"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              취소
            </AppButton>
          </div>
        </div>

        <!-- 폼 영역 -->
        <form
          @submit.prevent="handleFormSubmit"
          class="post-form__form glass-card"
        >
          <!-- 게시판 유형 -->
          <div class="post-form__group">
            <label for="boardType" class="form-label">게시판 유형</label>
            <div class="post-form__select-wrapper">
              <select
                id="boardType"
                v-model="formData.boardType"
                class="post-form__select glass-input"
                :class="{ 'is-invalid': !!errors.boardType }"
                :disabled="boardsLoading"
              >
                <option value="" disabled>
                  {{
                    boardsLoading
                      ? "게시판 목록 로딩 중..."
                      : "게시판을 선택하세요"
                  }}
                </option>
                <option
                  v-for="board in filteredBoards"
                  :key="board.id"
                  :value="board.name"
                >
                  {{ getBoardDisplayName(board.name) }}
                </option>
              </select>
              <div class="post-form__select-arrow">
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
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            <div v-if="errors.boardType" class="form-error">
              {{ errors.boardType }}
            </div>
          </div>

          <!-- 제목 -->
          <div class="post-form__group">
            <label for="title" class="form-label">제목</label>
            <AppInput
              id="title"
              v-model="formData.title"
              placeholder="제목을 입력하세요"
              :invalid="!!errors.title"
              :error-message="errors.title"
              maxlength="100"
              required
              class="glass-input"
            />
            <div class="input-helper">
              <span class="char-count">{{ formData.title.length }}/100</span>
            </div>
          </div>

          <!-- 요약 -->
          <div class="post-form__group">
            <label for="description" class="form-label">요약</label>
            <AppInput
              id="description"
              v-model="formData.description"
              placeholder="게시글 내용을 간략하게 요약해주세요"
              :invalid="!!errors.description"
              :error-message="errors.description"
              maxlength="200"
              class="glass-input"
            />
            <div class="input-helper">
              <span class="char-count"
                >{{ formData.description.length }}/200</span
              >
            </div>
          </div>

          <!-- 썸네일 이미지 (새로운 컴포넌트 사용) -->
          <div class="post-form__group">
            <ThumbnailUploader
              :initial-image="formData.thumbnail"
              :disabled="isSubmitting"
              @update:imageUrl="handleThumbnailUpdate"
              @upload-start="handleThumbnailUploadStart"
              @upload-end="handleThumbnailUploadEnd"
              @upload-error="handleThumbnailUploadError"
            />
            <div v-if="errors.thumbnail" class="form-error">
              {{ errors.thumbnail }}
            </div>
          </div>
        </form>

        <!-- 본문 에디터 - 폼 외부로 이동 -->
        <div class="post-form__editor-container glass-card">
          <div class="post-form__group">
            <label class="form-label">본문</label>
            <div class="post-form__editor-wrapper">
              <PostEditor
                :key="editorKey"
                :initial-content="formData.content"
                placeholder="여행 경험을 자유롭게 공유해주세요..."
                @update:content="updateContent"
                @save="handleEditorSave"
              />
            </div>
            <div v-if="errors.content" class="form-error">
              {{ errors.content }}
            </div>
          </div>
        </div>

        <!-- 제출 버튼 -->
        <div class="post-form__submit glass-card">
          <AppButton
            @click="submitForm"
            variant="primary"
            size="lg"
            :loading="isSubmitting"
            :disabled="isSubmitting || !isFormValid || isThumbnailUploading"
            class="submit-btn"
          >
            {{ isEditing ? "수정하기" : "작성하기" }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { useAuthStore } from "@/stores/auth";
import PostService from "@/services/post.service";
import BoardService from "@/services/board.service";
import PostEditor from "@/components/posts/PostEditor.vue";
import ThumbnailUploader from "@/components/posts/ThumbnailUploader.vue";
import AppInput from "@/components/common/shared/AppInput.vue";
import AppButton from "@/components/common/shared/AppButton.vue";
import { isRequired } from "@/utils/validators";

// 라우터 및 스토어
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

// 상태 정의
const isEditing = computed(() => !!route.params.id);
const isSubmitting = ref(false);
const isThumbnailUploading = ref(false);
const boardsLoading = ref(false);
const errors = reactive({});

// 게시판 목록 관련 상태
const boards = ref([]);

// 에디터 키 (컴포넌트 재렌더링용)
const editorKey = computed(() =>
  isEditing.value ? `edit-${route.params.id}` : "create"
);

// 폼 데이터
const formData = reactive({
  title: "",
  description: "",
  thumbnail: "",
  content: "",
  boardType: "",
});

// 게시판 타입 한글 매핑
const boardTypeMap = {
  GENERAL_FORUM: "자유게시판",
  NOTICE: "공지사항",
  QNA_FORUM: "Q&A",
  TRIP_FORUM: "여행 후기",
};

// 게시판 표시명 가져오기
const getBoardDisplayName = (boardName) => {
  return boardTypeMap[boardName] || boardName;
};

// 관리자가 아닌 경우 공지사항 제외한 게시판 목록
const filteredBoards = computed(() => {
  if (authStore.isAdmin) {
    return boards.value;
  }
  return boards.value.filter((board) => board.name !== "NOTICE");
});

// 폼 유효성 체크
const isFormValid = computed(() => {
  return (
    formData.title.trim() &&
    formData.content.trim() &&
    formData.boardType &&
    Object.keys(errors).length === 0 &&
    !isThumbnailUploading.value &&
    !boardsLoading.value
  );
});

// 게시판 목록 조회
const loadBoards = async () => {
  boardsLoading.value = true;

  try {
    const response = await BoardService.getBoards();

    if (response && response.data) {
      boards.value = response.data;

      // 기본값 설정 (자유게시판)
      if (!isEditing.value && boards.value.length > 0) {
        const generalBoard = boards.value.find(
          (board) => board.name === "GENERAL_FORUM"
        );
        if (generalBoard) {
          formData.boardType = generalBoard.name;
        } else if (filteredBoards.value.length > 0) {
          formData.boardType = filteredBoards.value[0].name;
        }
      }
    } else {
      notificationStore.showError("게시판 목록을 불러올 수 없습니다.");
    }
  } catch (error) {
    console.error("게시판 목록 조회 오류:", error);
    notificationStore.showError(
      "게시판 목록을 불러오는 중 오류가 발생했습니다."
    );

    // 오류 발생 시 기본 게시판 목록 사용
    boards.value = [
      { id: 1, name: "GENERAL_FORUM", description: "자유게시판" },
      { id: 2, name: "QNA_FORUM", description: "Q&A" },
      { id: 3, name: "TRIP_FORUM", description: "여행 후기" },
    ];

    if (authStore.isAdmin) {
      boards.value.push({ id: 4, name: "NOTICE", description: "공지사항" });
    }

    formData.boardType = "GENERAL_FORUM";
  } finally {
    boardsLoading.value = false;
  }
};

// 썸네일 업로드 이벤트 핸들러들
const handleThumbnailUpdate = (imageUrl) => {
  formData.thumbnail = imageUrl;
  // 썸네일 관련 오류 메시지 제거
  if (errors.thumbnail) {
    delete errors.thumbnail;
  }
};

const handleThumbnailUploadStart = () => {
  isThumbnailUploading.value = true;
  notificationStore.showInfo("이미지 업로드 중입니다...");
};

const handleThumbnailUploadEnd = (imageUrl) => {
  isThumbnailUploading.value = false;
  formData.thumbnail = imageUrl;

  // 오류 메시지 제거
  if (errors.thumbnail) {
    delete errors.thumbnail;
  }
};

const handleThumbnailUploadError = (error) => {
  isThumbnailUploading.value = false;
  errors.thumbnail = error.message || "이미지 업로드에 실패했습니다.";
};

// 편집 모드에서 게시글 로드
const loadPost = async () => {
  if (!isEditing.value) return;

  const postId = parseInt(route.params.id);

  if (isNaN(postId)) {
    notificationStore.showError("게시글 접근 권한이 없습니다.");
    navigateBack();
    return;
  }

  try {
    const response = await PostService.getPostById(postId);

    if (response && response.data) {
      const post = response.data;

      // 폼 데이터를 순차적으로 설정
      formData.title = post.title || "";
      formData.description = post.description || "";
      formData.thumbnail = post.thumbnail || "";
      formData.boardType = post.boardType || "GENERAL_FORUM";

      // 내용은 마지막에 설정 (에디터 초기화 후)
      setTimeout(() => {
        formData.content = post.content || "";
      }, 100);
    } else {
      notificationStore.showError("게시글을 불러올 수 없습니다.");
      navigateBack();
    }
  } catch (error) {
    notificationStore.showError("게시글을 불러오는 중 오류가 발생했습니다.");
    navigateBack();
  }
};

// 에디터 내용 업데이트
const updateContent = (htmlContent) => {
  formData.content = htmlContent;
  // 내용 유효성 검사
  if (errors.content && htmlContent.trim()) {
    delete errors.content;
  }
};

// 에디터에서 저장 버튼 클릭 시
const handleEditorSave = (editorData) => {
  formData.content = editorData.content;
  notificationStore.showInfo("내용이 저장되었습니다.");
};

// 폼 제출 핸들러 (실제 버튼 클릭이 아닌 경우 무시)
const handleFormSubmit = (event) => {
  event.preventDefault();
  // 폼 내부의 의도하지 않은 submit 이벤트는 무시
};

// 유효성 검사
const validateForm = () => {
  const newErrors = {};

  // 게시판 유형 검사
  if (!isRequired(formData.boardType)) {
    newErrors.boardType = "게시판 유형을 선택해주세요.";
  } else {
    // 동적으로 로드된 게시판 목록에서 유효성 검사
    const validBoardTypes = boards.value.map((board) => board.name);
    if (!validBoardTypes.includes(formData.boardType)) {
      newErrors.boardType = "유효하지 않은 게시판 유형입니다.";
    }

    // 관리자가 아닌 경우 공지사항 선택 불가
    if (!authStore.isAdmin && formData.boardType === "NOTICE") {
      newErrors.boardType = "공지사항은 관리자만 작성할 수 있습니다.";
    }
  }

  // 제목 검사
  if (!isRequired(formData.title)) {
    newErrors.title = "제목을 입력해주세요.";
  } else if (formData.title.length > 100) {
    newErrors.title = "제목은 100자 이내로 입력해주세요.";
  }

  // 요약 검사
  if (formData.description && formData.description.length > 200) {
    newErrors.description = "요약은 200자 이내로 입력해주세요.";
  }

  // 내용 검사 - HTML 태그 제거 후 검사
  const plainTextContent = formData.content.replace(/<[^>]*>/g, "").trim();
  if (!plainTextContent) {
    newErrors.content = "내용을 입력해주세요.";
  }

  // 썸네일 업로드 중 확인
  if (isThumbnailUploading.value) {
    newErrors.thumbnail = "이미지 업로드가 완료될 때까지 기다려주세요.";
  }

  // 게시판 로딩 중 확인
  if (boardsLoading.value) {
    newErrors.boardType = "게시판 목록을 불러오는 중입니다. 잠시 기다려주세요.";
  }

  // 오류 객체 업데이트
  Object.keys(errors).forEach((key) => delete errors[key]);
  Object.keys(newErrors).forEach((key) => {
    errors[key] = newErrors[key];
  });

  if (Object.keys(newErrors).length > 0) {
    notificationStore.showWarning("입력 내용을 확인해주세요.");
  }

  return Object.keys(newErrors).length === 0;
};

// 실제 폼 제출 (버튼 클릭 시만 실행)
const submitForm = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    const postData = {
      title: formData.title,
      description: formData.description,
      thumbnail: formData.thumbnail, // 이제 업로드된 이미지 URL
      content: formData.content,
      boardType: formData.boardType,
    };

    if (isEditing.value) {
      const postId = parseInt(route.params.id);
      postData.postId = postId;

      await PostService.updatePost(postData);
      notificationStore.showSuccess("게시글이 성공적으로 수정되었습니다.");
    } else {
      await PostService.createPost(postData);
      notificationStore.showSuccess("게시글이 성공적으로 작성되었습니다.");
    }

    // 게시글 목록으로 이동
    router.push({ name: "posts-list" });
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        notificationStore.showError(
          "로그인이 필요하거나 세션이 만료되었습니다."
        );
      } else if (status === 403) {
        notificationStore.showError("게시글 수정 권한이 없습니다.");
      } else if (status === 400) {
        notificationStore.showWarning(
          "잘못된 요청입니다. 입력 내용을 확인해주세요."
        );
      } else {
        notificationStore.showError(
          isEditing.value
            ? "게시글 수정에 실패했습니다."
            : "게시글 작성에 실패했습니다."
        );
      }
    } else {
      notificationStore.showError(
        isEditing.value
          ? "게시글 수정에 실패했습니다."
          : "게시글 작성에 실패했습니다."
      );
    }
  } finally {
    isSubmitting.value = false;
  }
};

// 뒤로 가기
const navigateBack = () => {
  router.go(-1);
};

// 컴포넌트 마운트 시 초기화
onMounted(async () => {
  // 게시판 목록을 먼저 로드
  await loadBoards();

  // 편집 모드인 경우 게시글 로드
  if (isEditing.value) {
    await loadPost();
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.post-form-page {
  position: relative;
  min-height: 100vh;
}

.post-form {
  min-height: 100vh;
  padding: $spacing-xl 0;

  .container {
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-xl;

    @media (max-width: $breakpoint-md) {
      padding: $spacing-lg;
      flex-direction: column;
      gap: $spacing-md;
      text-align: center;
    }
  }

  &__title {
    font-size: 1.75rem;
    color: $primary-color;
    margin: 0;
    font-weight: $font-weight-bold;
  }

  &__actions {
    .back-btn {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
    }
  }

  &__form {
    padding: $spacing-xl;

    @media (max-width: $breakpoint-md) {
      padding: $spacing-lg;
    }
  }

  &__editor-container {
    padding: $spacing-xl;

    @media (max-width: $breakpoint-md) {
      padding: $spacing-lg;
    }
  }

  &__group {
    margin-bottom: $spacing-xl;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__select-wrapper {
    position: relative;
  }

  &__select {
    width: 100%;
    appearance: none;
    cursor: pointer;
    padding-right: 3rem;

    &:focus {
      outline: none;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.is-invalid {
      border-color: $error-color;

      &:focus {
        box-shadow: 0 4px 16px rgba($error-color, 0.2);
      }
    }
  }

  &__select-arrow {
    position: absolute;
    top: 50%;
    right: $spacing-md;
    transform: translateY(-50%);
    pointer-events: none;
    color: $primary-color;
    opacity: 0.6;
  }

  &__editor-wrapper {
    border-radius: 12px;
    overflow: hidden;
  }

  &__submit {
    padding: $spacing-xl;
    display: flex;
    justify-content: center;

    .submit-btn {
      min-width: 200px;

      @media (max-width: $breakpoint-md) {
        width: 100%;
      }
    }
  }

  &__icon {
    width: 16px;
    height: 16px;
  }
}

// 공통 폼 요소들
.form-label {
  display: block;
  margin-bottom: $spacing-sm;
  font-weight: $font-weight-medium;
  color: $primary-color;
  font-size: 1rem;
}

.form-error {
  margin-top: $spacing-sm;
  color: $error-color;
  font-size: 0.875rem;
  font-weight: $font-weight-medium;
}

.input-helper {
  margin-top: $spacing-sm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: $dark-gray;

  .char-count {
    margin-left: auto;
  }
}

// 반응형 조정
@media (max-width: $breakpoint-md) {
  .post-form {
    padding: $spacing-lg 0;
  }
}
</style>
