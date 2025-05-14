<template>
  <nav class="bg-white font-apple-sdgothic font-medium border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
      <HeaderLogo />
      <div class="md:hidden">
        <button @click="toggleMenu" class="focus:outline-none">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" stroke-width="2"
               viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
      <HeaderDesktopMenu
        :is-logged-in="isLoggedIn"
        :user-role="userRole"
        @logout="logoutHandler"
      />
    </div>
    <HeaderMobileMenu
      v-if="isMenuOpen"
      :is-logged-in="isLoggedIn"
      :user-role="userRole"
      @close-menu="closeMenu"
      @logout="logoutHandler"
    />
  </nav>
</template>

<script>
import { mapGetters } from 'vuex';
import TokenService from '@/services/token.service';

import HeaderLogo from '@/components/layout/header/HeaderLogo.vue';
import HeaderDesktopMenu from '@/components/layout/header/HeaderDesktopMenu.vue';
import HeaderMobileMenu from '@/components/layout/header/HeaderMobileMenu.vue';

export default {
  name: 'AppHeader',
  components: {
    HeaderLogo,
    HeaderDesktopMenu,
    HeaderMobileMenu,
  },
  data() {
    return {
      isMenuOpen: false,
    };
  },
  computed: {
    ...mapGetters('auth', ['isLoggedIn', 'getRole']),
    userRole() {
      return this.getRole;
    },
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    closeMenu() {
      this.isMenuOpen = false;
    },
    logoutHandler() {
      TokenService.clear();
      this.$store.commit('auth/logout');
      this.$router.push({ name: 'home' });
    },
  },
};
</script>
