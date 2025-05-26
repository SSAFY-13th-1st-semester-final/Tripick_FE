import ApiService from "./api.service";

export class BoardService {
  /**
   * 게시판 종류 전체 조회
   * @returns {Promise} - 게시판 종류 목록 응답
   */
  getBoards() {
    return ApiService.publicGet("/board");
  }
}

export default new BoardService();
