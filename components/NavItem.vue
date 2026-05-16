<template>
  <NuxtLink
    :to="to"
    class="flex min-h-10 items-center gap-3 rounded-[--ka-r-md] px-3 text-sm font-medium text-[--ka-fg-2] transition-colors duration-150 hover:bg-[--ka-gray-50] hover:text-[--ka-fg]"
    active-class="!bg-[--ka-brand-50] !text-[--ka-brand-dark] !font-semibold"
  >
    <component :is="icon" class="h-5 w-5 shrink-0" :stroke-width="1.75" />
    <span class="truncate">{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Component } from "vue";
defineProps<{ to: string; icon: Component; label: string }>();
</script>
