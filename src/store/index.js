import { createStore } from 'vuex';
import { jwtDecode } from 'jwt-decode';

export default createStore({
  state: {
    isLoggedIn: !!localStorage.getItem('user'),
    role: localStorage.getItem('role') || null,
    id: localStorage.getItem('id') || null,
    selectedPlaces: [], // ✅ 장소 리스트 상태 추가
  },
  mutations: {
    login(state, token) {
      const decoded = jwtDecode(token);
      state.isLoggedIn = true;
      state.role = decoded.role;
      state.id = decoded.id;

      localStorage.setItem('user', token);
      localStorage.setItem('role', decoded.role);
      localStorage.setItem('id', decoded.id);
    },
    logout(state) {
      state.isLoggedIn = false;
      state.role = null;
      state.id = null;

      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
    },

    // ✅ 장소 관련 뮤테이션
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
    }
  },
  actions: {
    togglePlaceSelection({ commit, state }, place) {
      const exists = state.selectedPlaces.find(p => p.id === place.id);
      if (exists) {
        commit('removePlace', place.id);
      } else {
        commit('addPlace', place);
      }
    }
  },
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    getRole: (state) => state.role,
    getId: (state) => state.id,
    getSelectedPlaces: (state) => state.selectedPlaces, // ✅ getter 추가
  }
});
