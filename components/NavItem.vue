<template>
  <NuxtLink
    :to="to"
    class="nav-item"
    active-class="nav-item-active"
  >
    <Icon :name="icon" :size="18" class="nav-icon" />
    <span class="nav-label">{{ label }}</span>
    <span v-if="badge" class="nav-badge">{{ badge > 99 ? '99+' : badge }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string; icon: string; label: string; badge?: number }>();
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: var(--ka-r-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg-2);
  text-decoration: none;
  transition: background-color 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--ka-gray-50);
  color: var(--ka-fg);
}

.nav-item-active {
  background: var(--ka-brand-alpha);
  color: var(--ka-brand-dark);
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--ka-danger);
  color: white;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
</style>
