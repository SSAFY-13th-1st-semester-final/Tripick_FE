<template>
  <nav class="bg-white h-12">
    <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-full flex items-center">
      <div class="flex items-center justify-between w-full">
        <!-- 로고 -->
        <router-link to="/" class="flex items-center space-x-2">
          <img src="@/assets/logo.png" alt="logo" class="h-6 w-auto" />
        </router-link>

        <!-- 메뉴 -->
        <div class="flex space-x-3 text-xs">
          <router-link
            to="/all"
            class="text-gray-700 px-2 py-1 transition-all duration-1000 ease-in-out hover:font-medium"
          >
            전체조회
          </router-link>
          <router-link
            to="/posts"
            class="text-gray-700 px-2 py-1 transition-all duration-1000 ease-in-out hover:font-medium"
          >
            게시판
          </router-link>


          <router-link
            to="/notice"
            class="text-gray-700 px-2 py-1 transition-all duration-1000 ease-in-out hover:font-medium"
          >
            공지사항
          </router-link>

          <!-- 로그인 상태 --> 
          <template v-if="isLoggedIn">
            <!-- 사용자 아이콘 (로그인된 상태) -->
            <div class="relative" ref="profileIcon">
              <img
                src="@/assets/icon_member.svg"
                alt="user icon"
                @click="toggleProfilePopup"
                class="h-6 w-6 cursor-pointer"
              />
              <!-- 프로필 팝업 -->
              <div
                v-if="isProfilePopupVisible"
                class="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10"
                ref="profilePopup"
              >
                <div class="py-2">
                  <router-link
                    to="/mypage"
                    class="block px-4 py-2 text-gray-700 hover:bg-gray-200"
                  >
                    마이페이지
                  </router-link>
                  <!-- 관리자 메뉴 (ADMIN 역할일 때만) -->
                  <template v-if="userRole === 'ADMIN'">
                    <router-link
                      to="/admin"
                      class="block px-4 py-2 text-gray-700 hover:bg-gray-200"
                    >
                      관리자 대시보드
                    </router-link>
                    <router-link
                      to="/manage-users"
                      class="block px-4 py-2 text-gray-700 hover:bg-gray-200"
                    >
                      사용자 관리
                    </router-link>
                  </template>
                  <button
                    @click="logoutHandler"
                    class="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-200"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 미 로그인 상태 -->
          <template v-else>
            <router-link
              to="/login"
              class="text-gray-700 px-2 py-1 transition-all duration-1000 ease-in-out hover:font-medium"
            >
              로그인
            </router-link>
            <router-link
              to="/signup"
              class="text-gray-700 px-2 py-1 transition-all duration-1000 ease-in-out hover:font-medium"
            >
              회원가입
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'NavBar',
  data() {
    return {
      isProfilePopupVisible: false, // 프로필 팝업 상태
    };
  },
  computed: {
    ...mapGetters(['isLoggedIn', 'getRole']), // 로그인 상태와 role
    userRole() {
      return this.getRole; // role 가져오기
    },
  },
  methods: {
    ...mapActions(['logout']),
    toggleProfilePopup() {
      this.isProfilePopupVisible = !this.isProfilePopupVisible; // 프로필 팝업 토글
    },
    logoutHandler() {
      localStorage.removeItem('user'); // 로컬스토리지에서 토큰 삭제
      this.$store.commit('logout');
      this.$router.push({ name: 'home' }); // 홈으로 리디렉션
      this.isProfilePopupVisible = false; // 팝업 닫기
    },
    closePopupIfClickedOutside(event) {
      const profilePopup = this.$refs.profilePopup;
      const profileIcon = this.$refs.profileIcon;
      if (
        profilePopup &&
        !profilePopup.contains(event.target) &&
        !profileIcon.contains(event.target)
      ) {
        this.isProfilePopupVisible = false; // 팝업 닫기
      }
    },
  },
  mounted() {
    // 전체 문서에서 클릭 이벤트 리스너 추가
    document.addEventListener('click', this.closePopupIfClickedOutside);
  },
  beforeUnmount() {
    // 컴포넌트가 파괴될 때 클릭 이벤트 리스너 제거
    document.removeEventListener('click', this.closePopupIfClickedOutside);
  },
};
</script>

<style scoped>
/* 프로필 팝업 스타일 */
.relative {
  position: relative;
}
.profile-popup {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  width: 200px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  z-index: 10;
}
</style>
