<!-- views/SignupView.vue -->
<template>
  <div
    class="flex flex-col items-center justify-start min-h-screen pt-12 p-6 text-center font-apple-sdgothic"
  >
    <h1 class="text-3xl font-bold mb-4">SSAFY 계정 생성</h1>

    <div class="text-ms mb-6">
      SSAFY 계정을 가지고 계십니까?
      <router-link
        to="/login"
        class="text-ms inline-flex items-center text-blue-500 hover:underline ml-1"
      >
        <span>로그인</span>
        <ArrowUpRight class="w-4 h-4 ml-1" />
      </router-link>
    </div>

    <!-- 컴포넌트 삽입 -->
    <SignupForm />
  </div>
</template>

<script setup>
import SignupForm from "@/components/auth/SignupForm.vue";
import { ArrowUpRight } from "lucide-vue-next";
</script>
