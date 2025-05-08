<template>
  <footer class="bg-gray-100 text-white py-2 fixed bottom-0 w-full">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col items-center justify-center">
        <!-- <div class="flex space-x-6 mb-4">
          <a href="https://facebook.com" target="_blank" class="text-gray-300 hover:text-white text-2xl">
            <img src="@/assets/icon_facebook.svg" alt="Facebook" class="w-5 h-5" />
          </a>
          <a href="https://twitter.com" target="_blank" class="text-gray-300 hover:text-white text-2xl">
            <img src="@/assets/icon_twitter.svg" alt="Twitter" class="w-5 h-5" />
          </a>
          <a href="https://instagram.com" target="_blank" class="hover:text-white text-2xl">
            <img src="@/assets/icon_instagram.svg" alt="Instagram" class="w-5 h-5" />
          </a>
        </div> -->

        <!-- 저작권 및 링크 텍스트 -->
        <div class="text-center text-gray-400 text-xs">
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
  position: fixed;
  bottom: 0;
  width: 100%;
}

footer .hover\:text-white:hover {
  font-weight: 600; 
  color: gray;
}

</style>
