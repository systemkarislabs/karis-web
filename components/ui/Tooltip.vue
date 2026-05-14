<template>
  <div class="relative group inline-block">
    <slot />
    <div
      :class="[
        'absolute z-50 px-2 py-1 text-xs rounded-[--radius-sm] bg-[--color-text] text-[--color-bg] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none',
        positionClasses[position],
      ]"
    >
      {{ text }}
      <div
        :class="[
          'absolute w-2 h-2 bg-[--color-text] rotate-45',
          arrowClasses[position],
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text: string;
    position?: "top" | "bottom" | "left" | "right";
  }>(),
  {
    position: "top",
  },
);

const positionClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
  left: "right-full top-1/2 -translate-y-1/2 mr-1",
  right: "left-full top-1/2 -translate-y-1/2 ml-1",
};

const arrowClasses: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-1",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
  left: "left-full top-1/2 -translate-y-1/2 -ml-1",
  right: "right-full top-1/2 -translate-y-1/2 -mr-1",
};
</script>
