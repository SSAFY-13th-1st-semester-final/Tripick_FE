<template>
    <div class="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50" @click.self="close">
      <div class="bg-white p-6 rounded-lg w-11/12 max-w-md shadow-lg relative">
        <h2 class="text-xl font-semibold mb-2">{{ props.post.title }}</h2> <!-- props.post.title -->
        <p class="text-sm text-gray-500 mb-4">작성자: {{ props.post.username }}</p> <!-- props.post.username -->
        <p class="whitespace-pre-wrap">{{ props.post.content }}</p> <!-- props.post.content -->
        <button @click="close" class="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  // props를 직접 사용하도록 정의
  const props = defineProps({
    post: Object
  });
  const emit = defineEmits(['close']);
  
  const close = () => {
    emit('close');
  }
  </script>
  
  <style scoped>
  </style>
  