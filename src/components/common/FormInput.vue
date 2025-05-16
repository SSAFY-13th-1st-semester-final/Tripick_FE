<!-- components/common/FormInput.vue -->
<template>
  <div class="relative">
    <input
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="$emit('focus', field)"
      @blur="$emit('blur')"
      class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <label
      :class="[
        'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
        modelValue || focused === field
          ? 'text-xs top-1 text-blue-800'
          : 'top-3.5',
      ]"
    >
      {{ label }}
    </label>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  modelValue: String,
  type: {
    type: String,
    default: "text",
  },
  field: String,
  focused: String,
});
defineEmits(["update:modelValue", "focus"]);
</script>
