<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">게시판</h1>

    <!-- Create 버튼 -->
    <div class="flex justify-end mb-4">
      <button
        @click="openCreatePostModal"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        글쓰기
      </button>
    </div>

    <div class="overflow-x-auto shadow rounded-lg">
      <table class="min-w-full bg-white border border-gray-200">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="px-4 py-2 border">번호</th>
            <th class="px-4 py-2 border">작성자</th>
            <th class="px-4 py-2 border">게시판 종류</th>
            <th class="px-4 py-2 border">제목</th>
            <th class="px-4 py-2 border">좋아요</th>
            <th class="px-4 py-2 border">작성일</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="post in posts"
            :key="post.postId"
            class="hover:bg-gray-50"
          >
            <td class="px-4 py-2 border">{{ post.postId }}</td>
            <td class="px-4 py-2 border">{{ post.username }}</td>
            <td class="px-4 py-2 border">{{ boardTypeToText(post.boardType) }}</td>
            <td
              class="px-4 py-2 border hover:underline cursor-pointer"
              @click="openPost(post.postId)"
            >
              {{ post.title }}
            </td>
            <td class="px-4 py-2 border">{{ post.likeCount }}</td>
            <td class="px-4 py-2 border">{{ formatDate(post.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center items-center gap-2">
      <button @click="prevPage" :disabled="page === 1" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">이전</button>
      <span class="text-sm font-medium">페이지 {{ page }}</span>
      <button @click="nextPage" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">다음</button>
    </div>

    <!-- 게시글 상세 모달 -->
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import PostDetailModal from '../components/PostDetailModal.vue'
import PostCreateModal from '../components/PostCreateModal.vue'

const posts = ref([])
const page = ref(1)
const size = 10
const maxPage = ref(1)
const selectedPost = ref(null)
const isCreatePostModalOpen = ref(false) // 글쓰기 모달 상태

const fetchPosts = async () => {
  try {
    const response = await axios.get('/v1/posts', {
      params: { page: page.value, size }
    })
    posts.value = response.data.posts || []
    maxPage.value = response.data.maxPage || 1
  } catch (error) {
    console.error('게시글 불러오기 실패:', error)
  }
}

const openPost = async (postId) => {
  try {
    const response = await axios.get(`/v1/posts/${postId}`)
    selectedPost.value = response.data
  } catch (err) {
    console.error('게시글 상세 조회 실패:', err)
  }
}

const formatDate = (isoDate) => {
  const date = new Date(isoDate)
  const now = new Date()

  const isSameDay = date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate()

  if (isSameDay) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } else {
    return `${String(date.getFullYear()).slice(-2)}.${date.getMonth() + 1}.${date.getDate()}`
  }
}

const boardTypeToText = (type) => {
  switch (type) {
    case 'GENERAL_FORUM': return '자유게시판'
    case 'NOTICE': return '공지사항'
    default: return type
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchPosts()
  }
}

const nextPage = () => {
  if (page.value < maxPage.value) {
    page.value++
    fetchPosts()
  }
}

const openCreatePostModal = () => {
  isCreatePostModalOpen.value = true
}

const closeCreatePostModal = () => {
  isCreatePostModalOpen.value = false
}

const addNewPost = (newPost) => {
  posts.value.unshift(newPost) // 새로 작성한 게시글을 맨 앞에 추가
}

onMounted(() => {
  fetchPosts()
})
</script>


<style scoped>
/* 스타일이 필요하면 여기에 추가 */
</style>
