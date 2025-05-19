import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'token' // Access Token 저장 키
const REFRESH_TOKEN_KEY = 'refreshToken' // Refresh Token 저장 키
const DECODED_TOKEN_KEY = 'decodedToken' // 디코딩된 Access Token 저장 키

const TokenService = {

  // Access Token 저장 및 디코딩 저장
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token) // 토큰 원본 저장
    this.setDecodedToken(token) // 디코딩 결과 저장
  },

  // ✅ Access Token 가져오기
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  // ✅ Access Token 및 디코딩 정보 제거
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(DECODED_TOKEN_KEY)
  },

  // ✅ Refresh Token 저장
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  // ✅ Refresh Token 가져오기
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  // ✅ Refresh Token 제거
  removeRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  // ✅ Access Token 디코딩 후 저장
  setDecodedToken(token) {
    try {
      const decoded = jwtDecode(token)
      localStorage.setItem(DECODED_TOKEN_KEY, JSON.stringify(decoded))
    } catch (error) {
      console.error('디코딩 실패:', error)
    }
  },

  // ✅ 디코딩된 Access Token 정보 가져오기
  getDecodedToken() {
    const cached = localStorage.getItem(DECODED_TOKEN_KEY)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // 파싱 실패 시 캐시 제거
        localStorage.removeItem(DECODED_TOKEN_KEY)
      }
    }

    // 캐시에 없으면 다시 디코딩 시도
    const token = this.getToken()
    if (!token) return null

    try {
      const decoded = jwtDecode(token)
      localStorage.setItem(DECODED_TOKEN_KEY, JSON.stringify(decoded))
      return decoded
    } catch (err) {
      console.error('토큰 디코딩 오류:', err)
      return null
    }
  },

  // ✅ Access Token이 유효한지 여부 (만료 시간 기준)
  isTokenValid() {
    const decoded = this.getDecodedToken()
    if (!decoded || !decoded.exp) return false
    return decoded.exp * 1000 > Date.now() // 만료 시간이 현재 시간보다 미래여야 유효
  },

  // ✅ Access Token의 만료 시간 반환 (Date 객체)
  getTokenExpiration() {
    const decoded = this.getDecodedToken()
    return decoded?.exp ? new Date(decoded.exp * 1000) : null
  },

  // ✅ Access Token 남은 시간(초) 반환
  getTokenRemainingTime() {
    const exp = this.getTokenExpiration()
    return exp ? Math.floor((exp.getTime() - Date.now()) / 1000) : null
  },

  // ✅ 모든 토큰 정보 제거 (Access + Refresh + 디코딩 정보)
  clearAll() {
    this.removeToken()
    this.removeRefreshToken()
  }
}

export default TokenService
