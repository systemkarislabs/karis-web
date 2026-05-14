<template>
  <span
    class="inline-block animate-pulse bg-[--ka-border]"
    :class="roundedClasses[rounded]"
    :style="{ width, height }"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    rounded?: "sm" | "md" | "full";
  }>(),
  {
    width: "100%",
    height: "1rem",
    rounded: "sm",
  },
);

const roundedClasses: Record<string, string> = {
  sm: "rounded-[--ka-r-sm]",
  md: "rounded-[--ka-r-md]",
  full: "rounded-full",
};
</script>
