<template>
  <section
    :class="[
      'rounded-[--ka-r-lg] border border-[--ka-border] bg-[--ka-surface] shadow-[--ka-shadow-sm]',
      paddingClasses[padding],
      hover ? 'transition-shadow duration-200 hover:shadow-[--ka-shadow-md]' : '',
    ]"
  >
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: "none" | "sm" | "md" | "lg";
    hover?: boolean;
  }>(),
  {
    padding: "md",
    hover: false,
  },
);

const paddingClasses: Record<string, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};
</script>
