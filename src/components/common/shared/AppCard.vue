<template>
  <div 
    class="app-card" 
    :class="[
      { 'app-card--hover': hover },
      { 'app-card--flat': flat }
    ]"
  >
    <div v-if="$slots.image" class="app-card__image">
      <slot name="image"></slot>
    </div>
    
    <div class="app-card__content">
      <div v-if="$slots.header" class="app-card__header">
        <slot name="header"></slot>
      </div>
      
      <div class="app-card__body">
        <slot></slot>
      </div>
      
      <div v-if="$slots.footer" class="app-card__footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props 정의
const props = defineProps({
  hover: {
    type: Boolean,
    default: true
  },
  flat: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.app-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  transition: transform $transition-normal, box-shadow $transition-normal;
  
  @include glassmorphism(0.7, 10px);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  
  &--hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(31, 38, 135, 0.15);
  }
  
  &--flat {
    box-shadow: none;
  }
  
  &__image {
    width: 100%;
    position: relative;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  &__header {
    padding: $spacing-md $spacing-lg $spacing-xs;
    border-bottom: 1px solid rgba($primary-color, 0.1);
  }
  
  &__body {
    flex: 1;
    padding: $spacing-md $spacing-lg;
  }
  
  &__footer {
    padding: $spacing-xs $spacing-lg $spacing-md;
    border-top: 1px solid rgba($primary-color, 0.1);
  }
}
</style>