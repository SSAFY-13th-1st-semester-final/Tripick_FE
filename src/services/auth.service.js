import ApiService from "./api.service";
import TokenService from "./token.service";

class AuthService {
  // 로그인 처리 메서드
  async login(credentials, rememberMe) {
    try {
      // 로그인 요청 - 인증 불필요
      const response = await ApiService.publicPost("/auth/login", credentials);

      // 응답 헤더에서 Access Token, Refresh Token 추출
      const accessToken = response.headers["authorization"]?.replace(
        "Bearer ",
        ""
      );
      const refreshToken = response.headers["refresh-token"];

      if (!accessToken) throw new Error("Access token이 응답 헤더에 없습니다.");

      TokenService.useRememberMe(rememberMe);

      localStorage.setItem("rememberMe", rememberMe.value);

      // 토큰 저장
      TokenService.setToken(accessToken);
      if (refreshToken) TokenService.setRefreshToken(refreshToken);

      // Access Token 디코딩 후 기본 정보 추출
      const decoded = TokenService.getDecodedToken();
      const userId = decoded?.sub || decoded?.user_id || decoded?.userId;
      const userRole = decoded?.role || decoded?.authorities?.[0] || "USER";

      // 기본 사용자 정보 생성
      const basicUserInfo = {
        id: userId,
        role: userRole,
        tokenExpires: decoded?.exp ? new Date(decoded.exp * 1000) : null,
      };

      try {
        // 로그인 성공 후 바로 사용자 정보 조회
        const userResponse = await this.getCurrentUser();

        // 서버에서 조회한 사용자 정보와 토큰 정보 병합
        const fullUserInfo = {
          ...basicUserInfo, // 토큰에서 추출한 기본 정보
          ...userResponse.data.data, // 서버에서 조회한 상세 정보 (우선적용)
        };

        // 병합된 사용자 정보 저장
        const storage = rememberMe.value ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(fullUserInfo));
      } catch (userError) {
        const storage = rememberMe.value ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(basicUserInfo));
      }

      return response;
    } catch (err) {
      throw err;
    }
  }

  // 회원가입 요청 - 인증 불필요
  register(userData) {
    return ApiService.publicPost("/member", userData);
  }

  // 로그아웃 처리
  async logout() {
    try {
      // 서버 로그아웃 요청 (실패해도 진행) - 인증 필요
      try {
        await ApiService.authPost("/auth/logout");
      } catch (err) {
        return null;
      }
      // 토큰 및 사용자 정보 제거
      this.clearAuthData();
    } catch (err) {
      this.clearAuthData();
      throw err;
    }
  }

  // 저장된 인증 관련 정보 모두 제거
  clearAuthData() {
    TokenService.clearAll();
    this.clearUserData();
    this.clearRememberMe();
  }

  clearUserData() {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("newTripInfo");
  }

  clearRememberMe() {
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("rememberMe");
  }

  // 아이디 중복 확인 요청 - 인증 불필요
  checkUsername(username) {
    return ApiService.publicGet(`/member/check?username=${username}`);
  }

  // 현재 로그인된 사용자 정보 조회 - 인증 필요
  getCurrentUser() {
    return ApiService.authGet("/member");
  }

  // 사용자 정보 수정 요청 - 인증 필요
  updateProfile(profileData) {
    return ApiService.authPut("/member", profileData);
  }

  // 회원 탈퇴 요청 - 인증 필요
  deleteMember() {
    return ApiService.authDelete("/member");
  }

  // 비밀번호 변경 (updateProfile을 재사용)
  changePassword(passwordData) {
    return this.updateProfile({ password: passwordData.newPassword });
  }

  // 로컬 스토리지에서 사용자 정보 가져오기
  getStoredUser() {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    const storage = rememberMe ? localStorage : sessionStorage;
    const userStr = storage.getItem("user");

    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      storage.removeItem("user");
      return null;
    }
  }

  // 토큰이 존재하는지 확인 (로그인 여부)
  isLoggedIn() {
    return !!TokenService.getToken();
  }

  // // 토큰이 유효한지 확인 (만료 여부 포함)
  // isTokenValid() {
  //   return TokenService.isTokenValid();
  // }

  // // 토큰 만료 시간 반환
  // getTokenExpiration() {
  //   return TokenService.getTokenExpiration();
  // }

  // // 토큰 남은 시간 반환 (초 단위)
  // getTokenRemainingTime() {
  //   return TokenService.getTokenRemainingTime();
  // }

  // // 디코딩된 토큰 반환
  // getDecodedToken() {
  //   return TokenService.getDecodedToken();
  // }

  /**
   * 이메일로 인증코드 전송 요청 - 인증 불필요
   * @param {string} email - 사용자 이메일
   * @returns {Promise}
   */
  async sendVerificationCode(email) {
    try {
      const response = await ApiService.publicPost("/auth/code-send", {
        email,
      });

      if (!response || response.status !== 200) {
        throw new Error("이메일 전송 실패");
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 인증코드 검증 요청 - 인증 불필요
   * @param {object} verificationData - { email, code }
   * @returns {Promise}
   */
  async verifyCode(verificationData) {
    try {
      const response = await ApiService.publicPost(
        "/auth/code-verify",
        verificationData
      );

      if (!response || response.status != 200) {
        throw new Error("확인 실패");
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 비밀번호 재설정 요청 - 인증 불필요
   * @param {object} resetData - { email, newPassword }
   * @returns {Promise}
   */
  resetPassword(resetData) {
    return ApiService.publicPost("/member/password", resetData);
  }

  /**
   * 아이디 찾기 - 인증 불필요
   * @param {object} verificationData - { phonenumber, email }
   * @returns {Promise}
   */
  async findUsername(verificationData) {
    try {
      const response = await ApiService.publicPost(
        "/member/id",
        verificationData
      );

      if (!response || response.status != 200) {
        throw new Error("확인 실패");
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
