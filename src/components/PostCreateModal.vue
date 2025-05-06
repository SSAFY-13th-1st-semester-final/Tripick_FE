<template>
    <div class="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50" @click.self="close">
      <div class="bg-white p-6 rounded-lg w-11/12 max-w-md shadow-lg relative">
        <h2 class="text-xl font-semibold mb-4">게시글 작성</h2>
  
        <form @submit.prevent="createPost">
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-700">작성자</label>
            <input
              id="username"
              v-model="newPost.username"
              type="text"
              readonly
              class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
  
          <div class="mb-4">
            <label for="boardType" class="block text-sm font-medium text-gray-700">게시판 종류</label>
            <select v-model="newPost.boardType" id="boardType" class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full">
              <option value="GENERAL_FORUM">자유게시판</option>
              <option value="NOTICE">공지사항</option>
            </select>
          </div>
  
          <div class="mb-4">
            <label for="title" class="block text-sm font-medium text-gray-700">제목</label>
            <input
              id="title"
              v-model="newPost.title"
              type="text"
              required
              class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
  
          <div class="mb-4">
            <label for="content" class="block text-sm font-medium text-gray-700">본문</label>
            <textarea
              id="content"
              v-model="newPost.content"
              required
              class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
            ></textarea>
          </div>
  
          <div class="flex justify-end gap-2">
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">CREATE</button>
            <button type="button" @click="close" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref } from 'vue';
import axios from 'axios';
import { defineEmits } from 'vue'; // 이벤트 정의

// 부모와 이벤트 통신 정의
const emit = defineEmits({
  close: null, // 부모에게 'close' 이벤트를 전달
  'post-created': (post) => post, // 'post-created' 이벤트가 게시글 데이터를 전달받음
});

// 새 게시글 객체
const newPost = ref({
  username: localStorage.getItem('username') || '', // 'username'이 없을 경우 빈 문자열 처리
  boardType: 'GENERAL_FORUM',
  title: '',
  content: '',
});

// 모달 닫기
const close = () => {
  emit('close'); // 부모 컴포넌트에 'close' 이벤트 전달
};

// 게시글 작성
const createPost = async () => {
  const token = localStorage.getItem('user'); // 로컬스토리지에서 토큰 가져오기
  
  if (!token) {
    console.error('토큰이 존재하지 않습니다.');
    return; // 토큰이 없다면 더 이상 진행하지 않음
  }

  try {
    const response = await axios.post('/api/v1/posts', newPost.value, {
      headers: {
        'Authorization': `Bearer ${token}`, // Authorization 헤더에 JWT 토큰 포함
      },
    });
    emit('post-created', response.data); // 게시글 작성 후 부모에게 알림
    close(); // 모달 닫기
  } catch (error) {
    console.error('게시글 작성 실패:', error);
    // 에러 핸들링: 사용자에게 에러 메시지 표시하거나 다른 처리
  }
};
</script>


  
  <style scoped>
  /* 여기에 스타일 추가 가능 */
  </style>
  