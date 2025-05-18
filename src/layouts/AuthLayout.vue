<template>
  <div class="auth-layout">
    <div class="auth-container glass-card">
      <div class="auth-logo">
        <router-link to="/" class="logo-link">
          <h1>Travel Glass</h1>
        </router-link>
      </div>
      
      <router-view />
      
      <div class="auth-footer">
        <p>&copy; {{ new Date().getFullYear() }} Travel Glass. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Composition API를 사용한 AuthLayout 컴포넌트
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.auth-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: $spacing-md;
}

.auth-container {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;
  margin-top: -$spacing-xl;
  
  @include glassmorphism(0.8, 12px);
  box-shadow: $shadow-xl;
}

.auth-logo {
  margin-bottom: $spacing-xl;
  text-align: center;
  
  .logo-link {
    text-decoration: none;
    
    h1 {
      font-size: 2rem;
      color: $primary-color;
      margin: 0;
    }
  }
}

.auth-footer {
  margin-top: $spacing-xl;
  text-align: center;
  font-size: 0.875rem;
  color: $dark-gray;
}
</style>
