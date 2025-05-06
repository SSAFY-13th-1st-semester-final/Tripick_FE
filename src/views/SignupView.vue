<template>
    <div>
      <h2>회원가입</h2>
      <form @submit.prevent="signup">
        <label>아이디:
          <input v-model="form.username" required />
        </label><br />
        <label>비밀번호:
          <input type="password" v-model="form.password" required />
        </label><br />
        <label>이름:
          <input v-model="form.name" required />
        </label><br />
        <label>이메일:
          <input type="email" v-model="form.email" required />
        </label><br />
        <button type="submit">회원가입</button>
      </form>
      <p v-if="message">{{ message }}</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        form: {
          username: '',
          password: '',
          name: '',
          email: ''
        },
        message: ''
      };
    },
    methods: {
      async signup() {
        try {
          await axios.post('/api/v1/member', this.form);
          this.message = '회원가입 성공! 로그인 페이지로 이동하세요.';
          this.$router.push('/login');
        } catch (err) {
          this.message = '회원가입 실패';
        }
      }
    }
  };
  </script>
  