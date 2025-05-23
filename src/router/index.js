import { createRouter, createWebHistory } from "vue-router";

/**
 * 레이아웃 컴포넌트
 */
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

/**
 * 뷰 컴포넌트들 (Lazy Loading)
 */
const HomeView = () => import("@/views/HomeView.vue");
const TripPlannerView = () => import("@/views/travels/TripPlannerView.vue");
const TripEasyPlannerView = () =>
  import("@/views/travels/TripEasyPlannerView.vue");
const ProfileView = () => import("@/views/users/ProfileView.vue");

/**
 * 인증 관련 뷰 컴포넌트들
 */
const LoginView = () => import("@/views/auth/LoginView.vue");
const SignupView = () => import("@/views/auth/SignupView.vue");
const ForgotPasswordView = () => import("@/views/auth/ForgotPasswordView.vue");
const ForgotUsernameView = () => import("@/views/auth/ForgotUsernameView.vue");
const ResetPasswordView = () => import("@/views/auth/ResetPasswordView.vue");
const ChangePasswordView = () => import("@/views/auth/ChangePasswordView.vue");

/**
 * 게시글 관련 뷰 컴포넌트들
 */
const PostsListView = () => import("@/views/posts/PostsListView.vue");
const PostDetailView = () => import("@/views/posts/PostDetailView.vue");
const PostFormView = () => import("@/views/posts/PostFormView.vue");

/**
 * 라우트 설정
 */
const routes = [
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "",
        name: "home",
        component: HomeView,
        meta: {
          title: "홈",
        },
      },
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
        meta: {
          requiresAuth: true,
          title: "내 프로필",
        },
      },
      {
        path: "/travel",
        children: [
          {
            path: "create",
            name: "travel-create",
            component: HomeView,
            meta: {
              title: "여행 계획 생성",
              showTripModal: true,
            },
          },
          {
            path: "planner",
            name: "travel-planner",
            component: TripPlannerView,
            meta: {
              requiresAuth: true,
              title: "여행 일정 계획",
            },
          },
          {
            path: "travel-planning",
            name: "travel-planning",
            component: TripEasyPlannerView,
            meta: {
              title: "여행 계획 쉽게 시작하기",
            },
          },
        ],
      },
      /**
       * 게시글 관련 라우트
       */
      {
        path: "posts",
        name: "posts-list",
        component: PostsListView,
        meta: {
          title: "게시글 목록",
          saveScrollPosition: true,
        },
      },
      {
        path: "posts/:id",
        name: "post-detail",
        component: PostDetailView,
        props: true,
        meta: {
          title: "게시글 상세",
        },
      },
      {
        path: "posts/create",
        name: "post-create",
        component: PostFormView,
        meta: {
          requiresAuth: true,
          title: "게시글 작성",
        },
      },
      {
        path: "posts/:id/edit",
        name: "post-edit",
        component: PostFormView,
        props: true,
        meta: {
          requiresAuth: true,
          title: "게시글 수정",
        },
      },
    ],
  },
  {
    path: "/auth",
    component: AuthLayout,
    children: [
      {
        path: "login",
        name: "login",
        component: LoginView,
        meta: {
          guest: true,
          title: "로그인",
        },
      },
      {
        path: "signup",
        name: "signup",
        component: SignupView,
        meta: {
          guest: true,
          title: "회원가입",
        },
      },
      {
        path: "forgot-password",
        name: "forgot-password",
        component: ForgotPasswordView,
        meta: {
          guest: true,
          title: "비밀번호 찾기",
        },
      },
      {
        path: "reset-password/:email?",
        name: "reset-password",
        component: ResetPasswordView,
        props: true,
        meta: {
          guest: true,
          title: "비밀번호 재설정",
        },
      },
      {
        path: "change-password/:email?",
        name: "change-password",
        component: ChangePasswordView,
        props: true,
        meta: {
          requiresAuth: true,
          title: "비밀번호 재설정",
        },
      },
      {
        path: "forgot-username",
        name: "forgot-username",
        component: ForgotUsernameView,
        meta: {
          guest: true,
          title: "아이디 찾기",
        },
      },
    ],
  },
];

/**
 * Vue Router 인스턴스 생성
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  /**
   * 스크롤 동작 설정
   */
  scrollBehavior(to, from, savedPosition) {
    // saveScrollPosition 메타 필드가 있는 경우 스크롤 위치 저장
    if (to.meta.saveScrollPosition && from.meta.saveScrollPosition) {
      return false; // 스크롤 위치 변경 없음
    }

    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

/**
 * 네비게이션 가드
 * 인증 및 권한 검사를 수행합니다.
 */
router.beforeEach(async (to, from, next) => {
  // 페이지 제목 설정
  document.title = to.meta.title || "Trap!ck";

  // 인증이 필요한 라우트인지 확인
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  /**
   * 인증이 필요한 페이지 접근 시 검사
   */
  if (requiresAuth) {
    try {
      // 동적으로 스토어 import
      const { useAuthStore } = await import("@/stores/auth");
      const { useNotificationStore } = await import("@/stores/notification");

      const authStore = useAuthStore();
      const notificationStore = useNotificationStore();

      // 로그인되지 않은 경우
      if (!authStore.isAuthenticated) {
        notificationStore.showWarning("로그인 후 이용할 수 있는 페이지입니다.");

        next({
          name: "login",
          query: { redirect: to.fullPath },
        });
        return;
      }
    } catch (error) {
      next({ name: "home" });
      return;
    }
  }

  /**
   * 게스트 전용 페이지 접근 시 검사
   * (이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시)
   */
  if (to.matched.some((record) => record.meta.guest)) {
    try {
      // 동적으로 auth 스토어 import
      const { useAuthStore } = await import("@/stores/auth");
      const authStore = useAuthStore();

      // 이미 로그인된 사용자인 경우 홈으로 리다이렉트
      if (authStore.isAuthenticated) {
        next({ name: "home" });
        return;
      }
    } catch (error) {}
  }

  next();
});

export default router;
