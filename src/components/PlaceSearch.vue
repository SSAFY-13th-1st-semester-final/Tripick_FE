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
      <button
        @click="resetAndSearch"
        class="ml-2 text-gray-600 hover:text-black"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>

    <!-- 검색 결과 리스트 -->
    <div
      v-for="place in placeResults"
      :key="place.id"
      class="flex justify-between items-stretch border rounded-lg px-3 py-4 shadow-sm bg-white text-sm mb-4"
    >
      <!-- 장소 정보 -->
      <div class="flex-grow">
        <div class="font-semibold">{{ place.placeName }}</div>
        <div class="text-gray-500">{{ place.addressName }}</div>
        <div class="text-xs text-gray-400">{{ place.phone }}</div>
      </div>

      <!-- 오른쪽: + 버튼 -->
      <div class="flex items-stretch">
        <button
          @click="handleAddPlace(place)"
          class="bg-gray-100 hover:bg-gray-200 text-gray-600 w-10 flex items-center justify-center rounded-r"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PlaceResult',
  props: {
    scrollTarget: {
      type: [Object, null],
      default: null,
    },
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
          params: {
            query: this.searchQuery,
            page: this.page,
            size: 15,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const newResults = res.data?.data?.places || [];

        if (newResults.length === 0) {
          this.noMoreResults = true;
        } else {
          this.placeResults.push(...newResults);
          this.page++;
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
      this.$emit('add-place', place);
    },
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
  },
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
