import axios from 'axios';

// API 기본 URL 설정
const API_URL = '/api/v1';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

/**
 * 여행 관련 API 요청을 처리하는 서비스 클래스
 */
class TravelService {
  constructor() {
    // axios 인스턴스 설정
    this.api = apiClient;
    
    // 요청 인터셉터 설정 (필요시 토큰 등 추가)
    this.api.interceptors.request.use(
      config => {
        // JWT 토큰이 있는 경우 헤더에 추가 (실제 구현 시 수정 필요)
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    // 응답 인터셉터 설정 (에러 처리 등)
    this.api.interceptors.response.use(
      response => {
        // 응답 성공 시 데이터 반환
        return response;
      },
      error => {
        // 에러 응답 처리
        if (error.response) {
          // 서버가 응답을 반환한 경우 (4xx, 5xx 에러)
          console.error('API Error:', error.response.data);
          
          // 401 Unauthorized 에러 시 토큰 만료 처리 (실제 구현 시 수정 필요)
          if (error.response.status === 401) {
            localStorage.removeItem('token');
            // router.push('/login'); // Vue Router가 설정된 경우
          }
        } else if (error.request) {
          // 요청이 만들어졌으나 응답을 받지 못한 경우
          console.error('No response received:', error.request);
        } else {
          // 요청 설정 중 에러가 발생한 경우
          console.error('Request error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * 장소 카테고리 목록을 가져오는 메서드
   * 
   * @returns {Promise<Array>} 카테고리 목록 배열
   */
  async getPlaceCategories() {
    try {
      const response = await this.api.get('/place/category');
      return response.data;
    } catch (error) {
      console.error('Error fetching place categories:', error);
      throw error;
    }
  }
  
  /**
   * 장소 검색 메서드
   * 
   * @param {Object} params 검색 파라미터
   * @param {string} params.query 검색어
   * @param {string} [params.categoryGroupCode] 카테고리 코드
   * @param {number} [params.page=1] 페이지 번호
   * @param {number} [params.size=10] 페이지 크기
   * @returns {Promise<Object>} 검색 결과
   */
  async searchPlaces(params) {
    try {
      const { query, categoryGroupCode, page = 1, size = 10 } = params;
      
      // 필수 파라미터 검증
      if (!query) {
        throw new Error('검색어(query)는 필수 파라미터입니다.');
      }
      
      const response = await this.api.get('/place', { params: {
        query,
        categoryGroupCode,
        page,
        size
      }});
      
      return response.data;
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const travelService = new TravelService();
export default travelService;