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
        @close-menu="closeMenu"
        @logout="logout"
      />
    </div>
    <HeaderMobileMenu
      v-if="isMenuOpen"
      :is-logged-in="isLoggedIn"
      :user-role="userRole"
      @close-menu="closeMenu"
      @logout="logout"
    />
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useAuth } from '@/composables/useAuth';

import HeaderLogo from '@/components/layout/header/HeaderLogo.vue';
import HeaderDesktopMenu from '@/components/layout/header/HeaderDesktopMenu.vue';
import HeaderMobileMenu from '@/components/layout/header/HeaderMobileMenu.vue';

const store = useStore();
const isMenuOpen = ref(false);

const userRole = computed(() => store.getters['auth/getRole']);
const isLoggedIn = computed(() => store.getters['auth/isLoggedIn']);

const { logout } = useAuth();

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}
</script>
