<template>
  <div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999]">
      <Notification
        :message="notificationMessage"
        @clear-message="clearNotification"
      />
    </div>

  <div class="app-container">

    <AppHeader v-if="!isMapView" />

    <div :class="isMapView ? 'flex-grow overflow-hidden' : 'content-area'">
      <router-view />
    </div>

    <AppFooter v-if="!isMapView" />
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/layout/Header.vue';
import AppFooter from '@/components/layout/Footer.vue';
import Notification from '@/components/alert/Notification.vue';

export default {
  name: 'App',
  components: { AppHeader, AppFooter, Notification },
  setup() {
    const route = useRoute();
    const isMapView = computed(() => route.path === '/map');
    return { isMapView };
  },
  computed: {
    ...mapGetters(['notificationMessage']),
  },
  methods: {
    ...mapMutations(['clearNotification']),
  },
};
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Apple SD Gothic Neo', sans-serif;
}

* {
  font-family: inherit;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-area {
  flex: 1;
  overflow-y: auto; /* 콘텐츠 영역에서 스크롤 가능 */
}

footer {
  background-color: #f3f4f6;
  color: #fff;
  text-align: center;
  padding: 0.5rem;
  width: 100%;
}

footer .hover\:text-white:hover {
  font-weight: 600;
  color: gray;
}
</style>
