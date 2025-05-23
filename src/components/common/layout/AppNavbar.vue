<template>
  <header class="navbar glass-nav">
    <div class="container">
      <div class="navbar-content">
        <router-link to="/" class="navbar-logo">
          <h1>Trap!ck</h1>
        </router-link>

        <nav class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
          <ul class="navbar-menu-list">
            <li class="navbar-menu-item">
              <router-link
                to="/"
                exact-active-class="router-link-active"
                class="navbar-menu-link"
                >홈</router-link
              >
            </li>
            <li class="navbar-menu-item">
              <a
                @click.prevent="openTripPlanner"
                class="navbar-menu-link"
                href="#"
              >
                여행 계획
              </a>
            </li>
            <li class="navbar-menu-item">
              <router-link
                to="/posts"
                active-class="router-link-active"
                class="navbar-menu-link"
                >게시판</router-link
              >
            </li>
            <!-- 인증 상태에 따른 메뉴 렌더링 -->
            <template v-if="isAuthenticated">
              <li class="navbar-menu-item">
                <router-link
                  to="/profile"
                  active-class="router-link-active"
                  class="navbar-menu-link"
                  >내 프로필</router-link
                >
              </li>
              <li class="navbar-menu-item">
                <button @click="logout" class="navbar-menu-link">
                  로그아웃
                </button>
              </li>
            </template>
            <template v-else>
              <li class="navbar-menu-item">
                <router-link
                  to="/auth/login"
                  active-class="router-link-active"
                  class="navbar-menu-link"
                  >로그인</router-link
                >
              </li>
              <li class="navbar-menu-item">
                <router-link
                  to="/auth/signup"
                  active-class="router-link-active"
                  class="navbar-menu-link"
                  >회원가입</router-link
                >
              </li>
            </template>
          </ul>
        </nav>

        <button
          class="navbar-toggle"
          :class="{ 'is-active': isMenuOpen }"
          @click="toggleMenu"
          aria-label="메뉴 토글"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";

// Pinia 스토어 사용
const authStore = useAuthStore();

// 컴포지션 API를 사용한 반응형 상태
const isMenuOpen = ref(false);
const isAuthenticated = computed(() => authStore.isAuthenticated);

// 메뉴 토글 함수
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

// emit 정의
const emit = defineEmits(["open-trip-modal"]);

// 여행 계획 모달 열기 함수
const openTripPlanner = () => {
  emit("open-trip-modal");
};

// 로그아웃 함수
const logout = async () => {
  try {
    authStore.logout();

    if (isMenuOpen.value) {
      toggleMenu();
    }
  } catch (error) {
    console.error("로그아웃 중 오류가 발생했습니다:", error);
    // 오류가 발생해도 로컬 상태는 정리
    authStore.logout();
  }
};

// 화면 크기 변경에 따른 메뉴 상태 조정
const handleResize = () => {
  if (window.innerWidth > 768 && isMenuOpen.value) {
    isMenuOpen.value = false;
    document.body.style.overflow = "";
  }
};

// 컴포넌트 마운트 및 언마운트 시 이벤트 리스너 설정
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  document.body.style.overflow = "";
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

.navbar {
  width: 100%;
  padding: $spacing-md 0;
  z-index: $z-index-fixed;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-logo {
  text-decoration: none;

  h1 {
    font-size: 1.5rem;
    color: $primary-color;
    margin: 0;
    font-weight: $font-weight-bold;
  }
}

.navbar-menu {
  display: flex;
  align-items: center;
}

.navbar-menu-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-direction: row; /* 수평 정렬 확실히 지정 */
  align-items: center; /* 메뉴 항목들의 높이를 동일하게 정렬 */
  height: 100%;

  @media (max-width: $breakpoint-md) {
    flex-direction: column;
    width: 100%;
  }
}

.navbar-menu-item {
  margin-left: $spacing-lg;
  display: flex;
  align-items: center;
  height: 100%;

  @media (max-width: $breakpoint-md) {
    margin: $spacing-md 0;
    margin-left: 0;
  }
}

.navbar-menu-link {
  position: relative;
  color: $primary-color;
  text-decoration: none;
  font-weight: $font-weight-medium;
  padding: $spacing-xs 0;
  display: inline-block;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1.5;
  font-family: inherit;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0;
    height: 2px;
    background-color: $accent-color;
    transition: width $transition-fast;
  }

  &:hover::after,
  &.router-link-active::after {
    width: 100%;
  }

  &.router-link-active {
    font-weight: $font-weight-bold;
    color: $accent-color;
  }
}

@media (max-width: $breakpoint-md) {
  .navbar-menu {
    position: fixed;
    top: 0;
    right: 0;
    width: 80%;
    max-width: 320px;
    height: 100vh;
    padding: $spacing-2xl $spacing-lg;
    background: rgba($white, 0.9);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    box-shadow: -5px 0 30px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform $transition-normal;
    z-index: $z-index-modal;

    &.is-active {
      transform: translateX(0);
    }

    .navbar-menu-list {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .navbar-toggle {
    display: block;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;
    z-index: $z-index-modal + 1;

    span {
      display: block;
      width: 24px;
      height: 2px;
      margin: 5px 0;
      background-color: $primary-color;
      transition: transform $transition-fast, opacity $transition-fast;
    }

    &.is-active {
      span {
        &:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }

        &:nth-child(2) {
          opacity: 0;
        }

        &:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }
      }
    }
  }
}

@media (min-width: $breakpoint-md) {
  .navbar-toggle {
    display: none;
  }
}
</style>
