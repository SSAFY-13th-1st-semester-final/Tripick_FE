import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const DECODED_TOKEN_KEY = 'decodedToken'

const TokenService = {
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
    this.setDecodedToken(token)
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(DECODED_TOKEN_KEY)
  },

  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  removeRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  setDecodedToken(token) {
    try {
      const decoded = jwtDecode(token)
      localStorage.setItem(DECODED_TOKEN_KEY, JSON.stringify(decoded))
    } catch (error) {
      console.error('디코딩 실패:', error)
    }
  },

  getDecodedToken() {
    const cached = localStorage.getItem(DECODED_TOKEN_KEY)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        localStorage.removeItem(DECODED_TOKEN_KEY)
      }
    }

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

  isTokenValid() {
    const decoded = this.getDecodedToken()
    if (!decoded || !decoded.exp) return false
    return decoded.exp * 1000 > Date.now()
  },

  getTokenExpiration() {
    const decoded = this.getDecodedToken()
    return decoded?.exp ? new Date(decoded.exp * 1000) : null
  },

  getTokenRemainingTime() {
    const exp = this.getTokenExpiration()
    return exp ? Math.floor((exp.getTime() - Date.now()) / 1000) : null
  },

  clearAll() {
    this.removeToken()
    this.removeRefreshToken()
  }
}

export default TokenService
