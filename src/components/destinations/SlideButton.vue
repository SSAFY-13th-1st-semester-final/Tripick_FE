<template>
  <button
    :disabled="disabled"
    @click="$emit('click')"
    :class="['slide-button', { disabled }]"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'SlideButton',
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.slide-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 2rem;
  color: gray;
  transition: color 0.3s;
}

.slide-button:hover:not(.disabled) {
  color: black;
}

.slide-button.disabled {
  color: transparent;
  cursor: default;
  pointer-events: none;
  background-color: white;
}
</style>
