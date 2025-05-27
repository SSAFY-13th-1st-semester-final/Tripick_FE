<template>
  <div class="profile-page">
    <h1 class="profile-title">마이 페이지</h1>

    <!-- 메인 컨텐츠 영역 - 3컬럼 수평 배치 -->
    <div class="profile-main-content">
      <!-- 유저 프로필 컴포넌트 -->
      <div class="profile-section">
        <UserProfile
          :userData="userData"
          :loading="isLoading"
          :isSaving="isSaving"
          :errors="errors"
          @update:userData="updateEditData"
          @imageSelected="handleImageSelected"
          @validateField="handleValidationError"
          @save="saveChanges"
          @passwordChange="redirectToPasswordChange"
          @logout="logout"
          @deleteAccount="confirmDeleteAccount"
        />
      </div>

      <!-- 내 게시글 리스트 컴포넌트 -->
      <div class="posts-section">
        <MyPostsList
          :posts="myPosts"
          :loading="isPostsLoading"
          :hasMore="hasMorePosts"
          @loadMore="loadMorePosts"
          @deletePosts="handleDeletePosts"
        />
      </div>

      <!-- 내 여행 기록 리스트 컴포넌트 -->
      <div class="trip-history-section">
        <MyTripHistoryList
          :trips="myTrips"
          :loading="isTripHistoryLoading"
          :hasMore="hasMoreTrips"
          :totalElements="totalTripElements"
          @loadMore="loadMoreTrips"
          @tripClicked="handleTripClicked"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import AuthService from "@/services/auth.service";
import PostService from "@/services/post.service";
import travelService from "@/services/travel.service";
import apiClient from "@/services/api.service";
import UserProfile from "@/components/user/UserProfile.vue";
import MyPostsList from "@/components/user/MyPostsList.vue";
import MyTripHistoryList from "@/components/user/MyTripHistoryList.vue";
import {
  isValidEmail,
  isValidPhoneNumber,
  isRequired,
} from "@/utils/validators";

// 라우터와 스토어 설정
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// 사용자 정보 상태
const userData = ref({});
const isLoading = ref(true);
const isSaving = ref(false);
const errors = reactive({});
const profileImageFile = ref(null);
const profileImagePreview = ref(null);

// 게시글 관련 상태
const myPosts = ref([]);
const isPostsLoading = ref(false);
const hasMorePosts = ref(true);
const currentPage = ref(0);
const pageSize = ref(10); // 페이지당 게시글 수
const totalPages = ref(0);
const totalElements = ref(0);

// 여행 기록 관련 상태
const myTrips = ref([]);
const isTripHistoryLoading = ref(false);
const hasMoreTrips = ref(true);
const currentTripPage = ref(0);
const tripPageSize = ref(10); // 페이지당 여행 기록 수
const totalTripPages = ref(0);
const totalTripElements = ref(0);

// 편집을 위한 데이터
const editData = reactive({
  nickname: "",
  email: "",
  phoneNumber: "",
});

// 사용자 정보 불러오기
const fetchUserData = async () => {
  isLoading.value = true;

  try {
    const response = await AuthService.getCurrentUser();

    if (response.data && response.data.data) {
      userData.value = response.data.data;
      updateEditData(userData.value);
    }
  } catch (error) {
    notificationStore.showError("사용자 정보를 불러오는데 실패했습니다.");
  } finally {
    isLoading.value = false;
  }
};

// 내 게시글 불러오기
const fetchMyPosts = async (page = 0, reset = false) => {
  if (isPostsLoading.value) return;

  isPostsLoading.value = true;

  try {
    // 페이징 파라미터 설정
    const params = {
      page: page,
      size: pageSize.value,
    };

    const response = await PostService.getAllMyPosts(params);

    if (response && response.data && response.data.data) {
      const postsData = response.data.data;
      const newPosts = postsData.content || [];

      if (reset || page === 0) {
        myPosts.value = newPosts;
      } else {
        myPosts.value.push(...newPosts);
      }

      // 페이지 정보 업데이트
      currentPage.value = postsData.number || 0;
      totalPages.value = postsData.totalPages || 0;
      totalElements.value = postsData.totalElements || 0;
      hasMorePosts.value =
        !postsData.last && currentPage.value + 1 < totalPages.value;
    }
  } catch (error) {
    // 에러 메시지 세분화
    let errorMessage = "게시글을 불러오는데 실패했습니다.";
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = "로그인이 필요합니다.";
          break;
        case 403:
          errorMessage = "게시글에 접근할 권한이 없습니다.";
          break;
        case 404:
          errorMessage = "요청한 페이지를 찾을 수 없습니다.";
          break;
        case 500:
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          break;
      }
    }

    notificationStore.showError(errorMessage);

    // 첫 페이지 로딩 실패 시에만 hasMore를 false로 설정
    if (page === 0) {
      hasMorePosts.value = false;
    }
  } finally {
    isPostsLoading.value = false;
  }
};

