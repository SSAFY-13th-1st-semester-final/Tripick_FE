<template>
  <section class="features">
    <div class="container">
      <h2 class="section-title">{{ title }}</h2>
      <div class="features-grid">
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import FeatureCard from "@/components/common/shared/FeatureCard.vue";

// Props 정의
const props = defineProps({
  title: {
    type: String,
    default: "Trapick의 특별한 기능",
  },
  features: {
    type: Array,
    default: () => [
      {
        id: 1,
        icon: "🔍",
        title: "맞춤형 여행 검색",
        description: "취향과 예산에 맞는 완벽한 여행 계획을 찾아보세요.",
      },
      {
        id: 2,
        icon: "💎",
        title: "특별한 경험",
        description:
          "현지 문화를 체험할 수 있는 특별한 여행 경험을 제공합니다.",
      },
      {
        id: 3,
        icon: "📱",
        title: "모바일 최적화",
        description: "언제 어디서나 모바일로 여행 정보를 확인하고 예약하세요.",
      },
    ],
  },
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.features {
  padding: $spacing-3xl 0;
  background-color: rgba($light-gray, 0.3);

  .section-title {
    text-align: center;
    margin-bottom: $spacing-2xl;
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-xl;

    @media (max-width: $breakpoint-lg) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: $breakpoint-md) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
