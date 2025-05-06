// token.service.js

class TokenService {
    getLocalAccessToken() {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.accessToken;
    }
  
    getLocalRefreshToken() {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.refreshToken;
    }
  
    updateLocalAccessToken(token) {
      let user = JSON.parse(localStorage.getItem("user"));
      user.accessToken = token;
      localStorage.setItem("user", JSON.stringify(user));
    }
  
    saveLoginData(user) {
      localStorage.setItem("user", JSON.stringify(user));  // 로그인 후 토큰 및 사용자 정보 저장
    }
  
    logout() {
      localStorage.removeItem("user"); // 로그아웃 시 로컬 스토리지에서 정보 삭제
    }
  
    getUser() {
      return JSON.parse(localStorage.getItem("user"));
    }
  }
  
  export default new TokenService();
  