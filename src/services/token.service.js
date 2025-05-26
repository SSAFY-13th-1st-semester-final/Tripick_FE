import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "token"; // Access Token 저장 키
const REFRESH_TOKEN_KEY = "refreshToken"; // Refresh Token 저장 키
const DECODED_TOKEN_KEY = "decodedToken"; // 디코딩된 Access Token 저장 키

const TokenService = {
  // localStorage에서 초기값 로드 (문자열 → boolean 변환, 기본값 true)
  _rememberMe: (() => {
    const saved = localStorage.getItem("rememberMe");
    return saved !== null ? JSON.parse(saved) : true;
  })(),

  /**
   * rememberMe 상태에 따라 사용할 저장소 반환
   */
  getStorage() {
    return this._rememberMe ? localStorage : sessionStorage;
  },

  /**
   * 저장소를 설정 (rememberMe: true → localStorage, false → sessionStorage)
   */
  useRememberMe(rememberMe) {
    this._rememberMe = rememberMe.value;
  },

  setToken(token) {
    const storage = this.getStorage();
    storage.setItem(TOKEN_KEY, token);
    this.setDecodedToken(token);
  },

  getToken() {
    console.log(
      "token.service >> getToken >> ",
      this.getStorage().getItem(TOKEN_KEY)
    );
    return this.getStorage().getItem(TOKEN_KEY);
  },

  removeToken() {
    const storage = this.getStorage();
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(DECODED_TOKEN_KEY);
  },

  setRefreshToken(token) {
    this.getStorage().setItem(REFRESH_TOKEN_KEY, token);
  },

  getRefreshToken() {
    return this.getStorage().getItem(REFRESH_TOKEN_KEY);
  },

  removeRefreshToken() {
    this.getStorage().removeItem(REFRESH_TOKEN_KEY);
  },

  setDecodedToken(token) {
    try {
      const decoded = jwtDecode(token);
      this.getStorage().setItem(DECODED_TOKEN_KEY, JSON.stringify(decoded));
    } catch (error) {}
  },

  getDecodedToken() {
    const storage = this.getStorage();
    const cached = storage.getItem(DECODED_TOKEN_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        storage.removeItem(DECODED_TOKEN_KEY);
      }
    }

    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      storage.setItem(DECODED_TOKEN_KEY, JSON.stringify(decoded));
      return decoded;
    } catch (err) {
      return null;
    }
  },

  // 수정된 코드
  getTokenExpiration() {
    const decoded = this.getDecodedToken();
    return decoded?.exp || null; // Unix timestamp (초) 그대로 반환
  },

  // 초 단위로 통일해서 비교
  isTokenValid() {
    const decoded = this.getDecodedToken();
    if (!decoded?.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  },

  // 수정된 코드
  getTokenRemainingTime() {
    const decoded = this.getDecodedToken();
    if (!decoded?.exp) return 0;

    const now = Math.floor(Date.now() / 1000); // 현재 시간 (초)
    const remainingTime = decoded.exp - now; // JWT exp는 이미 초 단위

    return Math.max(0, remainingTime);
  },

  clearAll() {
    [localStorage, sessionStorage].forEach((store) => {
      store.removeItem(TOKEN_KEY);
      store.removeItem(REFRESH_TOKEN_KEY);
      store.removeItem(DECODED_TOKEN_KEY);
    });
  },
};

export default TokenService;
