<template>
  <footer class="bg-gray-100 text-gray-400 py-2 text-xs font-apple-sdgothic font-medium w-full">
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center text-center space-y-2">
        <p>&copy; 2025 SSAFY. 모든 권리 보유.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-1 gap-x-4 text-center">
          <router-link to="/privacy" class="hover:text-gray-600 transition">개인정보 처리방침</router-link>
          <router-link to="/terms" class="hover:text-gray-600 transition">약관</router-link>
          <router-link to="/refund" class="hover:text-gray-600 transition">판매 및 환불</router-link>
          <router-link to="/legal" class="hover:text-gray-600 transition">법적 고지</router-link>
          <router-link to="/sitemap" class="hover:text-gray-600 transition">사이트 맵</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
};
</script>
