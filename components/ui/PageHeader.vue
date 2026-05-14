<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="min-w-0">
      <p v-if="eyebrow" class="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[--ka-brand]">{{ eyebrow }}</p>
      <h1 class="truncate text-[28px] font-bold leading-tight text-[--ka-fg]">{{ title }}</h1>
      <p v-if="description" class="mt-1 max-w-3xl text-sm text-[--ka-fg-2]">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  eyebrow?: string;
}>();
</script>
