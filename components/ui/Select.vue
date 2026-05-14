<template>
  <div>
    <label v-if="label" :for="selectId" class="mb-1.5 block text-sm font-medium text-[--ka-fg]">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :class="[
          'input-field appearance-none pr-10',
          error ? 'border-[--ka-danger]' : '',
          disabled ? 'cursor-not-allowed opacity-50' : '',
        ]"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--ka-fg-muted]" />
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-[--ka-danger]" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";

const selectId = `select-${useId()}`;

withDefaults(
  defineProps<{
    modelValue: string;
    options: { value: string; label: string }[];
    label?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: "Selecionar...",
    disabled: false,
  },
);

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
