/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'apple-gothic': ['AppleSDGothicNeo', 'sans-serif'], // AppleSDGothicNeo를 기본 폰트로 설정
      },
      fontWeight: {
        'ultra-light': 100,  // 100 두께
        'thin': 200,         // 200 두께
        'light': 300,        // 300 두께
        'regular': 400,      // 400 두께 (기본)
        'medium': 500,       // 500 두께
        'semi-bold': 600,    // 600 두께
        'bold': 700,         // 700 두께
        'extra-bold': 800,   // 800 두께
        'heavy': 900,        // 900 두께
      }
    }
  },
  plugins: [],
}
