<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/50 z-50"
        @click="emit('close')"
      />
    </Transition>
    <Transition name="modal-pop">
      <div
        v-if="open"
        :class="[
          'modal-panel fixed top-1/2 left-1/2 z-50 w-full max-h-[90vh] overflow-auto bg-[--color-surface] rounded-[--radius-lg] shadow-xl',
          sizeClasses[size],
        ]"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-[--color-border]">
          <h3 class="text-lg font-semibold text-[--color-text]">{{ title }}</h3>
          <button
            class="text-[--color-muted] hover:text-[--color-text] p-1 rounded-[--radius-sm] transition-colors"
            @click="emit('close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    size: "md",
  },
);

const emit = defineEmits<{
  close: [];
}>();

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("close");
  }
}

onMounted(() => document.addEventListener("keydown", handleKeydown));
onUnmounted(() => document.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.modal-panel {
  transform: translate(-50%, -50%) scale(1);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}
</style>
