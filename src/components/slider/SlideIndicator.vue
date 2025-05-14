<template>
  <div class="absolute bottom-3 left-40 flex items-center space-x-4 w-96 pointer-events-auto">
    <div class="bg-gray-900 rounded-full flex justify-center items-center">
      <button
        @click="$emit('prev')"
        class="text-white hover:bg-opacity-100 px-3 py-1 rounded-full"
      >
        ‹
      </button>

      <span class="text-white text-sm mx-0 inline-block text-center" style="min-width: 1rem;">
        {{ currentIndex + 1 }}
      </span>
      <span class="text-white text-sm mx-0 text-opacity-50">/</span>
      <span class="text-white text-sm mx-0 inline-block text-center" style="min-width: 1rem;">
        {{ total }}
      </span>

      <button
        @click="$emit('next')"
        class="text-white hover:bg-opacity-100 px-3 py-1 rounded-full"
      >
        ›
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    currentIndex: Number,
    total: Number
  }
};
</script>
