<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <div class="text-3xl font-semibold">
        <span>{{ totalPlacesCount }}</span>
      </div>
      <div class="text-xs text-gray-500 pb-1">
        <span>{{ formattedTotalStayTime }}</span>
      </div>
    </div>

    <div v-if="dayCount > 0" class="space-y-6">
      <div
        v-for="(places, dayIndex) in selectedPlacesByDay"
        :key="'day-' + dayIndex"
        class="day-section"
      >
        <!-- 일차 헤더 (클릭 가능) + 소요 시간 수평 정렬 -->
        <div class="flex justify-start gap-2 items-end mb-1">
          <h2
            class="text-sm font-bold cursor-pointer"
            :class="{'text-pink-500 underline': selectedDay === dayIndex + 1 }"
            @click="selectDay(dayIndex)"
          >
            {{ dayIndex + 1 }}일차
          </h2>
          <div class="text-xs text-gray-500">
            {{ formattedDayStayTime(dayIndex) }}
          </div>
        </div>

        <draggable
          v-model="selectedPlacesByDay[dayIndex]"
          :group="{ name: 'places' }"
          @end="onDragEnd"
          item-key="id"
          class="space-y-2"
        >
          <template #item="{ element: place, index }">
            <div
              :key="'place-' + place.id"
              class="flex items-center mb-4"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-full bg-pink-400 text-white text-xs font-bold flex-shrink-0 ml-1 mr-2"
              >
                {{ index + 1 }}
              </div>

              <transition name="fade">
                <div
                  v-if="!place.isEditingStayTime"
                  class="flex justify-between items-center flex-grow bg-white text-sm border rounded-lg px-3 py-4 shadow-sm"
                >
                  <!-- 비편집 모드 -->
                  <div class="flex-grow pr-2">
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
                          @click="toggleStayTimeEdit(dayIndex, place)"
                        >
                          {{ formattedStayTime(place) }}
                        </div>
                        <!-- 삭제 버튼 -->
                        <button
                          @click="removePlaceFromDay({ dayIndex, placeId: place.id })"
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
                </div>

                <!-- 편집 모드 -->
                <div
                  v-else
                  class="flex justify-between items-center flex-grow bg-white text-sm border rounded-lg px-3 py-4 shadow-sm"
                >
                  <div class="flex justify-between items-center gap-4 w-full">
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
                      @click="saveStayTimeEdit(dayIndex, place)"
                      class="text-blue-600 w-10 flex items-center justify-center rounded"
                    >
                      완료
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </template>
        </draggable>

        <div v-if="places.length === 0" class="text-xs text-gray-400">선택된 장소가 없습니다.</div>
      </div>
    </div>

    <div v-else class="text-gray-400">선택된 장소가 없습니다.</div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import draggable from 'vuedraggable';

export default {
  name: 'AddPlaceList',
  components: { draggable },
  props: {
    isSidePanelExpanded: Boolean,
  },

  computed: {
    ...mapGetters('places', [
      'getSelectedPlacesByDay',
      'getDayCount',
      'getTimeSettings',
      'getSelectedDay',
    ]),

    selectedPlacesByDay: {
      get() {
        return this.getSelectedPlacesByDay || [];
      },
      set(newVal) {
        // Vuex 액션으로 변경사항 전달
        this.updateSelectedPlacesByDay(newVal);
      },
    },

    dayCount() {
      return this.getDayCount || 0;
    },
    timeSettings() {
      return this.getTimeSettings || [];
    },
    selectedDay() {
      return this.getSelectedDay || 1;
    },
    totalPlacesCount() {
      return this.selectedPlacesByDay.reduce((acc, places) => acc + places.length, 0);
    },
    formattedTotalStayTime() {
      const totalMinutes = this.selectedPlacesByDay.flat().reduce((total, place) => {
        return total + (place.stayTime?.hours ?? 0) * 60 + (place.stayTime?.minutes ?? 0);
      }, 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}시간 ${minutes}분`;
    },
  },

  methods: {
    ...mapActions('places', [
      'removePlaceFromDay',
      'setSelectedDay',
      'initializePlacesByDay',
      'initializeTimeSettings',
      'updateSelectedPlacesByDay',
    ]),

    formattedStayTime(place) {
      return `${place.stayTime?.hours ?? 0}시간 ${place.stayTime?.minutes ?? 0}분`;
    },

    formattedDayStayTime(dayIndex) {
      const time = this.timeSettings[dayIndex];
      if (!time) return '0시간 0분';
      return `${time.hours ?? 0}시간 ${time.minutes ?? 0}분`;
    },

    selectDay(dayIndex) {
      this.setSelectedDay(dayIndex + 1);
    },

    toggleStayTimeEdit(dayIndex, place) {
      // 모든 일차 모든 장소 편집모드 해제 후 해당 장소만 편집모드 true 처리
      this.selectedPlacesByDay.forEach(dayPlaces => {
        dayPlaces.forEach(p => (p.isEditingStayTime = false));
      });
      place.isEditingStayTime = true;
    },

    saveStayTimeEdit(dayIndex, place) {
      place.isEditingStayTime = false;
    },

    onDragEnd() {
      // 드래그 후 상태는 v-model(setter)에서 바로 Vuex로 업데이트됨
    },
  },

  watch: {
    dayCount(newCount) {
      if (newCount && newCount > 0) {
        this.initializePlacesByDay(newCount);
        this.initializeTimeSettings(newCount);
      }
    },
  selectedPlacesByDay: {
    handler(newVal) {
      console.log('selectedPlacesByDay changed:', JSON.stringify(newVal, null, 2));
    },
    deep: true,
  },
  },

  mounted() {
    if (this.dayCount && this.dayCount > 0) {
      this.initializePlacesByDay(this.dayCount);
      this.initializeTimeSettings(this.dayCount);
    }
  },
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
  cursor: pointer;
}
.day-section {
  border-bottom: 1px solid #ddd;
  padding-bottom: 1rem;
}
.cursor-pointer {
  cursor: pointer;
}
.text-pink-500 {
  color: #ec4899;
}
.underline {
  text-decoration: underline;
}
</style>
