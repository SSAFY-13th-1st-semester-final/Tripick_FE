export default {
  state: {
    selectedPlaces: []
  },
  mutations: {
    addPlace(state, place) {
      state.selectedPlaces.push(place);
    },
    removePlace(state, placeId) {
      state.selectedPlaces = state.selectedPlaces.filter(p => p.id !== placeId);
    },
  },
  actions: {
    addPlace({ commit }, place) {
      commit('addPlace', place);
    },
    removePlace({ commit }, placeId) {
      commit('removePlace', placeId);
    },
  },
  getters: {
    selectedPlaces: state => state.selectedPlaces,
  },
};