// 내 여행 기록 불러오기
const fetchMyTripHistory = async (page = 0, reset = false) => {
  if (isTripHistoryLoading.value) return;

  isTripHistoryLoading.value = true;

  try {
    // 페이징 파라미터 설정
    const params = {
      page: page,
      size: tripPageSize.value,
    };

    const response = await PostService.getAllMyTripHistory(params);

    if (response && response.data && response.data.data) {
      const tripData = response.data.data;
      const newTrips = tripData.content || [];

      if (reset || page === 0) {
        myTrips.value = newTrips;
      } else {
        myTrips.value.push(...newTrips);
      }

      // 페이지 정보 업데이트
      currentTripPage.value = tripData.number || 0;
      totalTripPages.value = tripData.totalPages || 0;
      totalTripElements.value = tripData.totalElements || 0;
      hasMoreTrips.value =
        !tripData.last && currentTripPage.value + 1 < totalTripPages.value;
    }
  } catch (error) {
    // 에러 메시지 세분화
    let errorMessage = "여행 기록을 불러오는데 실패했습니다.";
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = "로그인이 필요합니다.";
          break;
        case 403:
          errorMessage = "여행 기록에 접근할 권한이 없습니다.";
          break;
        case 404:
          errorMessage = "요청한 페이지를 찾을 수 없습니다.";
          break;
        case 500:
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          break;
      }
    }

    notificationStore.showError(errorMessage);

    // 첫 페이지 로딩 실패 시에만 hasMore를 false로 설정
    if (page === 0) {
      hasMoreTrips.value = false;
    }
  } finally {
    isTripHistoryLoading.value = false;
  }
};

// 더 많은 게시글 로드 (무한스크롤용)
const loadMorePosts = () => {
  if (hasMorePosts.value && !isPostsLoading.value) {
    fetchMyPosts(currentPage.value + 1);
  }
};

// 더 많은 여행 기록 로드 (무한스크롤용)
const loadMoreTrips = () => {
  if (hasMoreTrips.value && !isTripHistoryLoading.value) {
    fetchMyTripHistory(currentTripPage.value + 1);
  }
};

// 여행 기록 클릭 처리
const handleTripClicked = async (tripId) => {
  try {
    const result = await travelService.searchTripInfo(tripId);

    if (result.success) {
      router.push({ name: "travel-planner" });
    } else {
      notificationStore.showError("여행 정보를 불러오는데 실패했습니다.");
    }
  } catch (error) {
    notificationStore.showError("여행 지도로 이동하는 중 오류가 발생했습니다.");
  }
};

// UserProfile에서 데이터 업데이트
const updateEditData = (data) => {
  Object.assign(editData, {
    nickname: data.nickname || "",
    email: data.email || "",
    phoneNumber: data.phoneNumber || "",
  });
};

// 이미지 선택 처리
const handleImageSelected = ({ file, previewUrl }) => {
  if (profileImagePreview.value) {
    URL.revokeObjectURL(profileImagePreview.value);
  }

  profileImageFile.value = file;
  profileImagePreview.value = previewUrl;
};

// 유효성 검사 오류 처리
const handleValidationError = ({ field, error }) => {
  if (error) {
    errors[field] = error;
  } else {
    delete errors[field];
  }
  if (error) {
    notificationStore.showError(error);
  }
};

