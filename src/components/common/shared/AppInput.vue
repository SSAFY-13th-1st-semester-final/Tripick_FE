<template>
  <div class="app-input">
    <label v-if="label" :for="id" class="app-input__label">
      {{ label }}
      <span v-if="required" class="app-input__required">*</span>
    </label>
    
    <div class="app-input__wrapper" :class="{ 'app-input__wrapper--invalid': invalid }">
      <input
        v-if="type !== 'textarea'"
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        class="app-input__field"
        @input="updateValue"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      
      <textarea
        v-else
        :id="id"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        class="app-input__textarea"
        @input="updateValue"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      ></textarea>
      
      <slot name="icon"></slot>
    </div>
    
    <div v-if="invalid && errorMessage" class="app-input__error">
      {{ errorMessage }}
    </div>
    
    <div v-if="helpText" class="app-input__help">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

// 이벤트 정의
const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

// Props 정의
const props = defineProps({
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).substr(2, 9)}`
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => [
      'text', 'password', 'email', 'number', 'tel', 'url', 'search', 
      'date', 'time', 'datetime-local', 'textarea'
    ].includes(value)
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  invalid: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  rows: {
    type: Number,
    default: 4
  }
})

// 값이 변경될 때 상위 컴포넌트에 알리는 함수
const updateValue = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/glassmorphism' as *;

.app-input {
  margin-bottom: $spacing-md;
  
  &__label {
    display: block;
    font-size: 0.875rem;
    font-weight: $font-weight-medium;
    color: $primary-color;
    margin-bottom: $spacing-xs;
  }
  
  &__required {
    color: $error-color;
    margin-left: 2px;
  }
  
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    &--invalid {
      .app-input__field,
      .app-input__textarea {
        border-color: $error-color;
        
        &:focus {
          box-shadow: 0 0 0 1px $error-color;
        }
      }
    }
  }
  
  &__field,
  &__textarea {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    border-radius: 8px;
    font-family: $font-family;
    font-size: 1rem;
    color: $primary-color;
    border: 1px solid rgba($primary-color, 0.2);
    
    @include glassmorphism(0.4, 5px);
    
    &::placeholder {
      color: rgba($primary-color, 0.5);
    }
    
    &:focus {
      outline: none;
      border-color: rgba($primary-color, 0.5);
      box-shadow: 0 0 0 1px rgba($primary-color, 0.5);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      background: rgba($light-gray, 0.5);
    }
  }
  
  &__textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  &__error {
    margin-top: $spacing-xs;
    font-size: 0.75rem;
    color: $error-color;
  }
  
  &__help {
    margin-top: $spacing-xs;
    font-size: 0.75rem;
    color: $dark-gray;
  }
}
</style>