<template>
  <div class="region-tabs" @click.stop>
    <button
      v-for="(province, idx) in provinces"
      :key="province.id"
      class="tab-btn"
      :class="{ active: activeProvinceIndex === idx }"
      @click.stop="selectProvince(idx, province)"
    >
      {{ province.name }}
    </button>
  </div>

  <!-- 시/군/구 표시 (검색어가 없을 때) -->
  <div v-if="activeProvince" class="districts-container" @click.stop>
    <h4 class="region-heading">{{ activeProvince.name }}</h4>
    <div class="districts-grid">
      <button
        v-for="district in activeProvince.districts"
        :key="district.id"
        class="district-btn"
        @click.stop="selectDistrict(district)"
      >
        {{ district.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

// Props
const props = defineProps({
  provinces: {
    type: Array,
    required: true,
  },
  initialProvinceIndex: {
    type: Number,
    default: 0,
  },
  selectedRegion: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(["region-selected"]);

// Refs
const activeProvinceIndex = ref(props.initialProvinceIndex);

// Computed
const activeProvince = computed(
  () => props.provinces[activeProvinceIndex.value]
);

// Methods
const selectProvince = (index, province) => {
  activeProvinceIndex.value = index;

  // 도/시 선택 시 전체 지역을 선택하는 것으로 간주
  emit("region-selected", {
    provinceId: province.id,
    provinceName: province.name,
  });
};

const selectDistrict = (district) => {
  if (!activeProvince.value) return;

  // 시/군/구 선택 시 대분류+소분류 형태로 선택
  emit("region-selected", {
    provinceId: activeProvince.value.id,
    provinceName: activeProvince.value.name,
    districtId: district.id,
    districtName: district.name,
  });
};

// 선택된 지역이 변경되면 그에 맞게 활성 탭 변경
watch(
  () => props.selectedRegion,
  (newRegion) => {
    if (newRegion && newRegion.provinceId) {
      // 선택된 지역의 provinceId와 일치하는 탭을 찾아 활성화
      const provinceIndex = props.provinces.findIndex(
        (p) => p.id === newRegion.provinceId
      );
      if (provinceIndex !== -1) {
        activeProvinceIndex.value = provinceIndex;
      }
    }
  },
  { deep: true, immediate: true }
);
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.region-tabs {
  display: flex;
  gap: $spacing-xs;
  overflow-x: auto;
  padding-bottom: $spacing-sm;
  margin-bottom: $spacing-md;
  border-bottom: 1px solid rgba($medium-gray, 0.3);

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($dark-gray, 0.3);
    border-radius: 4px;
  }

  .tab-btn {
    flex: 0 0 auto;
    background: transparent;
    border: none;
    padding: $spacing-xs $spacing-sm;
    font-size: 14px;
    color: $dark-gray;
    border-radius: 16px;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: $primary-color;
      background-color: rgba($primary-color, 0.05);
    }

    &.active {
      color: $accent-color;
      background-color: rgba($accent-color, 0.1);
      font-weight: $font-weight-medium;
    }
  }
}

.region-heading {
  font-size: 15px;
  color: $primary-color;
  margin-bottom: $spacing-sm;
  font-weight: $font-weight-medium;
}

.districts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: $spacing-xs;
  margin-bottom: $spacing-lg;
}

.district-btn {
  background: transparent;
  border: none;
  padding: $spacing-xs $spacing-sm;
  font-size: 14px;
  color: $primary-color;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background-color: rgba($accent-color, 0.1);
    color: $accent-color;
  }
}

@media (max-width: $breakpoint-md) {
  .districts-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>
