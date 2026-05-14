<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/50 z-50"
        @click="emit('close')"
      />
    </Transition>
    <Transition name="sheet-slide">
      <div
        v-if="open"
        class="fixed top-0 right-0 h-full w-full max-w-md bg-[--color-surface] shadow-xl z-50 overflow-auto"
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

defineProps<{
  open: boolean;
  title: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("close");
  }
}

onMounted(() => document.addEventListener("keydown", handleKeydown));
onUnmounted(() => document.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.3s ease-out;
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateX(100%);
}
</style>
