// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/home/HomeView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import SignupView from '@/views/auth/SignupView.vue'
import PostsBoardView from '@/views/posts/PostsBoardView.vue'
import MapView from '@/views/map/MapView.vue'
import MyPageView from '@/views/mypage/MyPageView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupView,
  },
  {
    path: '/posts',
    name: 'posts',
    component: PostsBoardView,
  },
  {
    path: '/mypage',
    name: 'mypage',
    component: MyPageView,
  },
  {
    path: '/map',
    name: 'map',
    component: MapView,
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
