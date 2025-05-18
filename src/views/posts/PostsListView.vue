<template>
  <div class="posts-list">
    <div class="posts-list__container">
      <div class="posts-list__header">
        <h1 class="posts-list__title">게시판</h1>
        <div class="posts-list__actions">
          <AppButton 
            variant="primary" 
            size="sm"
            @click="navigateToCreate"
            class="create-post-btn"
          >
            <i class="icon-plus"></i>
            게시글 작성
          </AppButton>
        </div>
      </div>
      
      <div v-if="isLoading && posts.length === 0" class="posts-list__loading">
        <div class="loading-spinner"></div>
        <p>게시글을 불러오는 중...</p>
      </div>
      
      <div v-else-if="posts.length === 0" class="posts-list__empty">
        <p>게시글이 없습니다.</p>
        <AppButton 
          variant="outline" 
          size="sm"
          @click="navigateToCreate"
        >
          첫 게시글 작성하기
        </AppButton>
      </div>
      
      <div v-else ref="postsContainer" class="posts-list__grid">
        <PostCard 
          v-for="post in posts" 
          :key="post.postId" 
          :post="post" 
          class="posts-list__card"
        />
      </div>
      
      <div v-if="isLoading && posts.length > 0" class="posts-list__loader">
        <div class="loading-spinner"></div>
        <p>더 불러오는 중...</p>
      </div>
      
      <div v-if="!isLoading && !hasMore" class="posts-list__end">
        <p>모든 게시글을 불러왔습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import PostService from '@/services/post.service'
import PostCard from '@/components/posts/PostCard.vue'
import AppButton from '@/components/common/AppButton.vue'

// 라우터 및 스토어
const router = useRouter()
const notificationStore = useNotificationStore()

// 상태 정의
const posts = ref([])
const page = ref(1)
const maxPage = ref(1)
const size = ref(10)
const isLoading = ref(false)
const hasMore = ref(true)
const postsContainer = ref(null)
const observer = ref(null)

// 게시글 생성 페이지로 이동
const navigateToCreate = () => {
  router.push({ name: 'post-create' })
}

// 게시글 목록 로드
const loadPosts = async () => {
  if (isLoading.value || !hasMore.value) return
  
  isLoading.value = true
  
  try {
    const response = await PostService.getPosts(page.value, size.value)
    
    // API 응답 구조: { posts: [...], maxPage: number }
    if (response.data && response.data.posts) {
      // 게시글 배열에 추가
      posts.value = [...posts.value, ...response.data.posts]
      
      // 최대 페이지 정보 업데이트
      maxPage.value = response.data.maxPage || 1
      
      // 다음 페이지 로드할 수 있는지 확인
      hasMore.value = page.value < maxPage.value
      
      // 다음 페이지로 증가
      if (hasMore.value) {
        page.value++
      }
      
    }
  } catch (error) {
    notificationStore.showError('게시글 목록을 불러오는 중 오류가 발생했습니다.')
    
  } finally {
    isLoading.value = false
  }
}

// 교차 관찰자 초기화 (무한 스크롤)
const initIntersectionObserver = () => {
  try {
    observer.value = new IntersectionObserver(entries => {
      const entry = entries[0]
      
      if (entry.isIntersecting && !isLoading.value && hasMore.value) {
        loadPosts()
      }
    }, {
      rootMargin: '0px 0px 200px 0px', // 하단에서 200px 전에 로딩 시작
      threshold: 0.1
    })
    
    // 관찰 요소에 옵저버 연결
    const observerTarget = document.createElement('div')
    observerTarget.classList.add('observer-target')
    postsContainer.value.appendChild(observerTarget)
    observer.value.observe(observerTarget)
  } catch (error) {
    notificationStore.showWarning('무한 스크롤 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.', {
      duration: 5000,
      closable: true
    })
  }
}

// 컴포넌트 마운트 시 게시글 로드 및 무한 스크롤 초기화
onMounted(() => {
  loadPosts().then(() => {
    // 게시글 로드 후 옵저버 초기화
    if (postsContainer.value) {
      setTimeout(() => {
        initIntersectionObserver()
      }, 500) // DOM이 완전히 업데이트된 후 옵저버 초기화를 위해 약간의 지연 추가
    } else {
      notificationStore.showWarning('게시글 컨테이너를 찾을 수 없습니다.', { duration: 3000 })
    }
  }).catch(error => {
    notificationStore.showError('초기 게시글 로드에 실패했습니다.', {
      duration: 5000,
      closable: true
    })
  })
})

// 컴포넌트 언마운트 시 옵저버 해제
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.posts-list {
  padding: $spacing-lg;
  
  &__container {
    max-width: 1480px; // 화면 너비 제한 및 양쪽 여백 확보
    margin: 0 auto;
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xl;
  }
  
  &__title {
    font-size: 1.5rem;
    color: $primary-color;
    margin: 0;
  }
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: $spacing-lg;
    
    @media (min-width: $breakpoint-sm) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (min-width: $breakpoint-md) {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @media (min-width: $breakpoint-lg) {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @media (min-width: $breakpoint-xl) {
      grid-template-columns: repeat(5, 1fr); // 5열로 변경
    }
  }
  
  &__card {
    height: 100%;
  }
  
  &__loading,
  &__empty,
  &__loader,
  &__end {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: $spacing-2xl 0;
    text-align: center;
    
    p {
      margin: $spacing-md 0;
      color: rgba($primary-color, 0.7);
    }
  }
  
  &__loader {
    padding: $spacing-lg 0;
  }
  
  &__end {
    padding: $spacing-lg 0;
    font-size: 0.9rem;
    color: rgba($primary-color, 0.5);
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($primary-color, 0.1);
  border-top-color: $accent-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.observer-target {
  width: 100%;
  height: 10px;
  visibility: hidden;
}

.create-post-btn {
  display: flex;
  align-items: center;
  
  i {
    margin-right: $spacing-xs;
  }
}
</style>