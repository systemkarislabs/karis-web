<template>
  <span :class="['inline-flex items-center gap-1 rounded-[--ka-r-pill] font-semibold', sizeClasses[size], variantClasses[variant]]">
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full bg-current" />
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "default" | "neutral" | "success" | "warning" | "destructive" | "bot" | "outline";
    size?: "sm" | "md";
    dot?: boolean;
  }>(),
  {
    variant: "default",
    size: "md",
    dot: false,
  },
);

const sizeClasses: Record<string, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

const variantClasses: Record<string, string> = {
  default: "bg-[--ka-info-bg] text-[--ka-brand-dark]",
  neutral: "bg-[--ka-gray-100] text-[--ka-fg-2]",
  success: "bg-[--ka-success-bg] text-[--ka-success]",
  warning: "bg-[--ka-warning-bg] text-[--ka-warning]",
  destructive: "bg-[--ka-danger-bg] text-[--ka-danger]",
  bot: "bg-[--ka-bot-bg] text-[--ka-bot]",
  outline: "border border-[--ka-border] bg-transparent text-[--ka-fg-2]",
};
</script>
