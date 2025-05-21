import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// 레이아웃
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

const HomeView = () => import("@/views/HomeView.vue");

const TripPlannerView = () => import("@/views/travels/TripPlannerView.vue");

const ProfileView = () => import("@/views/users/ProfileView.vue");

const LoginView = () => import("@/views/auth/LoginView.vue");
const SignupView = () => import("@/views/auth/SignupView.vue");
const ForgotPasswordView = () => import("@/views/auth/ForgotPasswordView.vue");
const ForgotUsernameView = () => import("@/views/auth/ForgotUsernameView.vue");
const ResetPasswordView = () => import("@/views/auth/ResetPasswordView.vue");
const ChangePasswordView = () => import("@/views/auth/ChangePasswordView.vue");

// posts 관련 뷰 컴포넌트
const PostsListView = () => import("@/views/posts/PostsListView.vue");
const PostDetailView = () => import("@/views/posts/PostDetailView.vue");
const PostFormView = () => import("@/views/posts/PostFormView.vue");

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
              title: "여행 일정 계획",
            },
          },
        ],
      },

      // posts 라우트 추가
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
      // 아이디 찾기 라우트 추가
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
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

// router/index.js의 beforeEach 수정
router.beforeEach((to, from, next) => {
  console.log('=== 라우팅 디버깅 ===')
  console.log('이동할 경로:', to.path)
  console.log('라우트 이름:', to.name)
  console.log('매칭된 라우트들:', to.matched)
  
  // 페이지 제목 설정
  document.title = to.meta.title || "Trap!ck";

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const authStore = useAuthStore();
  
  console.log('인증 필요 여부:', requiresAuth)
  console.log('현재 인증 상태:', authStore.isAuthenticated)

  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('인증 실패로 로그인 페이지로 리다이렉트')
    next({
      name: "login",
      query: { redirect: to.fullPath },
    });
  } else if (
    to.matched.some((record) => record.meta.guest) &&
    authStore.isAuthenticated
  ) {
    console.log('이미 로그인된 사용자가 guest 페이지 접근, 홈으로 리다이렉트')
    next({ name: "home" });
  } else {
    console.log('정상 라우팅 진행')
    next();
  }
});

export default router;
