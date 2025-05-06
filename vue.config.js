const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    port: 8081,  // Vue 개발 서버 포트

    proxy: {
      '/mvc': {
        target: 'http://localhost:8080', // Spring 서버 주소
        changeOrigin: true,
      }
    }
  }
});
