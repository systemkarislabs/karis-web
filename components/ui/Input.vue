<template>
  <div>
    <label v-if="label" :for="inputId" class="mb-1.5 block text-sm font-medium text-[--ka-fg]">
      {{ label }}
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :autocomplete="autocomplete"
      :class="[
        'input-field',
        error ? 'border-[--ka-danger]' : '',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="helper && !error" class="mt-1.5 text-xs text-[--ka-fg-muted]">{{ helper }}</p>
    <p v-if="error" class="mt-1.5 text-sm text-[--ka-danger]" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const inputId = `input-${useId()}`;

withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    type?: string;
    placeholder?: string;
    error?: string;
    helper?: string;
    disabled?: boolean;
    required?: boolean;
    autocomplete?: string;
  }>(),
  {
    type: "text",
    disabled: false,
    required: false,
  },
);

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
