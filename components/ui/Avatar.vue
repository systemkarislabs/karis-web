<template>
  <img
    v-if="src"
    :src="src"
    :alt="name"
    :class="['rounded-full object-cover shrink-0', sizeClasses[size]]"
  />
  <div
    v-else
    :class="['flex shrink-0 items-center justify-center rounded-full font-semibold select-none', sizeClasses[size]]"
    :style="colorStyle"
  >
    {{ initials }}
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name?: string;
    src?: string;
    size?: "xs" | "sm" | "md" | "lg";
  }>(),
  { size: "md" }
);

// Paleta de cores: bg / text — escolhida pelo hash do nome para ser sempre consistente
const PALETTE = [
  { bg: "#3B82F6", text: "#fff" }, // blue
  { bg: "#8B5CF6", text: "#fff" }, // violet
  { bg: "#10B981", text: "#fff" }, // emerald
  { bg: "#F59E0B", text: "#fff" }, // amber
  { bg: "#EF4444", text: "#fff" }, // red
  { bg: "#EC4899", text: "#fff" }, // pink
  { bg: "#14B8A6", text: "#fff" }, // teal
  { bg: "#F97316", text: "#fff" }, // orange
  { bg: "#6366F1", text: "#fff" }, // indigo
  { bg: "#84CC16", text: "#fff" }, // lime
];

function hashIndex(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

const initials = computed(() => {
  const raw = String(props.name || "?").trim();
  // Phone number — use first non-symbol chars
  if (/^[+\d\s()-]+$/.test(raw)) {
    const digits = raw.replace(/\D/g, "");
    return digits.slice(-2, -1) || "?";
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "?";
});

const colorStyle = computed(() => {
  const key = String(props.name || "?").trim().toLowerCase();
  const c = PALETTE[hashIndex(key)];
  return { background: c.bg, color: c.text };
});

const sizeClasses: Record<string, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};
</script>
