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

      const { x, y } = this.travelStore.centerCoord;

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
      throw error;
    }
  }

  /**
   * 현재 travelStore 상태를 API 요청 바디 형식으로 변환
   */
  buildTripRequestBody() {
    const { tripInfo, itinerary, hotels, tripDates } = this.travelStore;

    const tripPlaces = [];

    itinerary.forEach((dayPlaces, dayIndex) => {
      if (!dayPlaces) return;

      // 해당 일차의 날짜를 toKSTDateString으로 변환
      const date = tripDates[dayIndex]
        ? toKSTDateString(tripDates[dayIndex])
        : null;

      let sequence = 1;

      // 해당 일차의 호텔을 먼저 추가 (sequence 1)
      const dayHotel = hotels[dayIndex];
      if (dayHotel) {
        tripPlaces.push({
          placeId: dayHotel.id,
          placeName: dayHotel.placeName,
          sequence: sequence,
          date: date,
        });
        sequence++;
      }

      // 이후 일반 장소들을 순서대로 추가 (sequence 2부터)
      dayPlaces.forEach((place) => {
        tripPlaces.push({
          placeId: place.id,
          placeName: place.placeName,
          sequence: sequence,
          date: date,
        });
        sequence++;
      });
    });

    // 요청 바디 객체 생성
    return {
      title: tripInfo.title,
      description: tripInfo.memo || "",
      startDate: toKSTDateString(tripInfo.startDate),
      endDate: toKSTDateString(tripInfo.endDate),
      region: tripInfo.region,
      tripPlaces,
    };
  }

  /**
   * 여행 일정 저장 API 호출 - 인증 필요
   */
  async saveTrip() {
    const body = this.buildTripRequestBody();
    try {
      const response = await ApiService.authPost("/trip", body);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 여행 일정 상세 조회
   * <p>tripId에 해당하는 저장된 여행 일정 기록의 상세 정보를 조회합니다.</p>
   * @param {Number} tripId - 여행 일정 id
   * @return {Promise} -여행 일정 기록 상세 정보
   */
  async searchTripInfo(tripId) {
    try {
      const response = await ApiService.authGet(`/trip/${tripId}`);

      const result = this.travelStore.loadTripFromApiResponse(response);

      if (result.success) {
        // notificationStore.showSuccess("여행 기록을 불러왔습니다.");
        console.log("조회 성공");

        if (result.saveWarning) {
          // 저장에 실패한 경우 경고 표시
          // notificationStore.showWarning("₩");
          console.log("조회 결과 저장 실패");
        }
      } else {
        // notificationStore.showError(result.message);
        console.log("조회 에러");
      }
      return result;
    } catch (error) {}
  }
}

const travelService = new TravelService();
export default travelService;
