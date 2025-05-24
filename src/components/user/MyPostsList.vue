<template>
  <div class="my-posts-container">
    <div class="my-posts glass-card">
      <!-- 헤더 -->
      <div class="my-posts__header">
        <h3 class="my-posts__title">내가 쓴 게시글</h3>
        <div class="my-posts__actions">
          <button
            class="action-icon check-icon"
            :class="{ 'active': isSelectMode }"
            @click="toggleSelectMode"
            title="선택 모드"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </button>
          <button
            v-if="isSelectMode && selectedPosts.length > 0"
            class="action-icon delete-selected"
            @click="deleteSelectedPosts"
            :title="`선택된 ${selectedPosts.length}개 게시글 삭제`"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- 게시글 목록 -->
      <div class="my-posts__list" ref="postsContainer">
        <div
          v-for="post in props.posts"
          :key="post.postId"
          :class="[
            'post-card',
            'glass-card',
            { 
              'post-card--selected': isSelected(post.postId),
              'post-card--selectable': isSelectMode
            }
          ]"
          @click="handlePostClick(post.postId)"
        >
          <!-- 게시글 정보 -->
          <div class="post-card__content">
            <div class="post-card__main">
              <div class="post-card__info">
                <span class="post-card__board-type">{{ post.boardType }}</span>
                <h4 class="post-card__title">{{ post.title }}</h4>
              </div>
              
              <div class="post-card__description-row">
                <p class="post-card__description">{{ post.description || '내용 없음' }}</p>
              </div>
            </div>

            <div class="post-card__footer">
              <div class="post-card__meta">
                <span class="post-card__date">{{ formatDate(post.createdAt) }}</span>
                <span v-if="post.createdAt !== post.updatedAt" class="post-card__updated">
                  (수정: {{ formatDate(post.updatedAt) }})
                </span>
              </div>
              
              <div class="post-card__stats">
                <div class="stat-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>{{ formatCount(post.viewCount) }}</span>
                </div>
                
                <div class="stat-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span>{{ formatCount(post.likeCount) }}</span>
                </div>
                
                <div class="stat-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                  </svg>
                  <span>{{ formatCount(post.commentCount) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 선택 모드일 때 체크 표시 -->
          <div v-if="isSelectMode" class="post-card__check">
            <div class="check-circle" :class="{ 'checked': isSelected(post.postId) }">
              <svg v-if="isSelected(post.postId)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="props.loading && props.posts.length === 0" class="loading-container">
          <div class="loading-spinner"></div>
          <p>게시글을 불러오는 중...</p>
        </div>

        <!-- 무한스크롤 로딩 (하단에 더 보기) -->
        <div v-if="props.loading && props.posts.length > 0" class="loading-more">
          <div class="loading-spinner-small"></div>
          <p>더 많은 게시글을 불러오는 중...</p>
        </div>

        <!-- 더 이상 데이터가 없을 때 -->
        <div v-if="!props.hasMore && props.posts.length > 0" class="no-more-data">
          <p>모든 게시글을 불러왔습니다.</p>
        </div>

        <!-- 게시글이 없을 때 -->
        <div v-if="!props.loading && props.posts.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          <h3>작성한 게시글이 없습니다</h3>
          <p>첫 번째 게시글을 작성해보세요!</p>
        </div>

        <!-- 무한 스크롤 트리거 -->
        <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useNotificationStore } from '@/stores/notification'

// Props 정의
const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  }
})

// 이벤트 정의
const emit = defineEmits(['loadMore', 'deletePost', 'deletePosts'])

// 스토어
const notificationStore = useNotificationStore()

// 내부 상태 관리
const selectedPosts = ref([])
const isSelectMode = ref(false)

// DOM 참조
const postsContainer = ref(null)
const infiniteScrollTrigger = ref(null)

// Intersection Observer
let observer = null

// 선택 모드 관련
const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) {
    selectedPosts.value = []
  }
}

// 게시글 선택 관련
const isSelected = (postId) => {
  return selectedPosts.value.includes(postId)
}

const toggleSelect = (postId) => {
  const index = selectedPosts.value.indexOf(postId)
  if (index > -1) {
    selectedPosts.value.splice(index, 1)
  } else {
    selectedPosts.value.push(postId)
  }
}

const handlePostClick = (postId) => {
  if (isSelectMode.value) {
    toggleSelect(postId)
  }
}

