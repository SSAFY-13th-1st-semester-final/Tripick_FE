<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">Travel Glass</h3>
          <p class="footer-description">
            최고의 여행 경험을 위한 당신의 파트너.<br>
            글래스모피즘 디자인으로 더 세련되고 직관적인 여행 앱을 만나보세요.
          </p>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">바로가기</h3>
          <ul class="footer-links">
            <li><router-link to="/">홈</router-link></li>
            <li><router-link :to="{ name: 'travel-create' }">여행 목록</router-link></li>
            <li><router-link to="/auth/login">로그인</router-link></li>
            <li><router-link to="/auth/signup">회원가입</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">고객 지원</h3>
          <ul class="footer-links">
            <li><a href="#">도움말</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">이용약관</a></li>
            <li><a href="#">개인정보 처리방침</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">문의하기</h3>
          <ul class="footer-contact">
            <li>이메일: support@travel-glass.com</li>
            <li>전화: 02-1234-5678</li>
            <li>주소: 서울특별시 강남구 테헤란로 123</li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Travel Glass. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// 현재 년도 계산
const currentYear = computed(() => new Date().getFullYear())
</script>

<style lang="scss" scoped>
.footer {
  background: rgba($white, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: $spacing-2xl 0 $spacing-lg;
  margin-top: auto;
  border-top: 1px solid rgba($primary-color, 0.1);
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-xl;
  
  @media (max-width: $breakpoint-lg) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: $breakpoint-md) {
    grid-template-columns: 1fr;
  }
}

.footer-section {
  margin-bottom: $spacing-lg;
}

.footer-title {
  color: $primary-color;
  font-size: 1.25rem;
  margin-bottom: $spacing-md;
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -5px;
    width: 40px;
    height: 2px;
    background-color: rgba($primary-color, 0.5);
  }
}

.footer-description {
  color: $primary-color;
  font-size: 0.9rem;
  line-height: 1.6;
}

.footer-links,
.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-bottom: $spacing-sm;
    color: $primary-color;
    font-size: 0.9rem;
  }
  
  a {
    color: $primary-color;
    text-decoration: none;
    transition: color $transition-fast;
    
    &:hover {
      color: $accent-color;
    }
  }
}

.footer-bottom {
  margin-top: $spacing-xl;
  padding-top: $spacing-md;
  border-top: 1px solid rgba($primary-color, 0.1);
  text-align: center;
  
  p {
    color: $dark-gray;
    font-size: 0.875rem;
    margin: 0;
  }
}
</style>