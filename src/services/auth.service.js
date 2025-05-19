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

      const decoded = TokenService.getDecodedToken();
      const userId = decoded?.sub || decoded?.user_id || decoded?.userId;
      const userRole = decoded?.role || decoded?.authorities?.[0] || "USER";

      const basicUserInfo = {
        id: userId,
        role: userRole,
        tokenExpires: decoded?.exp ? new Date(decoded.exp * 1000) : null,
      };

      localStorage.setItem("user", JSON.stringify(basicUserInfo));

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

  /**
   * 비밀번호 찾기 - 이메일로 인증코드 전송 요청
   * @param {string} email - 사용자 이메일
   * @returns {Promise}
   */
  async sendVerificationCode(email) {
    try {
      const response = await apiClient.post("/auth/code-send", { email });

      if (!response || response.status !== 200) {
        throw new Error("이메일 전송 실패");
      }

      return response;
    } catch (error) {
      console.error("이메일 전송 실패:", error);
      throw error;
    }
  }

  /**
   * 비밀번호 찾기 - 인증코드 검증 요청
   */
  async verifyCode(verificationData) {
    try {
      const response = await apiClient.post(
        "/auth/code-verify",
        verificationData
      );

      if (!response || response.status != 200) {
        throw new Error("확인 실패");
      }

      return response;
    } catch (error) {
      console.error("이메일 코드 인증 실패:", error);
      throw error;
    }
  }

  /**
   * 비밀번호 재설정 요청
   */
  resetPassword(resetData) {
    return apiClient.post("/member/password", resetData);
  }

  /**
   *
   * 아이디 찾기
   * @param {string} verificationData(phonenumber, email)
   * @return {response}
   */
  async findUsername(verificationData) {
    try {
      const response = await apiClient.post("/member/id", verificationData);

      if (!response || response.status != 200) {
        throw new Error("확인 실패");
      }

      return response;
    } catch (error) {
      console.error("아이디 찾기 중 문제 발생:", error);
      throw error;
    }
  }
}

export default new AuthService();
