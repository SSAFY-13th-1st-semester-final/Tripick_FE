<template>
  <div>
    <ImageSlider />
    <NavBar />
  </div>
</template>

<script>
import ImageSlider from '@/components/slider/ImageSlider.vue';
import NavBar from '@/components/layout/NavBar.vue';

export default {
  components: {
    ImageSlider,
    NavBar
  }
};
</script>
