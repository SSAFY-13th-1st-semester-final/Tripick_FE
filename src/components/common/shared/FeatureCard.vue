<template>
  <div class="feature-card glass-card">
    <div class="feature-icon">{{ icon }}</div>
    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-description">
      {{ description }}
    </p>
    <slot></slot>
  </div>
</template>

<script setup>
// Props 정의
const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "@/assets/styles" as *;

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: $spacing-xl;

  &:hover {
    transform: translateY(-5px);
  }

  &-icon {
    font-size: 3rem;
    margin-bottom: $spacing-md;
  }

  &-title {
    font-size: 1.25rem;
    margin-bottom: $spacing-md;
  }

  &-description {
    color: rgba($primary-color, 0.8);
    line-height: 1.6;
  }
}
</style>
