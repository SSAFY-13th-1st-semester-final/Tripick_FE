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

    <!-- 게시글 목록 -->
    <div
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
      @post-created="handlePostCreated"
    />

    <!-- 위로 가기 버튼 -->
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import PostCard from '@/components/post/PostCard.vue'
import PostDetailModal from '@/components/post/PostDetailModal.vue'
import PostCreateModal from '@/components/post/PostCreateModal.vue'

const posts = ref([])
const page = ref(1)
const size = 20
const maxPage = ref(null)
const isLoading = ref(false)
const hasMore = ref(true)
const isCreatePostModalOpen = ref(false)
const selectedPost = ref(null)
const showScrollButton = ref(false)

// 디바운스 함수 추가
const debounce = (fn, delay) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

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

const handlePostCreated = () => {
  posts.value = []
  page.value = 1
  hasMore.value = true
  maxPage.value = null
  fetchPosts()
  closeCreatePostModal()
}

const openPost = async (postId) => {
  try {
    const res = await axios.get(`/v1/posts/${postId}`)
    selectedPost.value = res.data
  } catch (err) {
    console.error('게시글 상세 조회 실패:', err)
  }
}

const openCreatePostModal = () => {
  isCreatePostModalOpen.value = true
}
const closeCreatePostModal = () => {
  isCreatePostModalOpen.value = false
}

// 스크롤 이벤트 핸들러 개선
const handleScroll = debounce(() => {
  // 현재 스크롤 위치
  const scrollY = window.scrollY || window.pageYOffset
  // 화면 높이
  const windowHeight = window.innerHeight
  // 문서 전체 높이
  const documentHeight = document.documentElement.scrollHeight

  // 스크롤이 하단에 가까워지면 추가 데이터 로드
  if (scrollY + windowHeight >= documentHeight - 200) {
    fetchPosts()
  }

  // 위로 가기 버튼 표시 여부
  showScrollButton.value = scrollY > 100
}, 100)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  fetchPosts()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})

watch(selectedPost, (newVal) => {
  document.body.style.overflow = newVal ? 'hidden' : ''
})
</script>