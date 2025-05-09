<template>
  <div class="p-6 max-w-screen-2xl mx-auto pt-12">
    <!-- 글쓰기 버튼 -->
    <div class="flex justify-end mb-4">
      <button
        @click="openCreatePostModal"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"
      >
        글쓰기
      </button>
    </div>

    <!-- 게시글 목록 (전체 페이지가 스크롤 대상) -->
    <div
      ref="scrollContainer"
      class="grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <PostCard
        v-for="post in posts"
        :key="post.postId"
        :post="post"
        @click="openPost(post.postId)"
      />
    </div>

    <!-- 로딩 중 -->
    <div v-if="isLoading" class="text-center mt-4 text-gray-500">
      불러오는 중...
    </div>

    <!-- 더 이상 없음 -->
    <div v-if="!hasMore && !isLoading" class="text-center mt-4 text-gray-400">
      더 이상 게시글이 없습니다.
    </div>

    <!-- 상세 모달 -->
    <PostDetailModal
      v-if="selectedPost"
      :post="selectedPost"
      @close="selectedPost = null"
    />

    <!-- 글쓰기 모달 -->
    <PostCreateModal
      v-if="isCreatePostModalOpen"
      @close="closeCreatePostModal"
      @post-created="addNewPost"
    />

    <!-- 위쪽 화살표 버튼 (화면 우측 하단 고정) -->
    <button
      v-if="showScrollButton"
      @click="scrollToTop"
      class="fixed bottom-20 right-5 bg-gray-100 text-white rounded-full p-3 z-10 hover:bg-gray-300 transition-colors duration-500"
    >
      <img src="@/assets/icons/icon_up_arrow.svg" alt="Scroll to top" class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import PostCard from '../components/PostCard.vue'
import PostDetailModal from '../components/PostDetailModal.vue'
import PostCreateModal from '../components/PostCreateModal.vue'

// 상태 변수
const posts = ref([])  
const page = ref(1)
const size = 20
const maxPage = ref(null) 
const isLoading = ref(false)
const hasMore = ref(true)
const isCreatePostModalOpen = ref(false)
const selectedPost = ref(null)
const scrollContainer = ref(null)
const showScrollButton = ref(false)

// 게시글 불러오기
const fetchPosts = async () => {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true
  try {
    const res = await axios.get('/v1/posts', {
      params: { page: page.value, size }
    })
    const newPosts = res.data.posts || []

    if (maxPage.value === null && res.data.maxPage != null) {
      maxPage.value = res.data.maxPage
    }

    if (newPosts.length) {
      posts.value.push(...newPosts)
      page.value++
      hasMore.value = page.value <= maxPage.value
    } else {
      hasMore.value = false
    }
  } catch (err) {
    console.error('게시글 불러오기 실패:', err)
  } finally {
    isLoading.value = false
  }
}

// 스크롤 이벤트 (window 기준)
const handleScroll = () => {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50
  if (nearBottom) {
    fetchPosts()
  }

  showScrollButton.value = window.scrollY > 100
}

// 게시글 상세 열기
const openPost = async (postId) => {
  try {
    const res = await axios.get(`/v1/posts/${postId}`)
    selectedPost.value = res.data
  } catch (err) {
    console.error('게시글 상세 조회 실패:', err)
  }
}

// 글쓰기 모달 열기/닫기
const openCreatePostModal = () => {
  isCreatePostModalOpen.value = true
}
const closeCreatePostModal = () => {
  isCreatePostModalOpen.value = false
}

// 새 게시글 추가
const addNewPost = (newPost) => {
  posts.value.unshift(newPost)
}

// 최초 로딩 + 스크롤 이벤트 등록
onMounted(() => {
  fetchPosts()
  window.addEventListener('scroll', handleScroll)
})

// 스크롤 이벤트 제거
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 최상단으로 스크롤 이동
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};
</script>

<style scoped>
/* fixed 버튼 우측 하단 고정용 스타일은 클래스에 이미 있음 (위쪽 화살표 버튼) */
</style>