// 날짜 포맷팅
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}시간 전`
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

// 숫자 포맷팅
const formatCount = (count) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

// 무한 스크롤 설정
const setupInfiniteScroll = () => {
  if (!infiniteScrollTrigger.value) return
  
  observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0]
      if (target.isIntersecting && props.hasMore && !props.loading) {
        setTimeout(() => {
          if (props.hasMore && !props.loading) {
            emit('loadMore')
          }
        }, 100)
      }
    },
    {
      rootMargin: '50px',
      threshold: 0.1
    }
  )
  
  observer.observe(infiniteScrollTrigger.value)
}

// 삭제 관련 함수들
const deleteSelectedPosts = () => {
  if (selectedPosts.value.length === 0) return
  emit('deletePosts', [...selectedPosts.value])
  selectedPosts.value = []
  isSelectMode.value = false
}

// 라이프사이클
onMounted(async () => {
  await nextTick()
  setupInfiniteScroll()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.my-posts-container {
  padding: $spacing-xs;
  max-width: 1000px;
  margin: 0 auto;
}

.my-posts {
  padding: $spacing-xl;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;
  }

  &__title {
    color: $primary-color;
    font-weight: $font-weight-medium;
    font-size: 1.1rem;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    max-height: 70vh;
    overflow-y: auto;
    padding-right: $spacing-xs;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba($light-gray, 0.3);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($dark-gray, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba($primary-color, 0.4);
      }
    }
  }
}

.post-card {
  position: relative;
  padding: $spacing-md;
  border-radius: 8px;
  transition: all $transition-fast;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba($primary-color, 0.08);
  }

  &--selectable {
    cursor: pointer;
  }

  &--selected {
    border-color: $accent-color;
    box-shadow: 0 2px 10px rgba($accent-color, 0.15);
  }

  &__content {
    width: 100%;
  }

  &__main {
    margin-bottom: $spacing-sm;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__board-type {
    display: inline-block;
    background-color: rgba($accent-color, 0.1);
    color: $accent-color;
    padding: 2px $spacing-xs;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: $font-weight-medium;
    flex-shrink: 0;
  }

  &__title {
    color: $primary-color;
    font-weight: $font-weight-medium;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.3;
    flex-shrink: 0;
  }

  &__description-row {
    margin-bottom: $spacing-xs;
  }

  &__description {
    color: $dark-gray;
    line-height: 1.3;
    margin: 0;
    font-size: 0.8rem;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 0.75rem;
    color: $dark-gray;
  }

  &__date {
    color: $dark-gray;
  }

  &__updated {
    color: $warning-color;
    font-size: 0.7rem;
  }

  &__stats {
    display: flex;
    gap: $spacing-md;
  }

  &__check {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
  color: $dark-gray;
  font-size: 0.75rem;

  svg {
    flex-shrink: 0;
  }
}

.action-icon {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-fast;
  background-color: rgba($white, 0.8);
  backdrop-filter: blur(10px);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba($primary-color, 0.15);
  }

  &.check-icon {
    color: $dark-gray;

    &.active {
      background-color: $accent-color;
      color: $white;
    }
  }

  &.delete-selected {
    background-color: rgba($error-color, 0.9);
    color: $white;

    &:hover {
      background-color: $error-color;
    }
  }
}

.check-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid $medium-gray;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;

  &.checked {
    background-color: $accent-color;
    border-color: $accent-color;
    color: $white;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba($primary-color, 0.1);
    border-top-color: $accent-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-md;
  }

  p {
    color: $dark-gray;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg;

  .loading-spinner-small {
    width: 24px;
    height: 24px;
    border: 2px solid rgba($primary-color, 0.1);
    border-top-color: $accent-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-sm;
  }

  p {
    color: $dark-gray;
    margin: 0;
    font-size: 0.9rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.no-more-data {
  text-align: center;
  padding: $spacing-lg;
  color: $dark-gray;

  p {
    margin: 0;
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-3xl;
  color: $dark-gray;

  svg {
    margin-bottom: $spacing-lg;
    opacity: 0.5;
  }

  h3 {
    color: $primary-color;
    margin-bottom: $spacing-sm;
  }

  p {
    margin: 0;
  }
}

.infinite-scroll-trigger {
  height: 1px;
}

// 반응형 디자인
@media (max-width: $breakpoint-md) {
  .my-posts-container {
    padding: $spacing-md;
  }

  .my-posts {
    padding: $spacing-lg;
  }

  .post-card {
    &__info {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-xs;
    }

    &__footer {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-xs;
    }

    &__stats {
      gap: $spacing-md;
    }
  }

  .action-icon {
    width: 26px;
    height: 26px;
  }
}
</style>