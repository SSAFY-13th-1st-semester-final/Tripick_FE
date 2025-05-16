<template>
  <div>
    <ImageSlider />
    <NavBar @open-map="isMapModalOpen = true" />

    <KoreaMapModal v-if="isMapModalOpen" @close="isMapModalOpen = false" />
  </div>
</template>

<script>
import ImageSlider from "@/components/slider/ImageSlider.vue";
import NavBar from "@/components/layout/NavBar.vue";
import KoreaMapModal from "@/components/destinations/KoreaMapModal.vue";

export default {
  name: "HomeView",
  components: {
    ImageSlider,
    NavBar,
    KoreaMapModal,
  },
  data() {
    return {
      isMapModalOpen: false,
    };
  },
};
</script>
