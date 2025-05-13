<template>
  <div v-if="message" 
       class="fixed top-20 max-w-xl px-4 py-3 bg-gray-300 text-white rounded-full shadow-lg text-center z-[9999] animate-fade-in-out">
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'Notification',
  props: {
    message: {
      type: String,
      required: false,
      default: '',
    },
  },
  watch: {
    message(newMessage) {
      if (newMessage) {
        setTimeout(() => {
          this.$emit('clear-message');
        }, 5000);
      }
    },
  },
};
</script>

<style scoped>
@keyframes fade-in-out {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(20px);
  }
}

.animate-fade-in-out {
  animation: fade-in-out 3s ease-in-out forwards;
}
</style>
