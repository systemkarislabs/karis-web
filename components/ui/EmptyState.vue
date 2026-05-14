<template>
  <div class="relative flex flex-col items-center justify-center overflow-hidden rounded-[--ka-r-lg] px-6 py-12 text-center">
    <component :is="icon" v-if="icon" class="mb-4 h-16 w-16 text-[--ka-fg-muted] opacity-30" />
    <h3 v-if="title" class="text-lg font-semibold text-[--ka-fg]">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-md text-sm text-[--ka-fg-2]">{{ description }}</p>
    <NuxtLink v-if="actionLabel && actionLink" :to="actionLink" class="btn-primary mt-5">
      {{ actionLabel }}
    </NuxtLink>
    <Button v-else-if="actionLabel" class="mt-5" type="button" @click="$emit('action')">
      {{ actionLabel }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

defineProps<{
  icon?: Component;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionLink?: string;
}>();

defineEmits<{
  action: [];
}>();
</script>
