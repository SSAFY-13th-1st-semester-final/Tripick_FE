import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "token"; // Access Token 저장 키
const REFRESH_TOKEN_KEY = "refreshToken"; // Refresh Token 저장 키
const DECODED_TOKEN_KEY = "decodedToken"; // 디코딩된 Access Token 저장 키

const TokenService = {
  _rememberMe: true, // 기본값

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
    console.log(">>> rememberMe 설정:", rememberMe);
    this._rememberMe = rememberMe.value;
  },

  setToken(token) {
    const storage = this.getStorage();
    storage.setItem(TOKEN_KEY, token);
    this.setDecodedToken(token);
  },

  getToken() {
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
    } catch (error) {
      console.error("디코딩 실패:", error);
    }
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
      console.error("토큰 디코딩 오류:", err);
      return null;
    }
  },

  isTokenValid() {
    const decoded = this.getDecodedToken();
    return decoded?.exp && decoded.exp * 1000 > Date.now();
  },

  getTokenExpiration() {
    const decoded = this.getDecodedToken();
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
  },

  getTokenRemainingTime() {
    const exp = this.getTokenExpiration();
    return exp ? Math.floor((exp.getTime() - Date.now()) / 1000) : null;
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
