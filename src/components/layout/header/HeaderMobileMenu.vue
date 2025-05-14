<template>
  <div class="md:hidden px-4 py-2 text-sm space-y-1 border-t border-gray-200 overflow-hidden max-h-0 opacity-0 transition-all ease-in-out duration-[5000ms] transition-max-height transition-opacity"
       :class="{'max-h-screen opacity-100': true}">
    <router-link to="/map" class="block text-gray-700 py-1" @click="$emit('close-menu')">전체조회</router-link>
    <router-link to="/posts" class="block text-gray-700 py-1" @click="$emit('close-menu')">게시판</router-link>
    <router-link to="#" class="block text-gray-700 py-1" @click="$emit('close-menu')">공지사항</router-link>

    <template v-if="isLoggedIn">
      <router-link to="/mypage" class="block text-gray-700 py-1" @click="$emit('close-menu')">마이페이지</router-link>
      <template v-if="userRole === 'ADMIN'">
        <router-link to="/admin" class="block text-gray-700 py-1" @click="$emit('close-menu')">관리자 대시보드</router-link>
        <router-link to="/manage-users" class="block text-gray-700 py-1" @click="$emit('close-menu')">사용자 관리</router-link>
      </template>
      <button @click="$emit('logout')" class="block w-full text-left text-gray-700 py-1">로그아웃</button>
    </template>
    <template v-else>
      <router-link to="/login" class="block text-gray-700 py-1" @click="$emit('close-menu')">로그인</router-link>
    </template>
  </div>
</template>

<script>
export default {
  name: 'HeaderMobileMenu',
  props: {
    isLoggedIn: Boolean,
    userRole: String,
  },
};
</script>
