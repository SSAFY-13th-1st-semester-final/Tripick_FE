<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2 class="modal-title">어디로 여행을 떠나시나요?</h2>
      <KoreaMap />
    </div>
  </div>
</template>

<script>
import KoreaMap from './KoreaMap.vue';

export default {
  name: 'KoreaMapModal',
  components: {
    KoreaMap,
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 반투명 배경 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 32px;
  max-width: 1100px;
  width: 100%;
  height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 24px;
  text-align: center;
}
</style>