// 유효성 검사
const validateForm = (data) => {
  const newErrors = {};

  if (data.email && !isValidEmail(data.email)) {
    newErrors.email = "올바른 이메일 형식이 아닙니다.";
  }

  if (data.phoneNumber && !isValidPhoneNumber(data.phoneNumber)) {
    newErrors.phoneNumber =
      "올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)";
  }

  Object.keys(errors).forEach((key) => delete errors[key]);
  Object.keys(newErrors).forEach((key) => {
    errors[key] = newErrors[key];
  });

  return Object.keys(newErrors).length === 0;
};

// 변경사항 저장
const saveChanges = async (saveData) => {
  if (!validateForm(saveData)) return;

  isSaving.value = true;

  try {
    const formData = new FormData();

    const requestData = {
      nickname: saveData.nickname,
      email: saveData.email,
      phoneNumber: saveData.phoneNumber,
    };

    formData.append(
      "request",
      new Blob([JSON.stringify(requestData)], {
        type: "application/json",
      })
    );

    if (saveData.profileImageFile) {
      formData.append("profileImage", saveData.profileImageFile);
    }

    const response = await apiClient.put("/member", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    await fetchUserData();

    profileImageFile.value = null;
    if (profileImagePreview.value) {
      URL.revokeObjectURL(profileImagePreview.value);
      profileImagePreview.value = null;
    }

    notificationStore.showSuccess("정보가 성공적으로 업데이트되었습니다.");
  } catch (error) {
    let errorMessage = "정보 업데이트에 실패했습니다.";
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }

    notificationStore.showError(errorMessage);
  } finally {
    isSaving.value = false;
  }
};

// 게시글 삭제 처리 (단일/다중 모두 처리)
const handleDeletePosts = async (postIds) => {
  if (!postIds || postIds.length === 0) {
    notificationStore.showWarning("삭제할 게시글이 선택되지 않았습니다.");
    return;
  }

  // 삭제 확인 다이얼로그
  const confirmMessage =
    postIds.length === 1
      ? "이 게시글을 삭제하시겠습니까?"
      : `선택된 ${postIds.length}개의 게시글을 삭제하시겠습니까?`;

  if (!window.confirm(confirmMessage)) {
    return;
  }

  try {
    // 모든 게시글 삭제 요청을 병렬로 처리
    const deletePromises = postIds.map((postId) =>
      PostService.deletePost(postId)
        .then(() => ({ postId, success: true }))
        .catch((error) => ({ postId, success: false, error }))
    );

    // 모든 요청이 완료될 때까지 대기 (일부 실패해도 계속 진행)
    const results = await Promise.allSettled(deletePromises);

    // 성공한 삭제 결과들 추출
    const successfulDeletes = results
      .filter((result) => result.status === "fulfilled" && result.value.success)
      .map((result) => result.value.postId);

    const failedDeletes = results
      .filter(
        (result) => result.status === "fulfilled" && !result.value.success
      )
      .map((result) => result.value.postId);

    // 성공한 게시글들을 목록에서 제거
    if (successfulDeletes.length > 0) {
      myPosts.value = myPosts.value.filter(
        (post) => !successfulDeletes.includes(post.postId)
      );
    }

    // 결과에 따른 알림 메시지
    if (successfulDeletes.length === postIds.length) {
      // 모든 게시글이 성공적으로 삭제됨
      const message =
        postIds.length === 1
          ? "게시글이 성공적으로 삭제되었습니다."
          : `${successfulDeletes.length}개의 게시글이 성공적으로 삭제되었습니다.`;
      notificationStore.showSuccess(message);
    } else if (successfulDeletes.length > 0) {
      // 일부만 성공
      notificationStore.showWarning(
        `${successfulDeletes.length}개의 게시글이 삭제되었습니다. ${failedDeletes.length}개의 게시글 삭제에 실패했습니다.`
      );
    } else {
      // 모든 게시글 삭제 실패
      const message =
        postIds.length === 1
          ? "게시글 삭제에 실패했습니다."
          : "선택된 게시글 삭제에 실패했습니다.";
      notificationStore.showError(message);
    }

    // 삭제 후 게시글 목록 새로고침 (필요시)
    // 성공적으로 삭제된 게시글이 있다면 전체 목록을 새로고침하여 동기화
    if (successfulDeletes.length > 0) {
      // 첫 페이지부터 다시 로드하여 전체 목록 동기화
      currentPage.value = 0;
      await fetchMyPosts(0, true);
    }
  } catch (error) {
    notificationStore.showError("게시글 삭제 중 오류가 발생했습니다.");
  }
};

