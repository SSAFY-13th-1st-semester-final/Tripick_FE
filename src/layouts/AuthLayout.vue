<template>
  <div class="auth-layout">
    <div class="auth-container glass-card">
      <div class="auth-logo">
        <router-link to="/" class="logo-link">
          <h1>Trip<span class="accent-char">!</span>ck</h1>
        </router-link>
      </div>

      <router-view />

      <div class="auth-footer">
        <p>
          &copy; {{ new Date().getFullYear() }} Trip<span class="accent-char"
            >!</span
          >ck. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Composition API를 사용한 AuthLayout 컴포넌트
</script>

<style lang="scss" scoped>
@use "@/assets/styles/glassmorphism" as *;

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
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl;
  margin-top: $spacing-2xl;

  @include glassmorphism(0.8, 12px);
  box-shadow: $shadow-xl;
}

.auth-logo {
  margin-bottom: $spacing-md;
  text-align: center;

  .logo-link {
    text-decoration: none;

    h1 {
      font-size: 1.5rem;
      color: $primary-color;
      margin: 0;
      font-weight: $font-weight-bold;

      .accent-char {
        color: $accent-color;
      }
    }
  }
}

.auth-footer {
  margin-top: $spacing-xl;
  text-align: center;
  font-size: 0.875rem;
  color: $dark-gray;

  .accent-char {
    color: $accent-color;
  }
}

@media (max-width: $breakpoint-md) {
  .auth-container {
    min-height: 500px;
    margin-top: $spacing-lg;
    padding: $spacing-lg;
  }

  .auth-logo {
    margin-bottom: $spacing-sm;
    .logo-link h1 {
      font-size: 1.25rem;
    }
  }
}
</style>
