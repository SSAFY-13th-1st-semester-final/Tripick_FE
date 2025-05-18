import axios from 'axios'
import router from '@/router'

// API 기본 URL 설정
const API_URL = '/api/v1'

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
})

// 요청 인터셉터 설정
apiClient.interceptors.request.use(
  config => {
    // 로그인 요청의 경우 토큰 없이 진행
    if (config.url === '/auth/login' && config.method === 'post') {
      return config
    }
    
    // 그 외 요청에는 토큰 추가
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const { status, config } = error.response || {}
    
    // 401 Unauthorized 에러 처리 (토큰 만료 등)
    if (status === 401) {
      // 로그인 요청은 예외 처리
      if (config.url === '/auth/login' && config.method === 'post') {
        return Promise.reject(error)
      }
      
      // 리프레시 토큰이 있는 경우 토큰 갱신 시도 가능
      // TODO: 리프레시 토큰 로직 구현
      
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // 로그인 페이지로 리다이렉트
      router.push({ 
        name: 'login',
        query: { redirect: router.currentRoute.value.fullPath }
      })
    }
    
    // 403 Forbidden 에러 처리
    if (status === 403) {
      router.push({ name: 'home' })
    }
    
    return Promise.reject(error)
  }
)

export default apiClient