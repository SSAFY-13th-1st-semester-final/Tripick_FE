export default {
  namespaced: true,

  state: () => ({
    selectedPlaces: [], // 평면적 장소 리스트 (기존 유지)
    selectedPlacesByDay: [], // 일자별 장소 리스트
    selectedRegion: null,
    selectedDay: 1,
    tripDates: {
      startDate: null,
      endDate: null,
      nightCount: null,
      dayCount: null,
    },
    timeSettings: [], // 날짜별 시간 설정
  }),

  mutations: {
    // 평면적 장소 리스트 추가
    addPlace(state, place) {
      const exists = state.selectedPlaces.some(p => p.id === place.id);
      if (!exists) {
        state.selectedPlaces.push({
          ...place,
          stayTime: { hours: 2, minutes: 0 },
          isEditingStayTime: false,
        });
      }
    },

    // 평면적 장소 리스트 제거
    removePlace(state, placeId) {
      state.selectedPlaces = state.selectedPlaces.filter(p => p.id !== placeId);
    },

    clearSelectedPlaces(state) {
      state.selectedPlaces = [];
    },

    updateStayTime(state, { placeId, hours, minutes }) {
      const place = state.selectedPlaces.find(p => p.id === placeId);
      if (place) {
        place.stayTime = { hours, minutes };
      }
    },

    toggleEditingMode(state, placeId) {
      state.selectedPlaces.forEach(p => p.isEditingStayTime = false);
      const place = state.selectedPlaces.find(p => p.id === placeId);
      if (place) {
        place.isEditingStayTime = true;
      }
    },

    exitEditingMode(state, placeId) {
      const place = state.selectedPlaces.find(p => p.id === placeId);
      if (place) {
        place.isEditingStayTime = false;
      }
    },

    // 여행 날짜 및 지역 설정
    setTripDates(state, { startDate, endDate }) {
      state.tripDates.startDate = startDate;
      state.tripDates.endDate = endDate;
    },

    clearTripDates(state) {
      state.tripDates.startDate = null;
      state.tripDates.endDate = null;
    },

    setTripCount(state, { nightCount, dayCount }) {
      state.tripDates.nightCount = nightCount;
      state.tripDates.dayCount = dayCount;
    },

    clearTripCount(state) {
      state.tripDates.nightCount = null;
      state.tripDates.dayCount = null;
    },

    setSelectedRegion(state, selectedRegion) {
      state.selectedRegion = selectedRegion;
    },

    clearSelectedRegion(state) {
      state.selectedRegion = null;
    },

    // 시간 설정 관련
    setTimeSettings(state, settingsArray) {
      state.timeSettings = settingsArray;
    },

    updateTimeSetting(state, { index, hours, minutes }) {
      if (state.timeSettings[index]) {
        state.timeSettings[index] = { hours, minutes };
      }
    },

    clearTimeSettings(state) {
      state.timeSettings = [];
    },

    // 일차별 장소 리스트 초기화
    initializePlacesByDay(state, dayCount) {
      state.selectedPlacesByDay = Array.from({ length: dayCount }, () => []);
    },

    // 일차별 장소 추가
    addPlaceToDay(state, { dayIndex, place }) {
      if (!state.selectedPlacesByDay[dayIndex]) {
        state.selectedPlacesByDay[dayIndex] = [];
      }
      const exists = state.selectedPlacesByDay[dayIndex].some(p => p.id === place.id);
      if (!exists) {
        state.selectedPlacesByDay[dayIndex].push({
          ...JSON.parse(JSON.stringify(place)),
          stayTime: { hours: 2, minutes: 0 },
          isEditingStayTime: false,
        });
      }
    },

    removePlaceFromDay(state, { dayIndex, placeId }) {
      // 해당 일차의 장소 목록에서 삭제
      if (state.selectedPlacesByDay[dayIndex]) {
        state.selectedPlacesByDay[dayIndex] = state.selectedPlacesByDay[dayIndex].filter(
          p => p.id !== placeId
        );
      }

      // 전체 선택된 장소 배열에서도 삭제
      state.selectedPlaces = state.selectedPlaces.filter(p => p.id !== placeId);
    },

    clearPlacesByDay(state) {
      state.selectedPlacesByDay = [];
    },

    // 선택된 일차 변경
    setSelectedDay(state, day) {
      state.selectedDay = day;
    },
  },

  actions: {
    // 장소 토글 (추가/삭제) - selectedDay 기준으로 일차별 장소도 관리
    togglePlaceSelection({ commit, state }, place) {
      const exists = state.selectedPlaces.find(p => p.id === place.id);
      const dayIndex = state.selectedDay - 1;

      console.log("!!!");

      if (exists) {
        commit('removePlace', place.id);
        commit('removePlaceFromDay', { dayIndex, placeId: place.id });
      } else {
        commit('addPlace', place);
        commit('addPlaceToDay', { dayIndex, place });
      }
    },

    initializeTimeSettings({ commit }, dayCount) {
      const defaultSettings = Array(dayCount).fill().map(() => ({
        hours: 12,
        minutes: 0,
      }));
      commit('setTimeSettings', defaultSettings);
    },

    updateOneTimeSetting({ commit }, { index, hours, minutes }) {
      commit('updateTimeSetting', { index, hours, minutes });
    },

    initializePlacesByDay({ commit }, dayCount) {
      commit('initializePlacesByDay', dayCount);
    },

    addPlaceToDay({ commit }, payload) {
      commit('addPlaceToDay', payload);
    },

    removePlaceFromDay({ commit }, payload) {
      commit('removePlaceFromDay', payload);
    },

    setSelectedDay({ commit }, day) {
      commit('setSelectedDay', day);
    },
  },

  getters: {
    getSelectedPlaces: (state) => state.selectedPlaces,
    getSelectedPlacesByDay: (state) => state.selectedPlacesByDay,
    getSelectedDay: (state) => state.selectedDay,
    getTripDates: (state) => state.tripDates,
    getNightCount: (state) => state.tripDates.nightCount,
    getDayCount: (state) => state.tripDates.dayCount,
    getSelectedRegion: (state) => state.selectedRegion,
    getTimeSettings: (state) => state.timeSettings,
  }
};