// 비밀번호 변경 페이지로 이동
const redirectToPasswordChange = () => {
  router.push({
    name: "change-password",
    params: { email: userData.value.email },
  });
};

// 로그아웃
const logout = async () => {
  try {
    await authStore.logout();
    router.push({ name: "home" });
  } catch (error) {
    return null;
  }
};

// 회원 탈퇴 확인
const confirmDeleteAccount = () => {
  if (
    window.confirm(
      "정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    )
  ) {
    deleteAccount();
  }
};

// 회원 탈퇴 처리
const deleteAccount = async () => {
  try {
    await AuthService.deleteMember();

    await authStore.logout();
    notificationStore.showSuccess("회원 탈퇴가 완료되었습니다.");
    router.push({ name: "home" });
  } catch (error) {
    notificationStore.showError("회원 탈퇴에 실패했습니다.");
  }
};

// 컴포넌트 마운트 시 데이터 불러오기
onMounted(async () => {
  await Promise.all([
    fetchUserData(),
    fetchMyPosts(0, true),
    fetchMyTripHistory(0, true),
  ]);
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.profile-page {
  padding: $spacing-lg;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 2400px;
  margin: 0 auto;
}

.profile-title {
  color: $primary-color;
  text-align: center;
  margin-bottom: $spacing-xl;
  font-weight: $font-weight-bold;
  font-size: 2rem;

  @media (max-width: $breakpoint-md) {
    font-size: 1.75rem;
    margin-bottom: $spacing-lg;
  }
}

.profile-main-content {
  display: grid;
  grid-template-columns: 300px 1fr 1fr;
  gap: $spacing-xl;
  width: 100%;
  align-items: flex-start;

  @media (max-width: $breakpoint-lg) {
    grid-template-columns: 1fr;
    gap: $spacing-lg;
  }
}

.profile-main-content {
  display: grid;
  grid-template-columns: 600px 1fr 1fr;
  gap: $spacing-xl;
  width: 100%;
  align-items: flex-start;

  @media (max-width: $breakpoint-lg) {
    grid-template-columns: 1fr;
    gap: $spacing-lg;
  }
}

.profile-section {
  width: 100%;
  height: 500px; // 다른 두 컴포넌트와 동일한 높이 지정

  @media (max-width: $breakpoint-lg) {
    max-width: 800px;
    margin: 0 auto;
    height: auto; // 모바일에서는 자동 높이
  }

  @media (max-width: $breakpoint-md) {
    height: auto; // 작은 화면에서는 자동 높이
  }

  // UserProfile 컴포넌트 스타일 오버라이드
  :deep(.user-profile-container) {
    padding: 0;
    margin: 0;
    max-width: none;
    height: 100%; // 부모 높이에 맞춤
  }

  :deep(.user-profile) {
    height: 100%; // 부모 높이에 맞춤
    display: flex;
    flex-direction: column;

    @media (max-width: $breakpoint-lg) {
      height: auto; // 모바일에서는 자동 높이
    }
  }
}

.posts-section,
.trip-history-section {
  width: 100%;
  min-width: 0; // flexbox 오버플로우 방지
  height: 500px;

  @media (max-width: $breakpoint-lg) {
    height: 450px;
  }

  @media (max-width: $breakpoint-md) {
    height: 400px;
  }

  // 자식 컴포넌트 스타일 오버라이드
  :deep(.my-posts-container),
  :deep(.my-trip-history-container) {
    padding: 0;
    margin: 0;
    height: 100%;
  }

  :deep(.my-posts),
  :deep(.my-trip-history) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: $spacing-lg;

    @media (max-width: $breakpoint-md) {
      padding: $spacing-md;
    }
  }

  :deep(.my-posts__list),
  :deep(.my-trip-history__list) {
    flex: 1;
    height: 100%;
    overflow-y: auto;
  }
}

// 반응형 디자인 개선
@media (max-width: $breakpoint-lg) {
  .profile-page {
    padding: $spacing-md;
  }
}

@media (max-width: $breakpoint-md) {
  .posts-section,
  .trip-history-section {
    height: 350px;
  }
}

@media (max-width: $breakpoint-sm) {
  .posts-section,
  .trip-history-section {
    height: 300px;
  }
}
</style>
