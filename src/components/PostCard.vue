<template>
    <div
      class="bg-white rounded-xs shadow cursor-pointer hover:shadow-lg transition-transform transform hover:translate-y-[-10px] duration-700 font-apple-sdgothic font-light"
      @click="$emit('click', post.postId)"
    >
      <!-- 작성자 정보 -->
      <div class="flex items-end mb-2 px-2 pt-2">
        <img :src="profileImageSrc" alt="프로필" class="w-5 h-5 rounded-full mr-2" />
        <span class="text-xs text-gray-600 font-bold">{{ post.username }}</span>
      </div>
  
      <!-- 썸네일 -->
      <img
        :src="thumbnailSrc"
        alt="썸네일"
        class="w-full h-40 object-cover mb-2"
      />
  
      <!-- 제목/설명 고정 높이 영역 -->
      <div class="px-2 flex flex-col h-40 justify-between overflow-hidden">
        <div>
          <h2 class="text-sm font-bold mb-1 truncate">{{ post.title }}</h2>
          <p class="text-xs text-gray-700 line-clamp-2">{{ post.description }}</p>
        </div>
      </div>
  
      <!-- 하단 고정 정보 -->
      <div class="flex justify-between text-xs text-gray-500 mt-auto mb-3 py-3 px-2 border-t border-gray-100 h-5">
        <span>{{ formatDate(post.createdAt) }}</span>
        <div class="flex gap-2">
          <span>❤️ {{ post.likeCount }}</span>
          <span>💬 {{ post.commentCount }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import blankThumbnail from '@/assets/img/blank_thumbnail.png'
  import blankProfile from '@/assets/img/default_user_profile.png'
  
  const props = defineProps({ post: Object })
  
  const thumbnailSrc = computed(() =>
    props.post.thumbnailUrl ? props.post.thumbnailUrl : blankThumbnail
  )
  
  const profileImageSrc = computed(() =>
    props.post.profileImageUrl ? props.post.profileImageUrl : blankProfile
  )
  
  const formatDate = (iso) => {
    const date = new Date(iso)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }
  </script>
  