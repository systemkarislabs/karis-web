<template>
  <div>
    <div class="mb-5 flex gap-1 border-b border-[--ka-border]">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'min-h-10 rounded-t-[--ka-r-sm] px-3 text-sm font-medium transition-colors',
          modelValue === tab.key
            ? 'border-b-2 border-[--ka-brand] text-[--ka-brand-dark]'
            : 'text-[--ka-fg-2] hover:text-[--ka-fg]',
        ]"
        @click="emit('update:modelValue', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Tab {
  key: string;
  label: string;
}

withDefaults(
  defineProps<{
    tabs: Tab[];
    modelValue: string;
  }>(),
  {
    tabs: () => [],
    modelValue: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
