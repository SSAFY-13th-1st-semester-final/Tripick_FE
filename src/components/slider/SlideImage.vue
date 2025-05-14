<template>
  <div
    class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
    :class="{ 'opacity-100 z-0': active, 'opacity-0 z-0': !active }"
  >
    <img :src="slide.image" class="w-full h-full object-cover blur-xs" />
  </div>
</template>

<script>
export default {
  props: {
    slide: Object,
    active: Boolean
  }
};
</script>
