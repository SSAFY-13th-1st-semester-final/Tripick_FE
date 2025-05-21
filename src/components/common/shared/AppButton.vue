<template>
  <button
    :class="[
      'app-button',
      `app-button--${variant}`,
      `app-button--${size}`,
      { 'app-button--block': block },
      { 'app-button--loading': loading },
      { 'app-button--glass': glass }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="app-button__loader"></span>
    <span class="app-button__content" :class="{ 'app-button__content--hidden': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<script setup>
// 이벤트 정의
const emit = defineEmits(['click'])

// Props 정의
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'accent', 'outline', 'text', 'success', 'error', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  block: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  glass: {
    type: Boolean,
    default: true
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.app-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: $font-family;
  font-weight: $font-weight-medium;
  text-align: center;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all $transition-fast;
  overflow: hidden;
  border-radius: 8px;
  
  &--glass {
    @include glassmorphism(0.5, 5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  &--block {
    display: flex;
    width: 100%;
  }
  
  &--primary {
    background-color: rgba($primary-color, 0.9);
    color: $white;
    
    &:hover:not(:disabled) {
      background-color: rgba($primary-color, 1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($primary-color, 0.3);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--secondary {
    background-color: rgba($white, 0.6);
    color: $primary-color;
    
    &:hover:not(:disabled) {
      background-color: rgba($white, 0.8);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--accent {
    background-color: rgba($accent-color, 0.9);
    color: $white;
    
    &:hover:not(:disabled) {
      background-color: rgba($accent-color, 1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($accent-color, 0.3);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--outline {
    background-color: transparent;
    border: 1px solid rgba($primary-color, 0.6);
    color: $primary-color;
    
    &:hover:not(:disabled) {
      background-color: rgba($primary-color, 0.1);
      transform: translateY(-2px);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--text {
    background-color: transparent;
    color: $primary-color;
    
    &:hover:not(:disabled) {
      background-color: rgba($primary-color, 0.1);
    }
  }
  
  &--success {
    background-color: rgba($success-color, 0.9);
    color: $white;
    
    &:hover:not(:disabled) {
      background-color: rgba($success-color, 1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($success-color, 0.3);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--error {
    background-color: rgba($error-color, 0.9);
    color: $white;
    
    &:hover:not(:disabled) {
      background-color: rgba($error-color, 1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($error-color, 0.3);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--sm {
    font-size: 0.875rem;
    padding: $spacing-xs $spacing-md;
    height: 32px;
  }
  
  &--md {
    font-size: 1rem;
    padding: $spacing-sm $spacing-lg;
    height: 40px;
  }
  
  &--lg {
    font-size: 1.125rem;
    padding: $spacing-md $spacing-xl;
    height: 48px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &--loading {
    cursor: default;
  }
  
  &__loader {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: button-spinner 0.8s linear infinite;
  }
  
  &__content {
    transition: opacity $transition-fast;
    
    &--hidden {
      opacity: 0;
    }
  }
}

@keyframes button-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>