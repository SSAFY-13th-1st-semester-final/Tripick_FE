<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50" @click.self="close">
    <div class="bg-white rounded-2xl w-11/12 max-w-5xl h-[90vh] p-10 shadow-2xl relative flex flex-col">
      
      <!-- 제목 -->
      <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ props.post.title }}</h2>


      <!-- 닫기 버튼 -->
      <button @click="close" class="absolute top-4 right-4 text-gray-400 hover:text-black text-3xl font-bold">
        &times;
      </button>

      <!-- 상단 영역: 프로필 + 닉네임 + 작성일 + 수정/삭제 버튼 -->
      <div class="flex items-center justify-between mb-6">
        <!-- 프로필 영역 -->
        <div class="flex items-center">
          <img :src="props.post.profileImageUrl" alt="profile" class="w-10 h-10 rounded-full object-cover mr-3" />
          <div>
            <div class="font-bold text-gray-800">{{ props.post.nickname }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(props.post.createdAt) }}</div>
          </div>
        </div>

        <!-- 버튼 -->
        <div v-if="isOwner" class="flex space-x-2">
          <button class="px-3 py-1.5 text-xs bg-gray-300 text-gray-600 rounded-sm hover:bg-gray-400">
            수정
          </button>
          <button
            class="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-sm hover:bg-gray-300"
            @click="deletePost"
          >
            삭제
          </button>
        </div>
      </div>

      <!-- 썸네일 -->
      <div class="mb-6">
        <img
          :src="props.post.thumbNail || blankThumbnail"
          alt="thumbnail"
          class="w-full h-64 object-cover rounded-lg"
        />
      </div>

      <!-- 본문 -->
      <div class="flex-1 overflow-y-auto p-1 text-base text-gray-800 whitespace-pre-wrap leading-relaxed mb-6">
        {{ props.post.content }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import axios from 'axios'
import blankThumbnail from '@/assets/img/blank_thumbnail.png'

const props = defineProps({
  post: Object
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const isOwner = computed(() => {
  const currentUserId = localStorage.getItem('id')
  return currentUserId && currentUserId === String(props.post.memberId)
})

const formatDate = (isoString) => {
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

// 삭제 요청
const deletePost = async () => {
  const token = localStorage.getItem('access-token');

  if (!token) {
    console.error('토큰이 존재하지 않습니다.');
    alert('로그인이 필요합니다.');
    return;
  }

  try {
    await axios.delete(`/v1/posts/${props.post.postId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    alert('게시글이 삭제되었습니다.');
    emit('close'); // 모달 닫기
  } catch (err) {
    console.error('삭제 실패:', err);
    alert('삭제에 실패했습니다.');
  }
};

</script>
