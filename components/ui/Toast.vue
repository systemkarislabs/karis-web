<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex min-w-[280px] items-center gap-2 rounded-[--ka-r-lg] border bg-[--ka-surface] p-3 shadow-[--ka-shadow-lg]',
          borderClasses[toast.type],
        ]"
      >
        <svg v-if="toast.type === 'success'" class="w-4 h-4 shrink-0 text-[--color-success]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else-if="toast.type === 'error'" class="w-4 h-4 shrink-0 text-[--color-destructive]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
        <svg v-else-if="toast.type === 'warning'" class="w-4 h-4 shrink-0 text-[--color-warning]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4M12 17h.01M10.29 3.86l-8.6 14.86A1 1 0 002.56 20h18.88a1 1 0 00.86-1.28l-8.6-14.86a1 1 0 00-1.72 0z" />
        </svg>
        <svg v-else class="w-4 h-4 shrink-0 text-[--color-primary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span class="text-sm text-[--ka-fg]">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "~/composables/useToast";

const { toasts } = useToast();

const borderClasses: Record<string, string> = {
  success: "border-[--ka-success]",
  error: "border-[--ka-danger]",
  warning: "border-[--ka-warning]",
  info: "border-[--ka-brand]",
};
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
