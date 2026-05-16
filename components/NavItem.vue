<template>
  <NuxtLink
    :to="to"
    class="flex min-h-10 items-center gap-3 rounded-[--ka-r-md] px-3 text-sm font-medium text-[--ka-fg-2] transition-colors duration-150 hover:bg-[--ka-gray-50] hover:text-[--ka-fg]"
    active-class="!bg-[--ka-brand-50] !text-[--ka-brand-dark] !font-semibold"
  >
    <Icon :name="icon" class="h-5 w-5 shrink-0" :size="20" />
    <span class="truncate">{{ label }}</span>
    <span v-if="badge" class="ml-auto flex size-5 items-center justify-center rounded-full bg-[--ka-brand] text-[10px] font-bold text-white">{{ badge }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string; icon: string; label: string; badge?: number }>();
</script>
