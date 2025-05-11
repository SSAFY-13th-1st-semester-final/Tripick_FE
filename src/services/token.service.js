class TokenService {
  // accessToken
  getAccessToken() {
    return localStorage.getItem("access-token");
  }

  setAccessToken(token) {
    localStorage.setItem("access-token", token);
  }

  // refreshToken
  getRefreshToken() {
    return localStorage.getItem("refresh-token");
  }

  setRefreshToken(token) {
    localStorage.setItem("refresh-token", token);
  }

  // 로그아웃 시 모든 토큰 제거
  clear() {
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

  }
}

export default new TokenService();
