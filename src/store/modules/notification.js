// store/modules/notification.js
export default {
  namespaced: true,
  
  state: () => ({
    notificationMessage: ''
  }),
  
  mutations: {
    setNotification(state, message) {
      state.notificationMessage = message;
    },
    
    clearNotification(state) {
      state.notificationMessage = '';
    }
  },
  
  actions: {
    notify({ commit }, message) {
      commit('setNotification', message);
      setTimeout(() => {
        commit('clearNotification');
      }, 3000);
    }
  },
  
  getters: {
    notificationMessage: (state) => state.notificationMessage
  }
};