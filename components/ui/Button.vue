<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[--ka-r-md] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
      variantClasses[variant],
      sizeClasses[size],
    ]"
  >
    <Loader2 v-if="loading" :class="['animate-spin', iconSizeClasses[size]]" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";

withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    type: "button",
  },
);

const variantClasses: Record<string, string> = {
  primary: "bg-[--ka-brand] text-white shadow-[--ka-shadow-brand] hover:bg-[--ka-brand-dark]",
  secondary: "border border-[--ka-border] bg-[--ka-surface] text-[--ka-fg] hover:bg-[--ka-gray-50]",
  ghost: "text-[--ka-fg-2] hover:bg-[--ka-gray-100] hover:text-[--ka-fg]",
  destructive: "bg-[--ka-danger] text-white hover:brightness-95",
  outline: "border border-[--ka-border] bg-transparent text-[--ka-fg] hover:bg-[--ka-gray-50]",
};

const sizeClasses: Record<string, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
  icon: "h-10 w-10 p-0",
};

const iconSizeClasses: Record<string, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  icon: "h-4 w-4",
};
</script>
