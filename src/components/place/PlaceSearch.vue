<template>
  <div class="w-full h-full flex flex-col space-y-4">
    <!-- 1. 상단 지역명 표시 -->
    <h1 class="text-lg font-bold mb-2">{{ selectedRegion || '지역 미선택' }}</h1>

    <!-- 2. 출발일-도착일 표시 -->
    <h2 class="text-sm font-semibold mb-4">
      {{ formattedStart || '출발일 미선택' }} - {{ formattedEnd || '도착일 미선택' }}
    </h2>
    
    <div class="flex items-center shadow-md rounded px-4 py-3 bg-white">
      <select
        v-model="selectedCategoryName"
        @change="resetAndSearch"
        class="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 mr-3 bg-white w-13"
      >
        <option value="">전체</option>
        <option
          v-for="(cat, index) in categories"
          :key="index"
          :value="cat.name"
        >
          {{ cat.description }}
        </option>
      </select>

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

    <div class="flex flex-col space-y-10">
      <div
        v-for="place in placeResults"
        :key="place.id"
        class="flex justify-between items-stretch bg-white text-sm"
      >
        <div class="flex-grow pr-2">
          <div class="text-base font-bold">{{ place.placeName }}</div>
          <div class="text-xs text-sky-500/70">
            {{ place.categoryGroupName }} &nbsp;
            <span class="text-gray-500">{{ place.addressName }}</span>
          </div>
          <div class="text-xs text-gray-400 mt-1">{{ place.phone }}</div>
        </div>

        <div class="flex items-stretch">
          <button
            @click="togglePlaceSelection(place)"
            :class="[ 
              'w-10 flex items-center justify-center rounded', 
              isPlaceSelected(place) ? 'bg-pink-400 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
            ]"
          >
            <svg
              v-if="isPlaceSelected(place)"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-else
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
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
      page: 1,
      searchQuery: '',
      selectedCategoryName: '',
      isLoading: false,
      noMoreResults: false,
      categories: [],
      placeResults: [],
    };
  },

  computed: {
  ...mapState('places', ['selectedPlaces']),
  ...mapGetters('places', ['getSelectedRegion', 'getTripDates', 'getSelectedPlaces']),
    tripDates() {
      // null 방지용 빈 객체 리턴
      return this.getTripDates || {};
    },
    selectedRegion() {
      console.log(this.getSelectedRegion);
      return this.getSelectedRegion || '';
    },
    formattedStart() {
      return this.tripDates.startDate ? this.formatDate(this.tripDates.startDate) : null;
    },
    formattedEnd() {
      return this.tripDates.endDate ? this.formatDate(this.tripDates.endDate) : null;
    },
  },

  methods: {
    ...mapActions('places', ['togglePlaceSelection']),

    formatDate(date) {
      const d = new Date(date);
      return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
    },

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
            category: this.selectedCategoryName || undefined,
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

    async fetchCategories() {
      const token = localStorage.getItem('access-token');

      try {
        const res = await axios.get('/v1/place/category', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        this.categories = res.data?.data || [];
      } catch (err) {
        console.error('카테고리 불러오기 실패:', err);
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

    isPlaceSelected(place) {
      return this.selectedPlaces.some(p => p.id === place.id);
    },
  },

  mounted() {
    if (this.scrollTarget) {
      this.scrollTarget.addEventListener('scroll', this.handleScroll);
    }
    this.fetchCategories();
    this.fetchPlaces();
  },

  unmounted() {
    if (this.scrollTarget) {
      this.scrollTarget.removeEventListener('scroll', this.handleScroll);
    }
  },
};
</script>
