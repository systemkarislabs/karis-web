<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
        >
          <div class="toast-icon">
            <Icon v-if="toast.type === 'success'" name="check" :size="16" color="var(--ka-success)" />
            <Icon v-else-if="toast.type === 'error'" name="alert" :size="16" color="var(--ka-danger)" />
            <Icon v-else-if="toast.type === 'warning'" name="alert" :size="16" color="var(--ka-warning)" />
            <Icon v-else name="info" :size="16" color="var(--ka-fg-2)" />
          </div>
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click="remove(toast.id)">
            <Icon name="x" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, remove } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 380px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--ka-surface);
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.toast-success {
  border-left: 3px solid var(--ka-success);
}

.toast-error {
  border-left: 3px solid var(--ka-danger);
}

.toast-warning {
  border-left: 3px solid var(--ka-warning);
}

.toast-info {
  border-left: 3px solid var(--ka-fg-3);
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-fg);
  margin-bottom: 2px;
}

.toast-message {
  font-size: 12px;
  color: var(--ka-fg-2);
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--ka-fg-3);
  cursor: pointer;
  border-radius: var(--ka-r-sm);
}

.toast-close:hover {
  background: var(--ka-gray-100);
  color: var(--ka-fg);
}

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
