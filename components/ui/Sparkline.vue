<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.18" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradId})`" />
    <path v-if="linePath" :d="linePath" :stroke="color" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}>(), {
  color: "var(--ka-brand)",
  width: 120,
  height: 36,
});

const gradId = `spark-${Math.random().toString(36).slice(2, 7)}`;

function buildPaths(data: number[], w: number, h: number) {
  if (!data || data.length < 2) return { line: "", area: "" };
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - pad * 2));
  const ys = data.map(v => h - pad - ((v - min) / range) * (h - pad * 2));
  const pts = xs.map((x, i) => `${x},${ys[i]}`);

  // Smooth line using cubic bezier
  let line = `M ${pts[0]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1].split(",").map(Number);
    const [x1, y1] = pts[i].split(",").map(Number);
    const cx = (x0 + x1) / 2;
    line += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  const [lastX, lastY] = pts[pts.length - 1].split(",").map(Number);
  const [firstX] = pts[0].split(",").map(Number);
  const area = `${line} L ${lastX},${h} L ${firstX},${h} Z`;

  return { line, area };
}

const linePath = computed(() => buildPaths(props.data, props.width, props.height).line);
const areaPath = computed(() => buildPaths(props.data, props.width, props.height).area);
</script>
