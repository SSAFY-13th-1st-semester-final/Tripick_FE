import apiClient from './api.service'

class PostService {
  /**
   * 게시글 목록 조회
   * @param {Number} page - 페이지 번호
   * @param {Number} size - 페이지 크기
   * @returns {Promise} - 게시글 목록 응답
   */
  getPosts(page = 1, size = 10) {
    return apiClient.get('/posts', { params: { page, size } })
  }
  
  /**
   * 게시글 상세 조회
   * @param {Number} postId - 게시글 ID
   * @returns {Promise} - 게시글 상세 응답
   */
  getPostById(postId) {
    return apiClient.get(`/posts/${postId}`)
  }
  
  /**
   * 게시글 작성
   * @param {Object} postData - 게시글 데이터
   * @returns {Promise} - 게시글 작성 응답
   */
  createPost(postData) {
    return apiClient.post('/posts', postData)
  }
  
  /**
   * 게시글 수정
   * @param {Object} postData - 수정할 게시글 데이터
   * @returns {Promise} - 게시글 수정 응답
   */
  updatePost(postData) {
    return apiClient.put('/posts', postData)
  }
  
  /**
   * 게시글 삭제
   * @param {Number} postId - 삭제할 게시글 ID
   * @returns {Promise} - 게시글 삭제 응답
   */
  deletePost(postId) {
    return apiClient.delete(`/posts/${postId}`)
  }
}

export default new PostService()