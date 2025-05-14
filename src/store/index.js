import { createStore } from 'vuex';
import auth from '@/store/modules/auth';
import notification from '@/store/modules/notification';

export default createStore({
  modules: {
    auth,
    notification,
  },

  state: {
    selectedPlaces: [],
  },
  mutations: {
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
  },
  actions: {
    togglePlaceSelection({ commit, state }, place) {
      const exists = state.selectedPlaces.find(p => p.id === place.id);
      if (exists) {
        commit('removePlace', place.id);
      } else {
        commit('addPlace', place);
      }
    },
  },
  getters: {
    getSelectedPlaces: (state) => state.selectedPlaces, // ✅ getter 추가
  }
});
