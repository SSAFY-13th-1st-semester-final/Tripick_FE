import apiClient from './api.service'

export class PostService {
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

  /**
   * 이미지 파일 DB 업로드
   * @param {File} imageFile - 업로드할 이미지 파일
   * @returns {Promise<string>} - 업로드된 이미지 파일의 URL
   */
  static async uploadImage(imageFile) {
    try {
      // FormData 생성
      const formData = new FormData()
      formData.append('image', imageFile)
      
      // API 호출
      const response = await apiClient.post('/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // 응답에서 이미지 URL 반환
      console.log("이미지 응답 >>> ", response.data.data.url);
      return response.data.data.url
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      throw new Error('이미지 업로드에 실패했습니다.')
    }
  }
}

export default new PostService()