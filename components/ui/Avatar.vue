<template>
  <img
    v-if="src"
    :src="src"
    :alt="name"
    :class="['rounded-full object-cover', sizeClasses[size]]"
  />
  <div
    v-else
    :class="[
      'flex shrink-0 items-center justify-center rounded-full bg-[--ka-brand] text-white font-semibold',
      sizeClasses[size],
    ]"
  >
    {{ initials }}
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name?: string;
    src?: string;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    size: "md",
  },
);

const initials = computed(() => {
  const parts = String(props.name || "U").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "U";
});

const sizeClasses: Record<string, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};
</script>
