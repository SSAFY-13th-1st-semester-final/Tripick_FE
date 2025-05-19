import apiClient from "./api.service";
import TokenService from "./token.service";

class AuthService {
  async login(credentials) {
    try {
      const response = await apiClient.post("/auth/login", credentials);

      const accessToken = response.headers["authorization"]?.replace(
        "Bearer ",
        ""
      );
      const refreshToken = response.headers["refresh-token"];

      if (!accessToken) throw new Error("Access token이 응답 헤더에 없습니다.");

      TokenService.setToken(accessToken);
      if (refreshToken) TokenService.setRefreshToken(refreshToken);

      // 사용자 정보 추출 및 저장
      const decoded = TokenService.getDecodedToken();
      const userId = decoded?.sub || decoded?.user_id || decoded?.userId;
      const userRole = decoded?.role || decoded?.authorities || "USER";
      console.log(decoded);
      const basicUserInfo = {
        id: userId,
        role: userRole,
        tokenExpires: decoded?.exp ? new Date(decoded.exp * 1000) : null,
      };

      localStorage.setItem("user", JSON.stringify(basicUserInfo));

      // 서버로부터 사용자 상세 정보 불러오기
      try {
        const userResponse = await this.getCurrentUser();
        if (userResponse.data?.data) {
          localStorage.setItem("user", JSON.stringify(userResponse.data.data));
        }
      } catch (userErr) {
        console.warn("사용자 정보 조회 실패:", userErr);
      }

      return response;
    } catch (err) {
      console.error("로그인 오류:", err);
      throw err;
    }
  }

  register(userData) {
    return apiClient.post("/member", userData);
  }

  async logout() {
    try {
      try {
        await apiClient.post("/auth/logout");
      } catch (err) {
        console.warn("로그아웃 API 실패:", err);
      }
      this.clearAuthData();
    } catch (err) {
      this.clearAuthData();
      throw err;
    }
  }

  clearAuthData() {
    TokenService.clearAll();
    localStorage.removeItem("user");
  }

  checkUsername(username) {
    return apiClient.get(`/member/check?username=${username}`);
  }

  getCurrentUser() {
    return apiClient.get("/member");
  }

  updateProfile(profileData) {
    return apiClient.put("/member", profileData);
  }

  deleteMember() {
    return apiClient.delete("/member");
  }

  changePassword(passwordData) {
    // 기존 updateProfile 메서드를 활용하되, password 필드만 포함
    return this.updateProfile({ password: passwordData.newPassword });
  }

  getStoredUser() {
    const userStr = localStorage.getItem("user");
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  }

  isLoggedIn() {
    return !!TokenService.getToken();
  }

  isTokenValid() {
    return TokenService.isTokenValid();
  }

  getTokenExpiration() {
    return TokenService.getTokenExpiration();
  }

  getTokenRemainingTime() {
    return TokenService.getTokenRemainingTime();
  }

  getDecodedToken() {
    return TokenService.getDecodedToken();
  }
}

export default new AuthService();
