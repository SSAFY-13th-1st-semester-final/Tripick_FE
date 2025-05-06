import { createStore } from 'vuex';
import { jwtDecode } from 'jwt-decode'; // named export로 가져오기

export default createStore({
  state: {
    isLoggedIn: !!localStorage.getItem('user'), // 로컬스토리지에 user가 있으면 로그인 상태
    role: localStorage.getItem('role') || null, // 로컬스토리지에서 role 값을 가져옴, 없으면 null
    username: localStorage.getItem('username') || null, // 로컬스토리지에서 username 값을 가져옴, 없으면 null
  },
  mutations: {
    login(state, token) {
      const decoded = jwtDecode(token);  // jwtDecode 사용
      state.isLoggedIn = true;
      state.role = decoded.role;  // 역할 정보 저장
      state.username = decoded.username;  // username 정보 저장

      // 로컬스토리지에 토큰, 역할, username 저장
      localStorage.setItem('user', token);
      localStorage.setItem('role', decoded.role); // role도 로컬스토리지에 저장
      localStorage.setItem('username', decoded.username); // username도 로컬스토리지에 저장
    },
    logout(state) {
      state.isLoggedIn = false;
      state.role = null; // 역할 초기화
      state.username = null; // username 초기화

      // 로컬스토리지에서 토큰, 역할, username 삭제
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
    },
  },
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    getRole: (state) => state.role,  // 역할을 가져오는 getter 추가
    getUsername: (state) => state.username,  // username을 가져오는 getter 추가
  },
});
