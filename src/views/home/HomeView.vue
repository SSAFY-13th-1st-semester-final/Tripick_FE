<template>
  <div>
    <ImageSlider />
    <NavBar />
  </div>

  <div>
    <h1>대한민국 지도</h1>
    <KoreaMap />
  </div>
</template>

<script>
import ImageSlider from '@/components/slider/ImageSlider.vue';
import NavBar from '@/components/layout/NavBar.vue';

import KoreaMap from '@/components/destinations/KoreaMap.vue';


export default {
  components: {
    ImageSlider,
    NavBar,
    KoreaMap
  }
};
</script>
