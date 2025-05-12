<template>
  <nav class="bg-white font-apple-sdgothic font-medium border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
      <router-link to="/" class="flex items-center space-x-2">
        <img src="@/assets/icons/logo.png" alt="logo" class="h-4 w-auto" />
      </router-link>

      <div class="md:hidden">
        <button @click="toggleMenu" class="focus:outline-none">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" stroke-width="2"
               viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      <div class="hidden md:flex space-x-4 text-xs items-center">
        <router-link to="/all" class="text-gray-700 hover:font-medium">전체조회</router-link>
        <router-link to="/posts" class="text-gray-700 hover:font-medium">게시판</router-link>
        <router-link to="/notice" class="text-gray-700 hover:font-medium">공지사항</router-link>

        <template v-if="isLoggedIn">
          <div ref="profileIcon" class="relative">
            <img src="@/assets/icons/icon_member.svg"
                 alt="user icon"
                 class="h-5 w-5 cursor-pointer"
                 @click="toggleProfilePopup" />
            <div v-if="isProfilePopupVisible"
                 ref="profilePopup"
                 class="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10">
              <div class="py-2">
                <router-link to="/mypage" class="block px-4 py-2 text-gray-700 hover:bg-gray-200">마이페이지</router-link>
                <template v-if="userRole === 'ADMIN'">
                  <router-link to="/admin" class="block px-4 py-2 text-gray-700 hover:bg-gray-200">관리자 대시보드</router-link>
                  <router-link to="/manage-users" class="block px-4 py-2 text-gray-700 hover:bg-gray-200">사용자 관리</router-link>
                </template>
                <button @click="logoutHandler" class="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-200">
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="text-gray-700 hover:font-medium">로그인</router-link>
        </template>
      </div>
    </div>

    <div v-show="isMenuOpen"
         class="md:hidden px-4 py-2 text-sm space-y-1 border-t border-gray-200 overflow-hidden max-h-0 opacity-0 transition-all ease-in-out duration-[5000ms] transition-max-height transition-opacity"
         :class="{'max-h-screen opacity-100': isMenuOpen, 'max-h-0 opacity-0': !isMenuOpen}">
      <router-link to="/all" class="block text-gray-700 py-1" @click="closeMenu">전체조회</router-link>
      <router-link to="/posts" class="block text-gray-700 py-1" @click="closeMenu">게시판</router-link>
      <router-link to="/notice" class="block text-gray-700 py-1" @click="closeMenu">공지사항</router-link>

      <template v-if="isLoggedIn">
        <router-link to="/mypage" class="block text-gray-700 py-1" @click="closeMenu">마이페이지</router-link>
        <template v-if="userRole === 'ADMIN'">
          <router-link to="/admin" class="block text-gray-700 py-1" @click="closeMenu">관리자 대시보드</router-link>
          <router-link to="/manage-users" class="block text-gray-700 py-1" @click="closeMenu">사용자 관리</router-link>
        </template>
        <button @click="logoutHandler" class="block w-full text-left text-gray-700 py-1">로그아웃</button>
      </template>
      <template v-else>
        <router-link to="/login" class="block text-gray-700 py-1" @click="closeMenu">로그인</router-link>
      </template>
    </div>
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import TokenService from '../services/token.service';

export default {
  name: 'AppHeader',
  data() {
    return {
      isProfilePopupVisible: false,
      isMenuOpen: false,
    };
  },
  computed: {
    ...mapGetters(['isLoggedIn', 'getRole']),
    userRole() {
      return this.getRole;
    },
  },
  methods: {
    ...mapActions(['logout']),
    toggleProfilePopup() {
      this.isProfilePopupVisible = !this.isProfilePopupVisible;
    },
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    closeMenu() {
      this.isMenuOpen = false;
    },
    logoutHandler() {
      TokenService.clear();
      this.$store.commit('logout');
      this.$router.push({ name: 'home' });
      this.isProfilePopupVisible = false;
      this.isMenuOpen = false;
    },
    closePopupIfClickedOutside(event) {
      const profilePopup = this.$refs.profilePopup;
      const profileIcon = this.$refs.profileIcon;
      if (
        profilePopup &&
        !profilePopup.contains(event.target) &&
        !profileIcon.contains(event.target)
      ) {
        this.isProfilePopupVisible = false;
      }
    },
  },
  mounted() {
    document.addEventListener('click', this.closePopupIfClickedOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closePopupIfClickedOutside);
  },
};
</script>
