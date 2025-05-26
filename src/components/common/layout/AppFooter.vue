<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">Trip<span class="accent-char">!</span>ck</h3>
          <p class="footer-description">
            당신의 여행, 당신만의 방식으로.<br />
            AI가 돕고, 기록이 이어지는 스마트 여행 플랫폼.<br />
            일정 생성, AI 평가, 후기 탐색, 경로 최적화까지 모두 한 곳에서.
          </p>
        </div>

        <div class="footer-section">
          <h3 class="footer-title">바로가기</h3>
          <ul class="footer-links">
            <li><router-link to="/">홈</router-link></li>
            <li>
              <router-link :to="{ name: 'travel-create' }"
                >여행 목록</router-link
              >
            </li>
            <!-- 인증되지 않은 상태 -->
            <template v-if="!isAuthenticated">
              <li><router-link to="/auth/login">로그인</router-link></li>
              <li><router-link to="/auth/signup">회원가입</router-link></li>
            </template>
            <!-- 인증된 상태 -->
            <template v-else>
              <li><router-link to="/profile">마이페이지</router-link></li>
              <li><a href="#" @click.prevent="logout">로그아웃</a></li>
            </template>
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
        <p>
          &copy; {{ currentYear }} Trip<span class="accent-char">!</span>ck. All
          rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const currentYear = computed(() => new Date().getFullYear());
const isAuthenticated = computed(() => authStore.isAuthenticated);

// 로그아웃 함수
const logout = async () => {
  try {
    authStore.logout();
  } catch (error) {
    // 오류가 발생해도 로컬 상태는 정리
    authStore.logout();
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

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

  .accent-char {
    color: $accent-color; // 느낌표만 파란색으로
  }

  &::after {
    content: "";
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
    cursor: pointer;

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

    .accent-char {
      color: $accent-color; // 푸터 하단의 느낌표도 파란색으로
    }
  }
}
</style>
