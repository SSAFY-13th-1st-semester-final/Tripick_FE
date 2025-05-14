<template>
              <div class="flex items-center gap-2 mb-4">
              <div class="text-3xl font-semibold">
                <span>{{ selectedPlaces.length }}</span>
              </div>
              <div class="text-xs text-gray-500 pb-1">
                <span>{{ formattedTotalStayTime }}</span>
              </div>
            </div>
  <div v-if="selectedPlaces.length" class="space-y-2">
    
    <div
      v-for="(place, index) in selectedPlaces"
      :key="'card-' + index"
      class="flex items-center mb-4"
    >
      <div
        class="flex items-center justify-center w-8 h-8 rounded-full bg-pink-400 text-white text-xs font-bold flex-shrink-0 ml-1 mr-2"
      >
        {{ index + 1 }}
      </div>

      <transition name="fade">
        <div
          v-if="isSidePanelExpanded"
          class="flex justify-between items-center flex-grow bg-white text-sm border rounded-lg px-3 py-4 shadow-sm"
        >
          <!-- 비편집 모드 -->
          <div v-if="!place.isEditingStayTime" class="flex-grow pr-2">
            <div class="flex justify-between items-center">
              <div>
                <div class="text-sm font-bold">{{ place.placeName }}</div>
                <div class="text-xs text-sky-500/70">
                  {{ place.categoryGroupName }} &nbsp;
                  <span class="text-xs text-gray-500">{{ place.addressName }}</span>
                </div>
              </div>
              <!-- 시간과 삭제 버튼을 수평 정렬 -->
              <div class="flex items-center">
                <div
                  class="time-sum-label cursor-pointer"
                  @click="toggleStayTimeEdit(place)"
                >
                  {{ formattedStayTime(place) }}
                </div>
                <!-- 삭제 버튼 -->
                <button
                  @click="removePlace(place.id)"
                  class="text-gray-600 w-10 flex items-center justify-center rounded"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class="w-4 h-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7H5M10 7V3M14 7V3M3 7H21L19.2 20.4a2 2 0 0 1-2 1.6H6a2 2 0 0 1-2-1.6L3 7Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 편집 모드 -->
          <div v-else class="flex-grow">
            <div class="flex justify-between items-center gap-4">
              <div class="text-xs font-semibold">시간 설정</div>
              <div class="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  v-model.number="place.stayTime.hours"
                  min="0"
                  max="23"
                  class="w-12 border-0 text-center text-lg font-semibold focus:ring-0"
                />
                <span class="text-xs">시간</span>
                <input
                  type="number"
                  v-model.number="place.stayTime.minutes"
                  min="0"
                  max="59"
                  class="w-12 border-0 text-center text-lg font-semibold focus:ring-0"
                />
                <span class="text-xs">분</span>
              </div>
              <button
                @click="saveStayTimeEdit(place)"
                class="text-blue-600 w-10 flex items-center justify-center rounded"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
  <div v-else class="text-gray-400">선택된 장소가 없습니다.</div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from 'vuex';

export default {
  name: "AddPlaceList",
  props: {
    isSidePanelExpanded: Boolean,
  },
  computed: {
    ...mapGetters('places', ['getSelectedPlaces']),
    selectedPlaces() {
      return this.getSelectedPlaces;
    },

    formattedTotalStayTime() {
      const totalMinutes = this.selectedPlaces.reduce((total, place) => {
        return total + place.stayTime.hours * 60 + place.stayTime.minutes;
      }, 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}시간 ${minutes}분`;
    },
  },
  methods: {
    ...mapMutations('places', ['removePlace', 'updateStayTime', 'toggleEditingMode', 'exitEditingMode']),

    formattedStayTime(place) {
      return `${place.stayTime?.hours ?? 0}시간 ${place.stayTime?.minutes ?? 0}분`;
    },

    toggleStayTimeEdit(place) {
      this.selectedPlaces.forEach(p => p.isEditingStayTime = false);
      place.isEditingStayTime = true;
    },

    saveStayTimeEdit(place) {
      place.isEditingStayTime = false;
    },
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}
.time-sum-label {
  background-color: #f0f0f0;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 12px;
}
</style>
