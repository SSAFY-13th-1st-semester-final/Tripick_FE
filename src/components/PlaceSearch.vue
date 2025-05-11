<template>
  <div class="w-full h-full flex flex-col">
    <!-- 검색창 -->
    <div class="flex items-center mb-4 shadow-md rounded px-3 py-2 bg-white">
      <input
        v-model="searchQuery"
        @keyup.enter="resetAndSearch"
        type="text"
        placeholder="장소명을 입력하세요"
        class="flex-grow outline-none text-sm bg-transparent"
      />
      <button @click="resetAndSearch" class="ml-2 text-gray-600 hover:text-black">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>

    <!-- 검색 결과 리스트 -->
    <div class="flex-1 space-y-3 pr-1">
      <div
        v-for="place in placeResults"
        :key="place.id"
        class="flex justify-between items-center border rounded-lg p-3 shadow-sm bg-white text-sm"
        style="height: auto;" 
      >
        <!-- 장소 정보 -->
        <div class="flex-grow">
          <div class="font-semibold">{{ place.placeName }}</div>
          <div class="text-gray-500">{{ place.addressName }}</div>
          <div class="text-xs text-gray-400">{{ place.phone }}</div>
        </div>

        <!-- 오른쪽: + 버튼을 감싸는 div -->
        <div class="flex justify-center items-center h-full">
          <button
            @click="handleAddPlace(place)"
            class="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xl w-10 h-full flex items-center justify-center rounded-r"
          >
            +
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="text-center text-xs text-gray-400 py-2">
        불러오는 중...
      </div>
      <div v-if="noMoreResults" class="text-center text-xs text-gray-400 py-2">
        더 이상 결과가 없습니다.
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PlaceSearch',
  props: {
    scrollTarget: { type: [Object, null], default: null },
  },
  data() {
    return {
      searchQuery: '',
      placeResults: [],
      isLoading: false,
      page: 1,
      noMoreResults: false,
    };
  },
  methods: {
    async fetchPlaces() {
      if (!this.searchQuery || this.isLoading || this.noMoreResults) return;

      this.isLoading = true;
      const token = localStorage.getItem('access-token');

      try {
        const res = await axios.get('/v1/place', {
          params: { query: this.searchQuery, page: this.page, size: 10 },
          headers: { Authorization: `Bearer ${token}` }
        });

        const newResults = res.data.data || [];

        if (newResults.length === 0) {
          this.noMoreResults = true;
        } else {
          this.placeResults.push(...newResults);
          this.page++;

          this.$emit('update-place-results', this.placeResults);
        }
      } catch (err) {
        console.error('검색 실패:', err);
      } finally {
        this.isLoading = false;
      }
    },

    resetAndSearch() {
      this.page = 1;
      this.noMoreResults = false;
      this.placeResults = [];
      this.fetchPlaces();
    },

    handleScroll() {
      const el = this.scrollTarget;
      if (!el) return;

      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;
      const scrollHeight = el.scrollHeight;

      const nearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (nearBottom && !this.isLoading && !this.noMoreResults) {
        this.fetchPlaces();
      }
    },

    handleAddPlace(place) {
      console.log('추가할 장소:', place);
      // 여기에 추가 로직 작성
    }
  },

  mounted() {
    const el = this.scrollTarget;
    if (el) {
      el.addEventListener('scroll', this.handleScroll);
    }
    this.fetchPlaces();
  },

  unmounted() {
    const el = this.scrollTarget;
    if (el) {
      el.removeEventListener('scroll', this.handleScroll);
    }
  }
};
</script>

<style scoped>
/* 스크롤바 최소화 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
</style>
