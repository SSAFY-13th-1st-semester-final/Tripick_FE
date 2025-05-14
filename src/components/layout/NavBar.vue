<template>
  <div class="w-full max-w-full px-4 sm:px-0">
    <div class="flex flex-wrap justify-center gap-10 sm:gap-16 py-6">
      <router-link
        v-for="item in menuItems"
        :key="item.label"
        :to="item.link"
        class="menu-item flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex flex-col justify-center items-center rounded-xl transition duration-300 cursor-pointer"
      >
        <img :src="item.icon" alt="icon" class="menu-icon w-5 h-5 sm:w-6 sm:h-6" />
        <span class="menu-label text-[0.65rem] sm:text-xs mt-1 sm:mt-2">{{ item.label }}</span>
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
        { icon: iconBoard, label: '공지사항', link: '#' },
      ],
    };
  },
};
</script>

<style scoped>
.menu-item {
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  transition: transform 1s ease-in-out, box-shadow 0.3s ease;
}

.menu-item:hover {
  transform: scale(1.2);
  border: 2px solid transparent;
  animation: rainbow-shadow 20s linear infinite;
}

.menu-item:hover .menu-icon {
  transform: scale(1.4);
}

.menu-icon {
  transition: transform 1s ease-in-out;
}

@keyframes rainbow-shadow {
  0% { box-shadow: 0 0 5px rgba(168, 218, 220, 0.5); }
  8% { box-shadow: 0 0 6px rgba(69, 123, 157, 0.8); }
  16% { box-shadow: 0 0 7px rgba(29, 53, 87, 0.8); }
  24% { box-shadow: 0 0 8px rgba(241, 250, 238, 0.8); }
  32% { box-shadow: 0 0 9px rgba(230, 57, 70, 0.8); }
  40% { box-shadow: 0 0 8px rgba(209, 227, 203, 0.8); }
  48% { box-shadow: 0 0 7px rgba(212, 165, 165, 0.8); }
  56% { box-shadow: 0 0 8px rgba(168, 218, 220, 0.8); }
  64% { box-shadow: 0 0 7px rgba(69, 123, 157, 0.8); }
  72% { box-shadow: 0 0 6px rgba(29, 53, 87, 0.8); }
  80% { box-shadow: 0 0 9px rgba(241, 250, 238, 0.8); }
  88% { box-shadow: 0 0 8px rgba(230, 57, 70, 0.8); }
  96% { box-shadow: 0 0 10px rgba(241, 250, 238, 0.8); }
  100% { box-shadow: 0 0 9px rgba(224, 137, 137, 0.8); }
}

.menu-label {
  color: #4a4a4a;
}
</style>
