import ApiService from "./api.service";

import { useTravelStore } from "@/stores/travel";

export class AiService {
  /**
   * 게시글 세 줄 요약 AI 호출 요청
   *
   * @param {Number} postId - 요약을 원하는 게시글 Id
   * @return {Promise} - 게시글 요약 프롬프트 답변
   */
  async getPostSummary(postId) {
    try {
      const response = await ApiService.authGet(
        `/chatbot/post/${postId}/summary`
      );

      return response;
    } catch (error) {
      console.error("ai 요약 호출 에러 : ", error);
    }
  }

  /**
   * AI 여행 일정 평가 (하나의 일차에 대한 평가 요청)
   * @param {Object} params - 평가 요청 파라미터 (예: { dayIndex: 0 })
   * @return {Promise} - 여행일정 평가 정보 응답
   */
  async requestAiTripEvaluation({ dayIndex }) {
    try {
      const travelStore = useTravelStore();

      const day = dayIndex + 1;
      const placeList = travelStore.itinerary[dayIndex] || [];

      const placeIds = placeList
        .filter((place) => place && place.id != null)
        .map((place) => place.id);

      const requestBody = {
        requests: [
          {
            day,
            placeIds,
          },
        ],
      };

      const response = await ApiService.authPost(
        "/chatbot/trip/evaluate",
        requestBody
      );

      return response;
    } catch (error) {
      console.error("여행 일정 평가 에러:", error);
      throw error; // 호출부에서 catch할 수 있도록 다시 throw
    }
  }

  /**
   * Ai 챗봇 상담 메서드
   * @param {string} query - 사용자의 질문
   * @return {Promise} - AI 챗봇의 응답
   */
  async requestAiChat(query) {
    try {
      const response = await ApiService.authPost("/chatbot/chat", { query });
      return response;
    } catch (error) {
      console.error("AI 챗봇 상담 에러:", error);
      throw error; // 호출부에서 catch할 수 있도록 다시 throw
    }
  }
}

export default new AiService();
