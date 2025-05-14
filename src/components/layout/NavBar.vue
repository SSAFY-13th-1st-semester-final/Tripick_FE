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
