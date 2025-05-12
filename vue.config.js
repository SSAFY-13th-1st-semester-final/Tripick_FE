const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,

  devServer: {
    port: 8081,  // Vue 개발 서버 포트

    // 모든 요청을 localhost:8080으로 프록시
    proxy: {
      '/api': {
        target: 'http://3.39.187.140:8080', // Spring 서버 주소
        changeOrigin: true,
        
      }
    }
  }
});
