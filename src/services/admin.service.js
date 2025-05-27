import ApiService from "./api.service";

class AdminService {
  /**
   * 탈퇴한 회원 복구
   * @param {number} memberId - 복구할 회원의 ID
   * @return {Promise} - 복구 응답
   */
  async restoreMember(memberId) {
    try {
      const response = await ApiService.authPost(`/admin/member/restore`, {
        memberId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 회원 refresh token 만료시키기기 요청
   * @param {number} memberId - 복구할 회원의 ID
   * @return {Promise} - 복구 응답
   */
  async expireMemberRefreshToken(memberId) {
    try {
      const response = await ApiService.authDelete(
        `/admin/member/${memberId}/refresh`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 회원 목록 조회
   * @param {Object} params - 쿼리 파라미터
   * @param {boolean} [params.isDeleted] - 탈퇴 여부 필터
   * @param {number} [params.page=0] - 페이지 번호
   * @param {number} [params.size=10] - 페이지 크기
   * @return {Promise} - 회원 목록 응답
   */
  async getMemberList(params = {}) {
    try {
      const { isDeleted, page = 0, size = 10, sort = [] } = params;

      const queryParams = new URLSearchParams();

      // 조건에 따라 파라미터 추가
      if (typeof isDeleted === "boolean") {
        queryParams.append("isDeleted", isDeleted);
      }

      queryParams.append("page", page.toString());
      queryParams.append("size", size.toString());

      const response = await ApiService.authGet(
        `/admin/member?${queryParams.toString()}`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new AdminService();
