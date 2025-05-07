module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-recommended',  // Vue 3에 적합한 규칙 사용
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
  },
  plugins: [
    'vue'  // Vue 플러그인 활성화
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-unused-vars': 'off',
    
  }
}
