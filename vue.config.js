const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
  // Babel 등 의존성 트랜스파일 설정
  transpileDependencies: true,

  // 저장 시 Lint 자동 검사 비활성화
  lintOnSave: false,

  // 개발 서버 설정
  devServer: {
    port: 8081, // Vue 개발 서버 포트

    // API 요청 프록시 설정 (백엔드 서버로 리디렉션)
    proxy: {
      '/api': {
        target: 'http://3.39.187.140:8080', // 백엔드(Spring Boot) 서버 주소
        changeOrigin: true, // 호스트 헤더를 타겟 주소로 변경
      },
    },
  },

  // Webpack 설정 확장
  configureWebpack: {
    plugins: [
      // Vue feature flag 설정: hydration mismatch 디버깅 정보 출력 여부
      // SSR을 사용하지 않으면 false로 설정 (빌드 최적화)
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      }),
    ],
  },
});
