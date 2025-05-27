import ApiService from "./api.service";

export class BoardService {
  /**
   * 게시판 종류 전체 조회
   * @returns {Promise} - 게시판 종류 목록 응답
   */
  async getBoards() {
    try {
      const response = await ApiService.publicGet("/board");

      return response;
    } catch (error) {
      throw new Error("게시판 종류 조회 실패");
    }
  }
}

export default new BoardService();
