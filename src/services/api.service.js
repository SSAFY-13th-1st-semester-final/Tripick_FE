// src/services/api.service.js
import axios from "axios";
import router from "@/router";
import TokenService from "@/services/token.service";

const API_URL = "/api/v1";

// 토큰 리프레시 관련 변수들
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

const onRefreshFailed = (error) => {
  refreshSubscribers = [];
  return Promise.reject(error);
};

// 토큰 리프레시 함수
const refreshAccessToken = async () => {
  try {
    const refreshToken = TokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Refresh token not found");
    }

    const response = await axios.post(
      `${API_URL}/auth/token/refresh`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    const newAccessToken = response.headers["authorization"];
    if (!newAccessToken) {
      throw new Error("New access token not found in response headers");
    }

    const tokenValue = newAccessToken.startsWith("Bearer ")
      ? newAccessToken.slice(7)
      : newAccessToken;

    TokenService.setToken(tokenValue);
    return tokenValue;
  } catch (error) {
    console.error("Token refresh failed:", error);
    TokenService.clearAll();
    router.push({
      name: "login",
      query: { redirect: router.currentRoute.value.fullPath },
    });
    throw error;
  }
};

// 기본 Axios 인스턴스 (토큰 포함)
const createAuthenticatedClient = () => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 10000,
  });

  // 요청 인터셉터
  client.interceptors.request.use(
    async (config) => {
      // skipAuth 옵션이 있으면 토큰 처리 건너뛰기
      if (config.skipAuth) {
        return config;
      }

      // 토큰 유효성 확인 및 리프레시 로직
      if (!TokenService.isTokenValid() && !config._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              config.headers["Authorization"] = `Bearer ${token}`;
              resolve(config);
            });
          });
        }

        isRefreshing = true;
        config._retry = true;

        try {
          const newAccessToken = await refreshAccessToken();
          onRefreshed(newAccessToken);
          config.headers["Authorization"] = `Bearer ${newAccessToken}`;
          isRefreshing = false;
          return config;
        } catch (error) {
          onRefreshFailed(error);
          isRefreshing = false;
          return Promise.reject(error);
        }
      }

      const token = TokenService.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // 응답 인터셉터
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!error.response) {
        return Promise.reject(error);
      }

      const { status, config } = error.response;

      if (config.skipAuth || config._retry || config._isRefreshRequest) {
        return Promise.reject(error);
      }

      if (status === 401) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              config.headers["Authorization"] = `Bearer ${token}`;
              resolve(client(config));
            });
          }).catch((error) => Promise.reject(error));
        }

        isRefreshing = true;
        config._retry = true;

        try {
          const newAccessToken = await refreshAccessToken();
          onRefreshed(newAccessToken);
          config.headers["Authorization"] = `Bearer ${newAccessToken}`;
          isRefreshing = false;
          return client(config);
        } catch (refreshError) {
          onRefreshFailed(refreshError);
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
      }

      if (status === 403) {
        router.push({ name: "home" });
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// 공개 Axios 인스턴스 (토큰 불포함)
const createPublicClient = () => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 10000,
  });
};

// 인스턴스 생성
const authClient = createAuthenticatedClient();
const publicClient = createPublicClient();

// API 서비스 클래스
class ApiService {
  // === 공개 API 메서드들 (토큰 불필요) ===
  
  // 공개 GET 요청
  static async publicGet(url, config = {}) {
    try {
      const response = await publicClient.get(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 공개 POST 요청
  static async publicPost(url, data = {}, config = {}) {
    try {
      const response = await publicClient.post(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // === 인증 필요 API 메서드들 (토큰 포함) ===
  
  // 인증 GET 요청
  static async authGet(url, config = {}) {
    try {
      const response = await authClient.get(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 인증 POST 요청
  static async authPost(url, data = {}, config = {}) {
    try {
      const response = await authClient.post(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 인증 PUT 요청
  static async authPut(url, data = {}, config = {}) {
    try {
      const response = await authClient.put(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 인증 DELETE 요청
  static async authDelete(url, config = {}) {
    try {
      const response = await authClient.delete(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // === 유연한 요청 메서드 (옵션으로 제어) ===
  
  // skipAuth 옵션을 사용한 GET 요청
  static async get(url, config = {}) {
    try {
      const response = await authClient.get(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // skipAuth 옵션을 사용한 POST 요청
  static async post(url, data = {}, config = {}) {
    try {
      const response = await authClient.post(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // skipAuth 옵션을 사용한 PUT 요청
  static async put(url, data = {}, config = {}) {
    try {
      const response = await authClient.put(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // skipAuth 옵션을 사용한 DELETE 요청
  static async delete(url, config = {}) {
    try {
      const response = await authClient.delete(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // === 파일 업로드 메서드 ===
  
  // 파일 업로드 (인증 필요)
  static async uploadFile(url, formData, config = {}) {
    try {
      const response = await authClient.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config.headers,
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // === 에러 처리 ===
  
  static handleError(error) {
    if (error.response) {
      // 서버가 에러 응답을 반환한 경우
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data.message || '잘못된 요청입니다.');
        case 401:
          throw new Error('인증이 필요합니다.');
        case 403:
          throw new Error('접근 권한이 없습니다.');
        case 404:
          throw new Error('요청한 리소스를 찾을 수 없습니다.');
        case 500:
          throw new Error('서버 내부 오류가 발생했습니다.');
        default:
          throw new Error(data.message || '알 수 없는 오류가 발생했습니다.');
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      throw new Error('서버에 연결할 수 없습니다.');
    } else {
      // 요청 설정 중 오류가 발생한 경우
      throw new Error(error.message || '요청 처리 중 오류가 발생했습니다.');
    }
  }

  // === 직접 클라이언트 접근 (고급 사용자용) ===
  
  static get authClient() {
    return authClient;
  }

  static get publicClient() {
    return publicClient;
  }
}

export default ApiService;