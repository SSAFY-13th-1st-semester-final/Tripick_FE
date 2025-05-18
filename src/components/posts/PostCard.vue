<template>
  <div class="post-card glass-card" @click="navigateToPost">
    <div class="post-card__thumbnail">
      <img :src="'https://picsum.photos/200'" :alt="post.title" @error="handleImageError" />
    </div>
    <div class="post-card__content">
      <h3 class="post-card__title">{{ post.title }}</h3>
      <p class="post-card__description">{{ post.description }}</p>
      
      <div class="post-card__info">
        <div class="post-card__date-comments">
          <span class="post-card__date">{{ formatDate(post.createdAt) }}</span>
          <span class="post-card__comments">
            <i class="fas fa-comment"></i>
            {{ formatCount(post.commentCount) }}개의 댓글
          </span>
        </div>
        <div class="post-card__views">
          <i class="fas fa-eye"></i>
          {{ formatCount(post.viewCount) }}
        </div>
      </div>
      
      <div class="post-card__footer">
        <div class="post-card__author">
          <div class="post-card__author-image">
            <img :src="post.profileImageUrl || '/default-profile.jpg'" :alt="post.nickname" @error="handleProfileError">
          </div>
          <span class="post-card__author-name">{{ post.nickname }}</span>
        </div>
        <div class="post-card__likes">
          <svg class="heart-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="black" />
          </svg>
          {{ formatCount(post.likeCount) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

// Props 정의
const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

// 라우터
const router = useRouter()

// 게시글로 이동
const navigateToPost = () => {
  router.push({ name: 'post-detail', params: { id: props.post.postId } })
}

// 수 포맷팅 (예: 1000 -> 1k)
const formatCount = (count) => {
  if (!count && count !== 0) return '0'
  
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  
  return count.toString()
}

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  date.setHours(date.getHours() + 9)
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// 이미지 오류 처리
const handleImageError = (event) => {
  event.target.src = '/default-profile.jpg'
}

// 프로필 이미지 오류 처리
const handleProfileError = (event) => {
  event.target.src = '/default-profile.jpg'
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.post-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  transition: transform $transition-fast, box-shadow $transition-fast;
  padding: 0 !important; // 패딩 제거
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: $shadow-lg;
  }
  
  &__thumbnail {
    height: 200px; // 높이 증가
    overflow: hidden;
    border-radius: 8px 8px 0 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform $transition-normal;
    }
  }
  
  &:hover &__thumbnail img {
    transform: scale(1.05);
  }
  
  &__content {
    padding: $spacing-md;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  &__title {
    font-size: 1.1rem;
    margin: 0 0 $spacing-sm;
    color: $primary-color;
    font-weight: $font-weight-bold;
    line-height: 1.4;
    // 2줄로 제한하고 말줄임표 표시
    display: -webkit-box;
    display: box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    box-orient: vertical;
    overflow: hidden;
  }
  
  &__description {
    font-size: 0.9rem;
    color: rgba($primary-color, 0.8);
    margin: 0 0 $spacing-sm; // 마진 축소
    flex-grow: 1;
    // 3줄로 제한하고 말줄임표 표시
    display: -webkit-box;
    display: box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    box-orient: vertical;
    overflow: hidden;
  }
  
  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    font-size: 0.75rem;
    color: rgba($primary-color, 0.5);
  }
  
  &__date-comments {
    display: flex;
    align-items: center;
  }
  
  &__date {
    margin-right: $spacing-sm;
  }
  
  &__comments {
    display: flex;
    align-items: center;
    
    i {
      margin-right: 3px;
      font-size: 0.85rem;
    }
  }
  
  &__views {
    display: flex;
    align-items: center;
    
    i {
      margin-right: 3px;
      font-size: 0.85rem;
    }
  }
  
  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba($primary-color, 0.1);
  }
  
  &__author {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
  }
  
  &__author-image {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: $spacing-xs;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  &__author-name {
    color: $primary-color;
    font-weight: $font-weight-medium;
  }
  
  &__likes {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
    font-weight: $font-weight-medium;
    color: $primary-color;
    
    .heart-icon {
      margin-right: 4px;
    }
  }
}
</style>