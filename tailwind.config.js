/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['AppleSDGothicNeo', 'sans-serif'], // 기본 폰트를 AppleSDGothicNeo로 설정
      },
    },
  },
  plugins: [],
}
