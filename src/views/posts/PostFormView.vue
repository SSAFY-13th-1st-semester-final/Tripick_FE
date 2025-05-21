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
        <form @submit.prevent="submitForm" class="post-form__form glass-card">
          <!-- 게시판 유형 -->
          <div class="post-form__group">
            <label for="boardType" class="form-label">게시판 유형</label>
            <div class="post-form__select-wrapper">
              <select
                id="boardType"
                v-model="formData.boardType"
                class="post-form__select glass-input"
                :class="{ 'is-invalid': !!errors.boardType }"
              >
                <option value="GENERAL_FORUM">일반 게시판</option>
                <option value="NOTICE">공지사항</option>
                <option value="QNA_FORUM">Q&A 게시판</option>
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
              <span class="char-count">{{ formData.description.length }}/200</span>
            </div>
          </div>

          <!-- 썸네일 이미지 -->
          <div class="post-form__group">
            <label class="form-label">썸네일 이미지</label>
            <div class="post-form__thumbnail">
              <div
                class="post-form__thumbnail-preview glass-card"
                :class="{ 'has-image': formData.thumbNail, 'is-uploading': isThumbnailUploading }"
                @click="triggerFileInput"
              >
                <img
                  v-if="formData.thumbNail && !isThumbnailUploading"
                  :src="formData.thumbNail"
                  alt="썸네일 미리보기"
                  @error="handleImageError"
                />
                <div v-else-if="isThumbnailUploading" class="post-form__thumbnail-uploading">
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
                    class="animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>업로드 중...</span>
                </div>
                <div v-else class="post-form__thumbnail-placeholder">
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
                    class="thumbnail-icon"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span>이미지 선택</span>
                </div>
              </div>
              <input
                type="file"
                ref="fileInput"
                class="hidden-input"
                accept="image/*"
                @change="handleFileChange"
              />
              <div v-if="formData.thumbNail && !isThumbnailUploading" class="thumbnail-actions">
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  @click.stop="removeImage"
                >
                  이미지 제거
                </AppButton>
              </div>
            </div>
            <div v-if="errors.thumbNail" class="form-error">
              {{ errors.thumbNail }}
            </div>
          </div>

          <!-- 본문 에디터 -->
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

          <!-- 제출 버튼 -->
          <div class="post-form__submit">
            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              :loading="isSubmitting"
              :disabled="isSubmitting || !isFormValid || isThumbnailUploading"
              class="submit-btn"
            >
              {{ isEditing ? "수정하기" : "작성하기" }}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import PostService from "@/services/post.service";
import PostEditor from "@/components/posts/PostEditor.vue";
import AppInput from "@/components/common/shared/AppInput.vue";
import AppButton from "@/components/common/shared/AppButton.vue";
import { isRequired } from "@/utils/validators";

// 라우터 및 스토어
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

// 상태 정의
const isEditing = computed(() => !!route.params.id);
const isSubmitting = ref(false);
const isThumbnailUploading = ref(false);
const errors = reactive({});
const fileInput = ref(null);

// 에디터 키 (컴포넌트 재렌더링용)
const editorKey = computed(() => 
  isEditing.value ? `edit-${route.params.id}` : 'create'
);

// 폼 데이터
const formData = reactive({
  title: "",
  description: "",
  thumbNail: "",
  content: "",
  boardType: "GENERAL_FORUM",
});

// 폼 유효성 체크
const isFormValid = computed(() => {
  return (
    formData.title.trim() &&
    formData.content.trim() &&
    formData.boardType &&
    Object.keys(errors).length === 0 &&
    !isThumbnailUploading.value  // 썸네일 업로드 중이 아닐 때만 유효
  );
});

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
      formData.thumbNail = post.thumbNail || post.thumbnail || ""; // 두 가지 필드명 지원
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
    console.error("게시글 로드 오류:", error);
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
  // 자동 저장 또는 추가 처리 로직
  notificationStore.showInfo("내용이 저장되었습니다.");
};

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 파일 선택 처리
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 이미지 파일 타입 확인
  const validImageTypes = [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
  ];
  
  if (!validImageTypes.includes(file.type)) {
    errors.thumbNail = "이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WEBP)";
    notificationStore.showWarning("이미지 파일만 업로드 가능합니다.");
    return;
  }

  // 파일 크기 제한 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.thumbNail = "이미지 크기는 5MB 이하여야 합니다.";
    notificationStore.showWarning("이미지 크기는 5MB 이하여야 합니다.");
    return;
  }

  // 오류 메시지 초기화
  delete errors.thumbNail;

  // 파일을 Base64로 변환하여 미리보기 제공
  const reader = new FileReader();
  reader.onload = (e) => {
    formData.thumbNail = e.target.result;
    notificationStore.showSuccess("이미지 업로드 성공");
  };
  reader.readAsDataURL(file);
};

