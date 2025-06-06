// @/assets/data/homeFeatures.js
import aiIcon from "@/assets/data/images/ai-icon.png";
import historyIcon from "@/assets/data/images/history-icon.png";
import mobileIcon from "@/assets/data/images/mobile-icon.png";

export const homeFeatures = [
  {
    id: 1,
    iconImage: aiIcon, // import된 URL 사용
    title: "스마트 AI 여행 일정 솔루션",
    description: "나의 여행 계획을 AI와 함께 스마트하게 관리하세요.",
  },
  {
    id: 2,
    iconImage: historyIcon, // import된 URL 사용
    title: "나만의 여행, 함께 나누는 기쁨",
    description: "찰나의 순간을 기록하고, 공유해보세요.",
  },
  {
    id: 3,
    iconImage: mobileIcon, // import된 URL 사용
    title: "모바일 최적화",
    description: "언제 어디서나 모바일로 여행 정보를 확인하고 예약하세요.",
  },
];
