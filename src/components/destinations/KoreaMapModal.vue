<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
    <div class="bg-white rounded-2xl p-8 w-[90%] max-w-[1100px] h-[90vh] relative overflow-y-auto flex flex-col items-center">
      <button class="absolute top-3 right-4 text-3xl text-gray-600 hover:text-black" @click="$emit('close')">×</button>
      <h2 class="text-2xl font-bold text-center mb-4">
        어디로 여행을 떠나시나요?
        <span class="ml-4 text-lg">{{ selectedRegion }}</span>
      </h2>

      <!-- KoreaMap 컴포넌트에서 지역명이 선택되면 updateSelectedRegion을 호출 -->
      <KoreaMap @region-selected="updateSelectedRegion" />
    </div>
  </div>
</template>

<script>
import KoreaMap from './KoreaMap.vue';

export default {
  name: 'KoreaMapModal',
  components: { KoreaMap },
  data() {
    return {
      selectedRegion: '',
    };
  },
  methods: {
    updateSelectedRegion(regionName) {
      this.selectedRegion = regionName;
    },
  },
};
</script>
