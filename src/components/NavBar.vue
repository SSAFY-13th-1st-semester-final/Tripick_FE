<template>
    <div class="flex justify-center items-center my-8 font-apple-sdgothic">
      <div class="grid grid-cols-3 gap-16">
        <router-link
          v-for="item in menuItems"
          :key="item.label"
          :to="item.link"
          class="menu-item w-20 h-20 flex flex-col justify-center items-center bg-gray-100 rounded-xl transform transition duration-300 cursor-pointer"
        >
          <!-- 아이콘 -->
          <img :src="item.icon" alt="icon" class="menu-icon w-6 h-6 transition-transform duration-300 ease-in-out" />
          <!-- 텍스트 라벨 -->
          <span class="menu-label text-3xs text-gray-600 mt-2">{{ item.label }}</span>
        </router-link>
      </div>
    </div>
  </template>
  
  <script>
  import iconBoard from '@/assets/icons/icon_board.svg';
  import iconCommunity from '@/assets/icons/icon_community.svg';
  import iconMap from '@/assets/icons/icon_map.svg';
  
  export default {
    name: 'NavBar',
    data() {
      return {
        menuItems: [
          { icon: iconMap, label: '지도', link: '/map' },
          { icon: iconCommunity, label: '커뮤니티', link: '/posts' },
          { icon: iconBoard, label: '공지사항', link: '/notice' },
        ],
      };
    },
  };
  </script>
  
  <style scoped>
  /* 메뉴 아이템 호버 시 컴포넌트 크기 증가 */
  .menu-item:hover {
    transform: scale(1.2); /* 메뉴 아이템 크기 25% 증가 */
    border: 2px solid transparent; /* 테두리 두께 얇게 설정 */
    animation: rainbow-border 20s linear infinite; /* 무지개빛 테두리 애니메이션 */
  }
  
  /* 메뉴 아이템 안의 아이콘 크기 증가 */
  .menu-item:hover .menu-icon {
    transform: scale(1.4); /* 아이콘 크기 50% 증가 */
  }
  
  /* 아이콘 애니메이션 부드럽게 처리 */
  .menu-icon {
    transition: transform 1s ease-in-out; /* 아이콘 크기 변경 시 애니메이션 */
  }
  
  /* 메뉴 아이템 애니메이션 부드럽게 처리 */
  .menu-item {
    transition: transform 1s ease-in-out; /* 메뉴 아이템 크기 변경 시 애니메이션 */
  }
  
  /* 무지개빛 테두리 애니메이션 */
  @keyframes rainbow-border {
    0% {
      border-color: #a8dadc; /* 청록색 */
    }
    8% {
      border-color: #457b9d; /* 차가운 파랑 */
    }
    16% {
      border-color: #1d3557; /* 어두운 파랑 */
    }
    24% {
      border-color: #f1faee; /* 밝은 회색 */
    }
    32% {
      border-color: #e63946; /* 따뜻한 빨간색 */
    }
    40% {
      border-color: #f1faee; /* 밝은 회색 */
    }
    48% {
      border-color: #d4a5a5; /* 차분한 로즈 색 */
    }
    56% {
      border-color: #a8dadc; /* 청록색 */
    }
    64% {
      border-color: #457b9d; /* 차가운 파랑 */
    }
    72% {
      border-color: #1d3557; /* 어두운 파랑 */
    }
    80% {
      border-color: #f1faee; /* 밝은 회색 */
    }
    88% {
      border-color: #e63946; /* 따뜻한 빨간색 */
    }
    96% {
      border-color: #f1faee; /* 밝은 회색 */
    }
    100% {
      border-color: #d4a5a5; /* 차분한 로즈 색 */
    }
  }
  
  /* 텍스트 라벨 스타일 */
  .menu-label {
    font-size: 0.75rem; /* 가장 작은 글씨 크기 */
    color: #4a4a4a; /* 텍스트 색상 (회색) */
    margin-top: 0.5rem; /* 아이콘과 텍스트 사이의 간격 */
  }
  </style>
  