import ApiService from "./api.service";

export class PostService {
  /**
   * 게시글 목록 조회 - 인증 불필요
   * @param {Object} options - 조회 옵션
   * @param {Number} [options.page] - 페이지 번호 (기본값: 0, API는 0부터 시작)
   * @param {Number} [options.size] - 페이지 크기 (기본값: 10)
   * @param {Array<String>} [options.sort] - 정렬 기준 배열 (예: ["createdAt,desc"])
   * @param {String} [options.boardType] - 게시판 타입 (기본값: "GENERAL_FORUM")
   * @param {String} [options.searchType] - 검색 기준 (title, content, title_content, nickname)
   * @param {String} [options.keyword] - 검색 키워드
   * @returns {Promise} - 게시글 목록 응답
   */
  getPosts(options = {}) {
    const { page, size, sort, boardType, searchType, keyword } = options;

    // 파라미터 검증
    if (
      searchType &&
      !["title", "content", "title_content", "nickname"].includes(searchType)
    ) {
      throw new Error(
        "Invalid searchType. Must be one of: title, content, title_content, nickname"
      );
    }

    // 기본값 설정 및 파라미터 구성
    const params = {
      page: page !== undefined ? page : 0,
      size: size !== undefined ? size : 10,
    };

    // sort 배열이 있는 경우에만 추가
    if (sort && sort.length > 0) {
      params.sort = sort;
    }

    // 게시판 타입과 검색 파라미터 추가
    if (boardType !== undefined) params.boardType = boardType;
    if (searchType) params.searchType = searchType;
    if (keyword) params.keyword = keyword;

    return ApiService.publicGet("/posts", { params });
  }

  /**
   * 게시글 검색 - 검색 전용 메서드
   * @param {String} keyword - 검색 키워드 (필수)
   * @param {Object} options - 추가 옵션
   * @returns {Promise} - 검색 결과
   */
  searchPosts(keyword, options = {}) {
    if (!keyword || keyword.trim() === "") {
      throw new Error("검색 키워드는 필수입니다.");
    }

    return this.getPosts({
      keyword: keyword.trim(),
      searchType: "title_content", // 기본값: 제목+내용 검색
      ...options,
    });
  }
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
    try {
      const response = await ApiService.authDelete(
        `/image?imageUrl=${imageUrl}`
      );

      return response;
    } catch (error) {
      throw new Error("이미지 삭제에 실패했습니다.");
    }
  }

  /**
   * 전체 사용자의 전체 여행 기록 조회
   * @param {Number} page - 페이징 조회 시 페이지, 기본 0 시작
   * @param {Number} size - 페이징 조회 시 페이지 당 게시글 수, 10 고정
   * @param {string} region - 기록을 조회하고 싶은 여행지역 (서울, 강원도, ..)
   * @return {Promise} - 해당 지역에 존재하는 여행 기록 조회 결과
   */
  async getAllTripHistoryByRegion(page = 0, size = 10, region = "") {
    try {
      const response = await ApiService.publicGet("/posts/trip", {
        params: {
          page,
          size,
          region,
        },
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 내가 쓴 게시글 전체 조회
   * @param {Object} params - 페이징 파라미터
   * @param {number} params.page - 페이지 번호 (0부터 시작)
   * @param {number} params.size - 페이지 크기
   * @return {Promise} - 내가 쓴 게시글 전체 조회 (페이징)
   */
  async getAllMyPosts(params = {}) {
    try {
      // 기본값 설정
      const { page = 0, size = 10 } = params;

      // URL 파라미터 구성
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("size", size.toString());

      const response = await ApiService.authGet(
        `/member/post?${queryParams.toString()}`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 내 여행 기록 전체 조회
   * @param {Object} params - 페이징 파라미터
   * @param {number} params.page - 페이지 번호 (0부터 시작)
   * @param {number} params.size - 페이지 크기
   * @return {Promise} - 나의 여행 기록 전체 조회 (페이징)
   */
  async getAllMyTripHistory(params = {}) {
    try {
      // 기본값 설정
      const { page = 0, size = 10 } = params;

      // URL 파라미터 구성
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("size", size.toString());

      const response = await ApiService.authGet(
        `/trip/history?${queryParams.toString()}`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 특정 게시글 좋아요 누름 여부 확인 요청 (수정됨)
   * @param {Number} postId - 좋아요 여부를 확인할 게시글 ID
   * @return {Promise<Object>} - 좋아요 여부 응답 객체
   */
  async checkPostLiked(postId) {
    try {
      // 인증이 필요한 요청이므로 authGet 사용
      const response = await ApiService.authGet(`/posts/${postId}/likes`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 특정 게시글 좋아요 누르기 요청
   * @param {Number} postId - 좋아요를 누를 게시글 id
   * @return {Promise} - 요청 성공 응답
   */
  async likePost(postId) {
    try {
      const response = await ApiService.authPost(`/posts/${postId}/likes`);

      return response;
    } catch (error) {}
  }

  /**
   * 특정 게시글 좋아요 취소하기 요청
   *
   */
  async unlikePost(postId) {
    try {
      const response = await ApiService.authDelete(`/posts/${postId}/likes`);

      return response;
    } catch (error) {
      throw error; // 호출부에서 catch할 수 있도록 다시 throw
    }
  }

  /**
   * 게시글 댓글 조회
   * @param {number} postId - 게시글 ID
   * @param {Object} params - 페이징 파라미터
   * @param {number} params.page - 페이지 번호 (0부터 시작)
   * @param {number} params.size - 페이지 크기
   * @return {Promise} - 댓글 목록 (페이징)
   */
  async getComments(postId, params = {}) {
    try {
      const { page = 0, size = 10 } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      const response = await ApiService.publicGet(
        `/posts/${postId}/comment?${queryParams.toString()}`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 게시글 댓글 수정
   * @param {postId} postId - 게시글 ID
   * @param {commentId} commentId - 댓글 ID
   * @return {Promise} - 댓글 수정 응답
   */
  async updateComment(postId, commentId, commentData) {
    try {
      const response = await ApiService.authPut(
        `/posts/${postId}/comment/${commentId}`,
        commentData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 게시글 댓글 삭제
   * @param {postId} postId - 게시글 ID
   * @param {commentId} commentId - 댓글 ID
   * @return {Promise} - 댓글 수정 응답
   */
  async deleteComment(postId, commentId) {
    try {
      const response = await ApiService.authDelete(
        `/posts/${postId}/comment/${commentId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 게시글 댓글 작성
   * @param {number} postId - 게시글 ID
   * @param {Object} commentData - 댓글 데이터 (parentId, content 포함)
   * @return {Promise} - 댓글 작성 응답
   */
  async createComment(postId, commentData) {
    try {
      const response = await ApiService.authPost(
        `/posts/${postId}/comment`,
        commentData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new PostService();
