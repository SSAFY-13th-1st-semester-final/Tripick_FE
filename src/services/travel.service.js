import apiClient from "./api.service";

/**
 * 여행 관련 API 요청을 처리하는 서비스 클래스
 */
class TravelService {
  /**
   * 장소 카테고리 목록을 가져오는 메서드
   *
   * @returns {Promise<Array>} 카테고리 목록 배열
   */
  async getPlaceCategories() {
    try {
      const response = await apiClient.get("/place/category");
      return response.data;
    } catch (error) {
      console.error("Error fetching place categories:", error);
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
        throw new Error("검색어(query)는 필수 파라미터입니다.");
      }

      const response = await apiClient.get("/place", {
        params: {
          query,
          categoryGroupCode,
          page,
          size,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error searching places:", error);
      throw error;
    }
  }
}

const travelService = new TravelService();
export default travelService;
