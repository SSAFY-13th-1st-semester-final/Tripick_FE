<template>
  <footer class="bg-gray-100 text-white py-2">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col items-center justify-center">
        <!-- 저작권 및 링크 텍스트 -->
        <div class="text-center text-gray-400 text-xs font-apple-sdgothic font-medium">
          <p>Copyright © 2025 SSAFY. 모든 권리 보유.</p>
          <div class="mt-2 flex justify-center space-x-4">
            <router-link to="/privacy" class="hover:text-white transition-all duration-200">개인정보 처리방침</router-link>
            <router-link to="/terms" class="hover:text-white transition-all duration-200">약관</router-link>
            <router-link to="/refund" class="hover:text-white transition-all duration-200">판매 및 환불</router-link>
            <router-link to="/legal" class="hover:text-white transition-all duration-200">법적 고지</router-link>
            <router-link to="/sitemap" class="hover:text-white transition-all duration-200">사이트 맵</router-link>
          </div>
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

<style scoped>
footer {
  background-color: #f3f4f6;
  color: #fff;
  text-align: center;
  padding: 0.5rem;
  width: 100%;
}

footer .hover\:text-white:hover {
  font-weight: 600;
  color: gray;
}

.content-area {
  padding-bottom: 50px; /* 푸터가 가려지지 않도록 여백 추가 */
}
</style>
