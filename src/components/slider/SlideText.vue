<template>
  <div>
    <!-- Title -->
    <transition name="fade-up-title" mode="out-in">
      <h2
        v-if="showTitle"
        :key="title"
        class="text-2xl font-bold mb-2"
      >
        {{ title }}
      </h2>
    </transition>

    <!-- Description -->
    <transition name="fade-up-desc" mode="out-in">
      <p
        v-if="showDescription"
        :key="description"
      >
        {{ description }}
      </p>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    description: String,
    showTitle: Boolean,
    showDescription: Boolean,
  }
};
</script>
