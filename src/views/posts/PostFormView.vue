<template>
  <div class="post-form">
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

    <form @submit.prevent="submitForm" class="post-form__form glass-card">
      <div class="post-form__group">
        <label for="boardType">게시판 유형</label>
        <div class="post-form__select-wrapper">
          <select
            id="boardType"
            v-model="formData.boardType"
            class="post-form__select"
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
              class="post-form__icon"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <div v-if="errors.boardType" class="post-form__error">
          {{ errors.boardType }}
        </div>
      </div>

      <div class="post-form__group">
        <label for="title">제목</label>
        <AppInput
          id="title"
          v-model="formData.title"
          placeholder="제목을 입력하세요"
          :invalid="!!errors.title"
          :error-message="errors.title"
          required
        />
      </div>

      <div class="post-form__group">
        <label for="description">요약</label>
        <AppInput
          id="description"
          v-model="formData.description"
          placeholder="게시글 내용을 간략하게 요약해주세요"
          :invalid="!!errors.description"
          :error-message="errors.description"
        />
      </div>

      <div class="post-form__group">
        <label>썸네일 이미지</label>
        <div class="post-form__thumbnail">
          <div
            class="post-form__thumbnail-preview"
            :class="{ 'has-image': formData.thumbNail }"
            @click="triggerFileInput"
          >
            <img
              v-if="formData.thumbNail"
              :src="formData.thumbNail"
              alt="썸네일 미리보기"
              @error="handleImageError"
            />
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
                class="post-form__icon post-form__icon-large"
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
            class="post-form__file-input"
            accept="image/*"
            @change="handleFileChange"
          />
          <AppButton
            v-if="formData.thumbNail"
            type="button"
            variant="outline"
            size="sm"
            @click.stop="removeImage"
            class="post-form__remove-image"
          >
            이미지 제거
          </AppButton>
        </div>
        <div v-if="errors.thumbNail" class="post-form__error">
          {{ errors.thumbNail }}
        </div>
      </div>

      <div class="post-form__group">
        <label for="content">내용</label>
        <div
          class="post-form__editor"
          :class="{ 'is-invalid': !!errors.content }"
        >
          <!-- 에디터 컴포넌트가 있다면 여기에 추가 -->
          <textarea
            id="content"
            v-model="formData.content"
            placeholder="내용을 입력하세요"
            rows="10"
            class="post-form__textarea"
          ></textarea>
        </div>
        <div v-if="errors.content" class="post-form__error">
          {{ errors.content }}
        </div>
      </div>

      <div class="post-form__submit">
        <AppButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          {{ isEditing ? "수정하기" : "작성하기" }}
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import PostService from "@/services/post.service";
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
const errors = reactive({});
const fileInput = ref(null);

