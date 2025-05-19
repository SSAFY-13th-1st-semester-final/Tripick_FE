<template>
  <div class="region-selector-container">
    <div
      class="region-selector-input glass-card"
      @click="toggleDropdown"
      ref="inputRef"
    >
      <div class="input-wrapper">
        <svg
          class="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref="searchRef"
          type="text"
          class="search-input"
          :value="searchQuery"
          @input="updateSearchQuery"
          placeholder="여행할 지역을 검색하세요"
          @focus="showDropdown = true"
          @click.stop
        />
        <button
          v-if="searchQuery || selectedRegion"
          @click.stop="clearSelection"
          class="clear-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="selected-region" v-if="selectedRegion">
        <div class="region-tag glass-tag">
          {{ getFullRegionName(selectedRegion) }}
          <button class="remove-btn" @click.stop="clearSelection">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <transition name="dropdown-fade">
      <div v-show="showDropdown" class="region-dropdown glass-card" @click.stop>
        <!-- 검색 결과 표시 (검색어가 있을 때) -->
        <div
          v-if="searchQuery && filteredRegions.length > 0"
          class="search-results"
        >
          <h4 class="result-heading">검색 결과</h4>
          <div class="result-list">
            <button
              v-for="region in filteredRegions"
              :key="`${region.provinceId}-${region.districtId}`"
              class="region-btn"
              @click.stop="selectRegion(region)"
            >
              {{ getFullRegionName(region) }}
            </button>
          </div>
        </div>

        <!-- 검색 결과 없음 -->
        <div
          v-else-if="searchQuery && filteredRegions.length === 0"
          class="no-results"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <p>검색 결과가 없습니다</p>
        </div>

        <!-- 지역 탭 컴포넌트 (검색어가 없을 때) -->
        <RegionTabs
          v-else
          :provinces="provinces"
          :selected-region="selectedRegion"
          @region-selected="selectRegion"
        />

        <!-- 인기 여행지 -->
        <div class="popular-regions" @click.stop>
          <h4 class="popular-heading">인기 여행지</h4>
          <div class="popular-tags">
            <button
              v-for="region in popularRegions"
              :key="`${region.provinceId}-${region.districtId}`"
              class="popular-tag"
              @click.stop="selectRegion(region)"
            >
              {{ getFullRegionName(region) }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import regionData from "@/assets/data/regionData.json";
import RegionTabs from "@/components/common/utils/RegionTabs.vue";

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(["update:modelValue", "region-selected"]);

// Refs
const inputRef = ref(null);
const searchRef = ref(null);
const showDropdown = ref(false);
const searchQuery = ref("");
const selectedRegion = ref(props.modelValue);

// 대한민국 행정구역 데이터를 JSON 파일에서 불러옴
const provinces = ref(regionData.provinces);
const popularRegions = ref(regionData.popularRegions);

const filteredRegions = computed(() => {
  if (!searchQuery.value) return [];

  const query = searchQuery.value.toLowerCase();
  const results = [];

  provinces.value.forEach((province) => {
    province.districts.forEach((district) => {
      const provinceName = province.name.toLowerCase();
      const districtName = district.name.toLowerCase();

      if (
        provinceName.includes(query) ||
        districtName.includes(query) ||
        `${provinceName} ${districtName}`.includes(query)
      ) {
        results.push({
          provinceId: province.id,
          provinceName: province.name,
          districtId: district.id,
          districtName: district.name,
        });
      }
    });
  });

  return results;
});

// Methods
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) {
    // 드롭다운이 열릴 때 입력 필드에 포커스
    setTimeout(() => {
      searchRef.value?.focus();
    }, 100);
  }
};

const closeDropdown = (e) => {
  // 클릭된 요소가 드롭다운 내부에 있는지 확인
  const isClickInsideDropdown = e.target.closest(".region-dropdown");

  // 입력 영역이나 드롭다운 내부를 클릭한 경우가 아니면 드롭다운 닫기
  if (
    inputRef.value &&
    !inputRef.value.contains(e.target) &&
    !isClickInsideDropdown
  ) {
    showDropdown.value = false;
  }
};

// UpdateSearchQuery 메서드 추가
const updateSearchQuery = (e) => {
  searchQuery.value = e.target.value;
  // 검색어가 있으면 드롭다운 표시
  if (searchQuery.value) {
    showDropdown.value = true;
  }
};

const selectRegion = (region) => {
  selectedRegion.value = region;
  searchQuery.value = "";
  emit("update:modelValue", region);
  emit("region-selected", region);

  // 지역 선택 후에도 드롭다운은 유지
  // showDropdown.value = false; // 이 줄 제거
};

const clearSelection = () => {
  selectedRegion.value = null;
  searchQuery.value = "";
  emit("update:modelValue", null);
};

const getFullRegionName = (region) => {
  if (!region) return "";
  if (region.districtName) {
    return `${region.provinceName} ${region.districtName}`;
  }
  return region.provinceName; // 시/도만 선택된 경우
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener("click", closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener("click", closeDropdown);
});

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    selectedRegion.value = newValue;
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.region-selector-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  font-family: $font-family;
}

.region-selector-input {
  display: flex;
  flex-direction: column;
  padding: $spacing-md;
  cursor: pointer;
  transition: all $transition-normal;
  border-radius: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.search-icon {
  color: $dark-gray;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: $spacing-xs 0;
  font-size: 15px;
  color: $primary-color;
  font-family: $font-family;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: $dark-gray;
  }
}

.clear-btn {
  background: transparent;
  border: none;
  padding: 4px;
  color: $dark-gray;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($primary-color, 0.1);
    color: $primary-color;
  }
}

.selected-region {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.region-tag {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: 4px 8px;
  font-size: 13px;
  color: $primary-color;
  border-radius: 16px;
  background-color: rgba($accent-color, 0.1);

  .remove-btn {
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $primary-color;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: $accent-color;
    }
  }
}

.region-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  // max-height: 220px;
  overflow-y: auto;
  z-index: $z-index-dropdown;
  padding: $spacing-md;
  @include glassmorphism(0.7, 12px);
  border-radius: 16px;
  box-shadow: $shadow-lg;
}

.result-heading,
.popular-heading {
  font-size: 15px;
  color: $primary-color;
  margin-bottom: $spacing-sm;
  font-weight: $font-weight-medium;
}

.search-results {
  margin-bottom: $spacing-lg;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.region-btn {
  background: transparent;
  border: none;
  padding: $spacing-sm;
  font-size: 14px;
  color: $primary-color;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($accent-color, 0.1);
    color: $accent-color;
  }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg 0;
  gap: $spacing-sm;
  color: $dark-gray;

  svg {
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}

.popular-regions {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid rgba($medium-gray, 0.3);
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.popular-tag {
  background: transparent;
  border: none;
  padding: $spacing-xs $spacing-sm;
  font-size: 13px;
  color: $primary-color;
  border-radius: 16px;
  border: 1px solid rgba($medium-gray, 0.5);
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($accent-color, 0.1);
    border-color: $accent-color;
    color: $accent-color;
  }
}

// 애니메이션
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: $breakpoint-md) {
  .region-selector-container {
    max-width: 100%;
  }

  .region-dropdown {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 350px;
    max-height: 80vh;
    z-index: $z-index-modal;
  }

  .dropdown-fade-enter-from,
  .dropdown-fade-leave-to {
    transform: translate(-50%, -45%);
    opacity: 0;
  }
}
</style>
