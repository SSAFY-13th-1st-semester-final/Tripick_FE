import axios from "axios";
import router from "@/router";
import TokenService from "@/services/token.service";

// API 기본 URL 설정
const API_URL = "/api/v1";

// 토큰 리프레시 중인지 확인하는 플래그
let isRefreshing = false;

// 리프레시 토큰 진행 중에 대기하는 요청들
let refreshSubscribers = [];

// 대기 중인 요청을 등록하는 메서드
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// 리프레시 성공시 대기 중인 요청들을 실행하는 메서드
const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// 리프레시 실패시 대기 중인 요청들을 모두 취소하는 메서드
const onRefreshFailed = (error) => {
  refreshSubscribers = [];
  return Promise.reject(error);
};

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
});

// 토큰 리프레시 함수
const refreshAccessToken = async () => {
  try {
    // TokenService를 이용해서 사용자의 리프레쉬 토큰 가져오기
    const refreshToken = TokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Refresh token not found");
    }


    // 리프레시 토큰으로 새 액세스 토큰 요청
    const response = await axios.post(
      `${API_URL}/auth/token/refresh`,
      {}, // 필요한 경우 요청 본문 추가
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${refreshToken}`, // 리프레시 토큰을 헤더에 포함
        },
      }
    );

    // 응답 헤더에서 새 액세스 토큰 추출
    const newAccessToken = response.headers["authorization"];

    if (!newAccessToken) {
      throw new Error("New access token not found in response headers");
    }

    // Bearer 접두사가 있으면 제거
    const tokenValue = newAccessToken.startsWith("Bearer ")
      ? newAccessToken.slice(7)
      : newAccessToken;

    // 토큰 저장 (자동으로 디코딩도 수행됨)
    TokenService.setToken(tokenValue);

    return tokenValue;
  } catch (error) {
    // 리프레시 실패 - 모든 토큰 삭제 후 로그인 화면으로 리다이렉트
    console.error("Token refresh failed:", error);

    // TokenService를 사용하여 모든 토큰 정보 제거
    TokenService.clearAll();

    // 로그인 페이지로 리다이렉트
    router.push({
      name: "login",
      query: { redirect: router.currentRoute.value.fullPath },
    });

    throw error;
  }
};

// 요청 인터셉터 설정
apiClient.interceptors.request.use(
  async (config) => {
    // 로그인 요청의 경우 토큰 없이 진행
    if (config.url === "/auth/login" && config.method === "post") {
      return config;
    }

    // 리프레시 토큰 요청은 특별히 처리하지 않음
    if (config.url === "/auth/token/refresh" && config.method === "post") {
      return config;
    }

    // 액세스 토큰이 유효한지 확인
    if (!TokenService.isTokenValid() && !config._retry) {

      // 이미 리프레시 진행 중인 경우 대기 후 처리
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            config.headers["Authorization"] = `Bearer ${token}`;
            resolve(config);
          });
        });
      }

      // 리프레시 진행 상태로 변경
      isRefreshing = true;
      config._retry = true;

      try {
        // 리프레시 토큰으로 새 액세스 토큰 발급 요청
        const newAccessToken = await refreshAccessToken();

        // 대기 중인 요청들에게 새 토큰 전달
        onRefreshed(newAccessToken);

        // 현재 요청에 새 토큰 설정
        config.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // 리프레시 상태 종료
        isRefreshing = false;

        return config;
      } catch (error) {
        // 리프레시 실패 - 대기 중인 요청들 모두 취소
        console.error("요청 인터셉터에서 토큰 리프레시 실패:", error);
        onRefreshFailed(error);
        isRefreshing = false;
        return Promise.reject(error);
      }
    }

    // 그 외 요청에는 액세스 토큰 추가 (TokenService 사용)
    const token = TokenService.getToken();

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 오류 응답이 없는 경우 (네트워크 오류 등)
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, config } = error.response;

    // 이미 토큰 리프레시를 요청한 경우나 리프레시 토큰 요청인 경우는 다시 시도하지 않음
    if (
      config.url === "/auth/token/refresh" ||
      config._retry ||
      config._isRefreshRequest
    ) {
      return Promise.reject(error);
    }

    // 401 Unauthorized 에러 처리 (토큰 만료 등)
    if (status === 401) {
      // 로그인 요청은 예외 처리
      if (config.url === "/auth/login" && config.method === "post") {
        return Promise.reject(error);
      }

      // 이미 리프레시 진행 중인 경우 대기 후 재시도
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            config.headers["Authorization"] = `Bearer ${token}`;
            resolve(apiClient(config));
          });
        }).catch((error) => {
          return Promise.reject(error);
        });
      }

      // 리프레시 진행 상태로 변경
      isRefreshing = true;
      config._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        onRefreshed(newAccessToken);

        // 현재 요청 재시도
        config.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // 리프레시 상태 종료
        isRefreshing = false;

        // 원래 요청 재시도
        return apiClient(config);
      } catch (refreshError) {
        // 리프레시 실패 - 대기 중인 요청들 모두 취소
        onRefreshFailed(refreshError);
        isRefreshing = false;

        // 로그인 페이지로 리다이렉트는 refreshAccessToken 함수 내에서 처리
        return Promise.reject(refreshError);
      }
    }

    // 403 Forbidden 에러 처리
    if (status === 403) {
      router.push({ name: "home" });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