// 폼 데이터
const formData = reactive({
  title: "",
  description: "",
  thumbNail: "",
  content: "",
  boardType: "GENERAL_FORUM",
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

    // 응답 구조 확인 및 수정
    if (response && response.data) {
      // API 응답이 중첩된 data 객체 없이 바로 게시글 데이터인 경우
      const post = response.data;

      // 폼 데이터 설정
      formData.title = post.title || "";
      formData.description = post.description || "";
      formData.thumbNail = post.thumbNail || "";
      formData.content = post.content || "";
      formData.boardType = post.boardType || "GENERAL_FORUM";
    } else {
      notificationStore.showError("게시글을 불러올 수 없습니다.");
      navigateBack();
    }
  } catch (error) {
    // 에러 로그 대신 알림 사용
    notificationStore.showError("게시글을 불러오는 중 오류가 발생했습니다.");

    navigateBack();
  }
};

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInput.value.click();
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
    errors.thumbNail =
      "이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WEBP)";
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
  fileInput.value.value = "";
  notificationStore.showInfo("이미지 제거 성공", { duration: 2000 });
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
  } else if (
    !["GENERAL_FORUM", "NOTICE", "QNA_FORUM"].includes(formData.boardType)
  ) {
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

  // 내용 검사
  if (!isRequired(formData.content)) {
    newErrors.content = "내용을 입력해주세요.";
  }

  // 오류 객체 업데이트
  Object.keys(errors).forEach((key) => delete errors[key]);
  Object.keys(newErrors).forEach((key) => {
    errors[key] = newErrors[key];
  });

  // 유효성 검사 실패 시 알림 표시
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
    // 현재 구현에서는 썸네일을 base64 문자열로 전송
    // 실제 구현에서는 이미지를 서버에 먼저 업로드하고 URL을 받아 사용할 수 있음

    // API 요청용 데이터 객체 준비
    const postData = {
      title: formData.title,
      description: formData.description,
      thumbNail: formData.thumbNail,
      content: formData.content,
      boardType: formData.boardType,
    };

    // 편집 모드에서는 postId 추가
    if (isEditing.value) {
      const postId = parseInt(route.params.id);
      postData.postId = postId; // PUT /posts 요청에 필요한 postId

      await PostService.updatePost(postData);
      notificationStore.showSuccess("게시글 수정 완료");
    } else {
      await PostService.createPost(postData);
      notificationStore.showSuccess("게시글 업로드 완료");
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
        // 로그인 페이지로 리다이렉트 등의 처리
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

// 컴포넌트 마운트 시 게시글 로드 (편집 모드인 경우)
onMounted(loadPost);
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.post-form {
  max-width: 900px;
  margin: 0 auto;
  padding: $spacing-lg;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    margin-bottom: $spacing-lg;
  }

  &__title {
    font-size: 1.5rem;
    color: $primary-color;
    margin: 0;
  }

  &__form {
    padding: $spacing-xl;
  }

  &__group {
    margin-bottom: $spacing-lg;

    label {
      display: block;
      margin-bottom: $spacing-sm;
      font-weight: $font-weight-medium;
      color: $primary-color;
    }
  }

  &__select-wrapper {
    position: relative;
  }

  &__select {
    width: 100%;
    padding: $spacing-md;
    border: 1px solid rgba($primary-color, 0.2);
    border-radius: 8px;
    background-color: transparent;
    color: $primary-color;
    font-family: inherit;
    font-size: 1rem;
    appearance: none;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $accent-color;
      box-shadow: 0 0 0 2px rgba($accent-color, 0.2);
    }

    &.is-invalid {
      border-color: $error-color;

      &:focus {
        box-shadow: 0 0 0 2px rgba($error-color, 0.2);
      }
    }
  }

  &__select-arrow {
    position: absolute;
    top: 50%;
    right: $spacing-md;
    transform: translateY(-50%);
    pointer-events: none;
    color: rgba($primary-color, 0.6);
  }

  &__thumbnail {
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
  }

  &__thumbnail-preview {
    width: 200px;
    height: 120px;
    border: 2px dashed rgba($primary-color, 0.3);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $accent-color;
    }

    &.has-image {
      border-style: solid;
      border-color: $accent-color;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__thumbnail-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba($primary-color, 0.5);

    .post-form__icon-large {
      width: 32px;
      height: 32px;
      margin-bottom: $spacing-xs;
    }

    span {
      font-size: 0.9rem;
    }
  }

  &__file-input {
    display: none;
  }

  &__editor {
    border: 1px solid rgba($primary-color, 0.2);
    border-radius: 8px;
    overflow: hidden;

    &.is-invalid {
      border-color: $error-color;
    }
  }

  &__textarea {
    width: 100%;
    padding: $spacing-md;
    border: none;
    resize: vertical;
    min-height: 300px;
    background: transparent;
    color: $primary-color;
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.6;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: rgba($primary-color, 0.5);
    }
  }

  &__error {
    margin-top: $spacing-xs;
    color: $error-color;
    font-size: 0.85rem;
  }

  &__submit {
    margin-top: $spacing-xl;
    display: flex;
    justify-content: center;
  }

  &__icon {
    width: 16px;
    height: 16px;
    stroke: currentColor;
  }
}

.back-btn {
  display: flex;
  align-items: center;

  .post-form__icon {
    margin-right: $spacing-xs;
  }
}
</style>
