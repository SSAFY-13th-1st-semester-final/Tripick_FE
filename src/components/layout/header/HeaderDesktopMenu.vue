<template>
  <div class="hidden md:flex space-x-4 text-xs items-center">
    <router-link to="/map" class="text-gray-700 hover:font-medium"
      >전체조회</router-link
    >
    <router-link to="/posts" class="text-gray-700 hover:font-medium"
      >게시판</router-link
    >
    <router-link to="#" class="text-gray-700 hover:font-medium"
      >공지사항</router-link
    >

    <template v-if="isLoggedIn">
      <div ref="profileIcon" class="relative">
        <img
          src="@/assets/icons/icon_member.svg"
          alt="user icon"
          class="h-5 w-5 cursor-pointer"
          @click.stop="togglePopup"
        />
        <div
          v-if="isProfilePopupVisible"
          ref="profilePopup"
          class="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10"
        >
          <div class="py-2">
            <router-link
              to="/mypage"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-200"
              >마이페이지</router-link
            >
            <template v-if="userRole === 'ADMIN'">
              <router-link
                to="#"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-200"
                >관리자 대시보드</router-link
              >
              <router-link
                to="#"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-200"
                >사용자 관리</router-link
              >
            </template>
            <button
              @click="handleLogout"
              class="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-200"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <router-link to="/login" class="text-gray-700 hover:font-medium"
        >로그인</router-link
      >
    </template>
  </div>
</template>

<script>
export default {
  name: "HeaderDesktopMenu",
  props: {
    isLoggedIn: Boolean,
    userRole: String,
  },
  data() {
    return {
      isProfilePopupVisible: false,
    };
  },
  methods: {
    togglePopup() {
      this.isProfilePopupVisible = !this.isProfilePopupVisible;
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
    handleLogout() {
      this.$store.dispatch("notification/notify", "로그아웃되었습니다.");
      this.$emit("logout");
      this.isProfilePopupVisible = false;
    },
  },
  mounted() {
    this.isProfilePopupVisible = false;
    document.addEventListener("click", this.closePopupIfClickedOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.closePopupIfClickedOutside);
  },
};
</script>
