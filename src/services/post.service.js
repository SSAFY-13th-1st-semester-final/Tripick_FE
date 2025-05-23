import ApiService from "./api.service";

export class PostService {
  /**
   * 게시글 목록 조회 - 인증 불필요
   * @param {Number} page - 페이지 번호
   * @param {Number} size - 페이지 크기
   * @param {String} boardType - 게시판 타입
   * @returns {Promise} - 게시글 목록 응답
   */
  getPosts(page = 0, size = 10, boardType = "GENERAL_FORUM") {
    return ApiService.publicGet("/posts", {
      params: { page, size, boardType },
    });
  }

  // getPosts(boardType = "GENERAL_FORUM") {
  //   return ApiService.publicGet("/posts", { params: { boardType } });
  // }

  /**
   * 게시글 상세 조회 - 인증 불필요
   * @param {Number} postId - 게시글 ID
   * @returns {Promise} - 게시글 상세 응답
   */
  getPostById(postId) {
    return ApiService.publicGet(`/posts/${postId}`);
  }

  /**
   * 게시글 작성 - 인증 필요
   * @param {Object} postData - 게시글 데이터
   * @returns {Promise} - 게시글 작성 응답
   */
  createPost(postData) {
    return ApiService.authPost("/posts", postData);
  }

  /**
   * 게시글 수정 - 인증 필요
   * @param {Object} postData - 수정할 게시글 데이터
   * @returns {Promise} - 게시글 수정 응답
   */
  updatePost(postData) {
    return ApiService.authPut(`/posts/${postData.postId}`, postData);
  }

  /**
   * 게시글 삭제 - 인증 필요
   * @param {Number} postId - 삭제할 게시글 ID
   * @returns {Promise} - 게시글 삭제 응답
   */
  deletePost(postId) {
    return ApiService.authDelete(`/posts/${postId}`);
  }

  /**
   * 이미지 파일 DB 업로드 - 인증 필요
   * @param {File} imageFile - 업로드할 이미지 파일
   * @returns {Promise<string>} - 업로드된 이미지 파일의 URL
   */
  static async uploadImage(imageFile) {
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("image", imageFile);

      // API 호출 - 파일 업로드용 메서드 사용
      const response = await ApiService.uploadFile("/image", formData);

      // 응답에서 이미지 URL 반환
      return response.data.data.url;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      throw new Error("이미지 업로드에 실패했습니다.");
    }
  }

  /**
   * DB에 업로드되어 있었던 사진을 삭제 처리합니다.
   *
   * @param {File} imageUrl - 삭제할 이미지의 Url
   * @returns {Promise} - 삭제 응답
   */
  static async deleteImage(imageUrl) {
    console.log(">>>>>>>>>>>>>>>>>>>>>> ", imageUrl);

    try {
      const response = await ApiService.authDelete(
        `/image?imageUrl=${imageUrl}`
      );

      return response;
    } catch (error) {
      console.error("이미지 삭제 실패:", error);
      throw new Error("이미지 삭제에 실패했습니다.");
    }
  }
}

export default new PostService();
