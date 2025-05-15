<!-- NavBar.vue -->
<template>
  <div class="w-full max-w-full px-4 sm:px-0">
    <div class="flex flex-wrap justify-center gap-10 sm:gap-16 py-6">
      <component
        v-for="item in menuItems"
        :key="item.label"
        :is="item.link ? 'router-link' : 'div'"
        :to="item.link"
        class="menu-item flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex flex-col justify-center items-center rounded-xl transition duration-300 cursor-pointer"
        @click="handleClick(item)"
      >
        <img :src="item.icon" alt="icon" class="menu-icon w-5 h-5 sm:w-6 sm:h-6" />
        <span class="menu-label text-[0.65rem] sm:text-xs mt-1 sm:mt-2">{{ item.label }}</span>
      </component>
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
        { icon: iconMap, label: '지도' }, // 모달용
        { icon: iconCommunity, label: '커뮤니티', link: '/posts' },
        { icon: iconBoard, label: '공지사항', link: '#' },
      ],
    };
  },
  methods: {
    handleClick(item) {
      if (item.label === '지도') {
        this.$emit('open-map');
      }
    },
  },
};
</script>
  
  <style scoped>
  /* 메뉴 아이템 호버 시 컴포넌트 크기 증가 */
  .menu-item {
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); /* 약한 그림자 효과 */
  }

  .menu-item:hover {
  transform: scale(1.2); /* 메뉴 아이템 크기 20% 증가 */
  border: 2px solid transparent; /* 테두리 두께 얇게 설정 */
  animation: rainbow-shadow 20s linear infinite; /* 무지개빛 그림자 애니메이션 */
}

/* 메뉴 아이템 안의 아이콘 크기 증가 */
.menu-item:hover .menu-icon {
  transform: scale(1.4); /* 아이콘 크기 40% 증가 */
}

/* 아이콘 애니메이션 부드럽게 처리 */
.menu-icon {
  transition: transform 1s ease-in-out; /* 아이콘 크기 변경 시 애니메이션 */
}

/* 메뉴 아이템 애니메이션 부드럽게 처리 */
.menu-item {
  transition: transform 1s ease-in-out, box-shadow 0.3s ease; /* 메뉴 아이템 크기 변경 및 그림자 애니메이션 */
}

/* 무지개빛 그림자 애니메이션 */
@keyframes rainbow-shadow {
  0% {
    box-shadow: 0 0 5px rgba(168, 218, 220, 0.5); /* 청록색 (작은 그림자) */
  }
  8% {
    box-shadow: 0 0 6px rgba(69, 123, 157, 0.8); /* 차가운 파랑 */
  }
  16% {
    box-shadow: 0 0 7px rgba(29, 53, 87, 0.8); /* 어두운 파랑 */
  }
  24% {
    box-shadow: 0 0 8px rgba(241, 250, 238, 0.8); /* 밝은 회색 */
  }
  32% {
    box-shadow: 0 0 9px rgba(230, 57, 70, 0.8); /* 따뜻한 빨간색 */
  }
  40% {
    box-shadow: 0 0 8px rgba(209, 227, 203, 0.8); /* 밝은 회색 */
  }
  48% {
    box-shadow: 0 0 7px rgba(212, 165, 165, 0.8); /* 차분한 로즈 색 */
  }
  56% {
    box-shadow: 0 0 8px rgba(168, 218, 220, 0.8); /* 청록색 */
  }
  64% {
    box-shadow: 0 0 7px rgba(69, 123, 157, 0.8); /* 차가운 파랑 */
  }
  72% {
    box-shadow: 0 0 6px rgba(29, 53, 87, 0.8); /* 어두운 파랑 */
  }
  80% {
    box-shadow: 0 0 9px rgba(241, 250, 238, 0.8); /* 밝은 회색 */
  }
  88% {
    box-shadow: 0 0 8px rgba(230, 57, 70, 0.8); /* 따뜻한 빨간색 */
  }
  96% {
    box-shadow: 0 0 10px rgba(241, 250, 238, 0.8); /* 밝은 회색 */
  }
  100% {
    box-shadow: 0 0 9px rgba(224, 137, 137, 0.8); /* 차분한 로즈 색 */
  }
}


/* 텍스트 라벨 스타일 */
.menu-label {
  font-size: 0.75rem; /* 가장 작은 글씨 크기 */
  color: #4a4a4a; /* 텍스트 색상 (회색) */
  margin-top: 0.5rem; /* 아이콘과 텍스트 사이의 간격 */
}
</style>
