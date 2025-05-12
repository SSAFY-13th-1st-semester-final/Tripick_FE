<template>
  <div class="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50" @click.self="close">
    <div class="bg-white p-6 rounded-2xl w-11/12 max-w-5xl h-[90vh] shadow-lg relative flex flex-col">
      <h2 class="text-2xl font-bold mb-4 text-gray-900">게시글 작성</h2>

      <form @submit.prevent="createPost" class="flex flex-col flex-1">
        <!-- 게시판 종류 -->
        <div class="mb-3">
          <select
            v-model="newPost.boardType"
            id="boardType"
            class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
            placeholder="게시판 종류"
          >
            <option value="GENERAL_FORUM">자유게시판</option>
            <option v-if="isAdmin" value="NOTICE">공지사항</option>
          </select>
        </div>

        <!-- 제목 -->
        <div class="mb-3">
          <input
            id="title"
            v-model="newPost.title"
            type="text"
            required
            class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
            placeholder="제목을 입력하세요"
          />
        </div>

        <!-- 설명 -->
        <div class="mb-3">
          <textarea
            id="description"
            v-model="newPost.description"
            maxlength="100"
            class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
            placeholder="게시글에 대한 간단한 설명을 입력하세요 (최대 100자)"
          ></textarea>
        </div>

        <!-- 본문 -->
        <div class="flex-1 mb-2">
          <textarea
            id="content"
            v-model="newPost.content"
            required
            class="px-3 py-2 border border-gray-300 rounded-md w-full h-full resize-none"
            placeholder="본문 내용을 입력하세요"
          ></textarea>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end gap-2 mt-0">
          <button
            type="submit"
            class="px-3 py-1.5 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            완료
          </button>
          <button
            type="button"
            @click="close"
            class="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import axios from 'axios';

const emit = defineEmits({
  close: null,
  'post-created': (post) => post
});

const newPost = ref({
  boardType: 'GENERAL_FORUM',
  title: '',
  description: '',
  content: ''
});

const isAdmin = computed(() => {
  return localStorage.getItem('role') === 'ADMIN';
});

const close = () => {
  emit('close');
};

const createPost = async () => {
  const token = localStorage.getItem('access-token');

  if (!token) {
    console.error('토큰이 존재하지 않습니다.');
    return;
  }

  try {
    const response = await axios.post('/v1/posts', newPost.value, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    emit('post-created', response.data);
    close();
  } catch (error) {
    console.error('게시글 작성 실패:', error);
  }
};
</script>
