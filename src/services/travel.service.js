import { useTravelStore } from "@/stores/travel";

import ApiService from "./api.service";

import { toKSTDateString } from "@/utils/formatters.js";

/**
 * 여행 관련 API 요청을 처리하는 서비스 클래스
 */
class TravelService {
  constructor() {
    this.travelStore = useTravelStore();
  }

  /**
   * 장소 카테고리 목록을 가져오는 메서드 - 인증 필요
   *
   * @returns {Promise<Array>} 카테고리 목록 배열
   */
  async getPlaceCategories() {
    try {
      const response = await ApiService.authGet("/place/category");
      return response.data;
    } catch (error) {
      console.error("Error fetching place categories:", error);
      throw error;
    }
  }

  /**
   * 장소 검색 메서드 - 인증 필요
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

      console.log(">>>", this.travelStore.centerCoord);

      const { x, y } = this.travelStore.centerCoord;

      console.log(x, y);

      // 필수 파라미터 검증
      if (!query) {
        throw new Error("검색어(query)는 필수 파라미터입니다.");
      }

      const response = await ApiService.authGet("/place", {
        params: {
          query,
          categoryGroupCode,
          page,
          size,
          x,
          y,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error searching places:", error);
      throw error;
    }
  }

  /**
   * 전체 여행 일정의 최단 경로 조회 (파라미터 없이 스토어에서 자동으로 데이터 가져옴) - 인증 필요
   * @returns {Promise<Object>} 최단 경로 결과
   */
  async getOptimalPaths() {
    try {
      // Pinia 스토어에서 데이터 직접 가져오기
      const { useTravelStore } = await import("@/stores/travel");
      const travelStore = useTravelStore();

      // travel.js의 apiFormat getter를 사용하여 데이터 변환
      const apiFormatData = travelStore.apiFormat;

      // 경로 조회할 일차가 있는지 확인
      const validRequests = apiFormatData.filter((dayItinerary) => {
        return (
          dayItinerary.startPlaceId &&
          dayItinerary.placeIds &&
          dayItinerary.placeIds.length > 0
        );
      });

      if (validRequests.length === 0) {
        throw new Error(
          "경로 조회할 수 있는 일차가 없습니다. (출발지와 방문지가 모두 필요합니다)"
        );
      }

      // API 요청
      const response = await ApiService.authPost("/place/path", {
        requests: validRequests,
      });
      travelStore.incrementRouteApiCall();

      // 결과를 result 스토어에 저장
      travelStore.reorderPlacesByOptimizedRoutes(response.data.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching optimal paths:", error);
      throw error;
    }
  }

  /**
   * 현재 travelStore 상태를 API 요청 바디 형식으로 변환
   */
  buildTripRequestBody() {
    const { tripInfo, itinerary, hotels, tripDates } = this.travelStore;

    // tripPlaces 배열 생성
    // itinerary는 2차원 배열: itinerary[0]은 1일차 장소 배열
    // 각 장소는 { placeId, sequence, date } 형태로 변환

    const tripPlaces = [];

    itinerary.forEach((dayPlaces, dayIndex) => {
      if (!dayPlaces) return;

      // 해당 일차의 날짜를 toKSTDateString으로 변환
      const date = tripDates[dayIndex]
        ? toKSTDateString(tripDates[dayIndex])
        : null;

      dayPlaces.forEach((place, seqIndex) => {
        tripPlaces.push({
          placeId: place.id,
          placeName: place.placeName,
          sequence: seqIndex + 1,
          date: date, // 변환된 날짜 적용
        });
      });
    });

    console.log(tripInfo.startDate);

    // 요청 바디 객체 생성
    return {
      title: tripInfo.title,
      description: tripInfo.memo || "",
      startDate: toKSTDateString(tripInfo.startDate), // ✅ 적용
      endDate: toKSTDateString(tripInfo.endDate), // ✅ 적용
      region: `${tripInfo.region?.provinceName ?? ""} ${
        tripInfo.region?.districtName ?? ""
      }`.trim(),
      tripPlaces,
    };
  }

  /**
   * 여행 일정 저장 API 호출 - 인증 필요
   */
  async saveTrip() {
    const body = this.buildTripRequestBody();
    console.log(body);
    console.log(JSON.stringify(body, null, 2));
    try {
      const response = await ApiService.authPost("/trip", body);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const travelService = new TravelService();
export default travelService;