// 이미지 제거
const removeImage = () => {
  formData.thumbNail = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  delete errors.thumbNail;
  notificationStore.showInfo("이미지가 제거되었습니다.");
};

// 이미지 오류 처리
const handleImageError = () => {
  formData.thumbNail = "";
  notificationStore.showError("이미지 로드 중 문제가 발생했습니다.");
};

// 유효성 검사
const validateForm = () => {
  const newErrors = {};

  // 게시판 유형 검사
  if (!isRequired(formData.boardType)) {
    newErrors.boardType = "게시판 유형을 선택해주세요.";
  } else if (!["GENERAL_FORUM", "NOTICE", "QNA_FORUM"].includes(formData.boardType)) {
    newErrors.boardType = "유효하지 않은 게시판 유형입니다.";
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
  const plainTextContent = formData.content.replace(/<[^>]*>/g, '').trim();
  if (!plainTextContent) {
    newErrors.content = "내용을 입력해주세요.";
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

// 폼 제출
const submitForm = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    const postData = {
      title: formData.title,
      description: formData.description,
      thumbNail: formData.thumbNail,
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
        notificationStore.showError("로그인이 필요하거나 세션이 만료되었습니다.");
      } else if (status === 403) {
        notificationStore.showError("게시글 수정 권한이 없습니다.");
      } else if (status === 400) {
        notificationStore.showWarning("잘못된 요청입니다. 입력 내용을 확인해주세요.");
      } else {
        notificationStore.showError(
          isEditing.value ? "게시글 수정에 실패했습니다." : "게시글 작성에 실패했습니다."
        );
      }
    } else {
      notificationStore.showError(
        isEditing.value ? "게시글 수정에 실패했습니다." : "게시글 작성에 실패했습니다."
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

// 컴포넌트 마운트 시 게시글 로드 (편집 모드인 경우)
onMounted(loadPost);
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
    max-width: 1200px; // 900px -> 1200px로 확대
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-xl;
    margin-bottom: $spacing-lg;

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

  &__thumbnail {
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
    flex-wrap: wrap;
  }

  &__thumbnail-preview {
    width: 240px;
    height: 160px;
    border: 2px dashed rgba($primary-color, 0.3);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all $transition-normal;

    &:hover {
      border-color: $accent-color;
      transform: translateY(-2px);
    }

    &.has-image {
      border-style: solid;
      border-color: $accent-color;
    }

    &.is-uploading {
      cursor: not-allowed;
      opacity: 0.7;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: $breakpoint-md) {
      width: 200px;
      height: 120px;
    }
  }

  &__thumbnail-uploading {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: $accent-color;
    opacity: 0.8;

    svg {
      margin-bottom: $spacing-sm;
    }

    span {
      font-size: 0.875rem;
      font-weight: $font-weight-medium;
    }
  }

  &__thumbnail-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: $primary-color;
    opacity: 0.6;

    .thumbnail-icon {
      margin-bottom: $spacing-sm;
    }

    span {
      font-size: 0.875rem;
      font-weight: $font-weight-medium;
    }
  }

  &__editor-wrapper {
    // PostEditor 컴포넌트가 자체 스타일링을 가지므로 최소한의 래퍼만 제공
    border-radius: 12px;
    overflow: hidden;
  }

  &__submit {
    margin-top: $spacing-2xl;
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

.thumbnail-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.hidden-input {
  display: none;
}

// 반응형 조정
@media (max-width: $breakpoint-md) {
  .post-form {
    padding: $spacing-lg 0;

    &__thumbnail {
      flex-direction: column;
      align-items: center;
    }

    &__thumbnail-preview {
      order: 1;
    }

    .thumbnail-actions {
      order: 2;
      justify-content: center;
    }
  }
}

// 스핀 애니메이션
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>