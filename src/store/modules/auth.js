// store/modules/auth.js
import { jwtDecode } from 'jwt-decode';

export default {
  namespaced: true,
  
  state: () => ({
    isLoggedIn: !!localStorage.getItem('user'),
    role: localStorage.getItem('role') || null,
    id: localStorage.getItem('id') || null,
  }),
  
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
    }
  },
  
  actions: {
    // 필요한 경우 인증 관련 액션 추가
  },
  
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    getRole: (state) => state.role,
    getId: (state) => state.id
  }
};