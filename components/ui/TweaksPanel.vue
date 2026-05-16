<template>
  <div v-if="open" class="tweaks-panel">
    <div class="tweaks-header">
      <span class="tweaks-title">🎨 Live Tweaks</span>
      <button class="tweaks-close" @click="open = false">
        <Icon name="x" :size="16" />
      </button>
    </div>
    <div class="tweaks-body">
      <div class="tweak-group">
        <label class="tweak-label">Brand Color</label>
        <input type="color" :value="tweaks.brand" @input="setTweak('brand', $event.target.value)" class="tweak-color" />
        <code class="tweak-value">{{ tweaks.brand }}</code>
      </div>
      <div class="tweak-group">
        <label class="tweak-label">Sidebar Width</label>
        <input type="range" min="200" max="320" :value="tweaks.sidebarWidth" @input="setTweak('sidebarWidth', $event.target.value)" class="tweak-range" />
        <code class="tweak-value">{{ tweaks.sidebarWidth }}px</code>
      </div>
      <div class="tweak-group">
        <label class="tweak-label">Border Radius</label>
        <input type="range" min="0" max="24" :value="parseInt(tweaks.radius)" @input="setTweak('radius', $event.target.value + 'px')" class="tweak-range" />
        <code class="tweak-value">{{ tweaks.radius }}</code>
      </div>
      <div class="tweak-group">
        <label class="tweak-label">Font Size Base</label>
        <input type="range" min="12" max="18" :value="parseInt(tweaks.fontSize)" @input="setTweak('fontSize', $event.target.value + 'px')" class="tweak-range" />
        <code class="tweak-value">{{ tweaks.fontSize }}</code>
      </div>
      <div class="tweak-group">
        <label class="tweak-label">Spacing Scale</label>
        <input type="range" min="4" max="8" step="0.5" :value="tweaks.spacing" @input="setTweak('spacing', $event.target.value)" class="tweak-range" />
        <code class="tweak-value">{{ tweaks.spacing }}px</code>
      </div>
      <div class="tweak-group">
        <label class="tweak-label">Sidebar Shadow</label>
        <input type="range" min="0" max="20" :value="tweaks.shadow" @input="setTweak('shadow', $event.target.value)" class="tweak-range" />
        <code class="tweak-value">{{ tweaks.shadow }}</code>
      </div>
      <div class="tweak-group">
        <label class="tweak-label">Topbar Height</label>
        <input type="range" min="48" max="80" :value="tweaks.topbarHeight" @input="setTweak('topbarHeight', $event.target.value)" class="tweak-range" />
        <code class="tweak-value">{{ tweaks.topbarHeight }}px</code>
      </div>
      <div class="tweak-group">
        <label class="tweak-label">Hover Brightness</label>
        <input type="range" min="0.8" max="1.2" step="0.05" :value="tweaks.hoverBrightness" @input="setTweak('hoverBrightness', $event.target.value)" class="tweak-range" />
        <code class="tweak-value">{{ tweaks.hoverBrightness }}</code>
      </div>
      <button class="tweaks-reset" @click="resetTweaks">Reset to Defaults</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTweaks, applyTweaks } from '@/composables/useTweaks';

const { tweaks, open, setTweak, resetTweaks } = useTweaks();

watch(tweaks, () => {
  applyTweaks(tweaks.value);
}, { deep: true });

onMounted(() => {
  applyTweaks(tweaks.value);
});
</script>

<style scoped>
.tweaks-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--ka-surface);
  border-left: 1px solid var(--ka-border);
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.tweaks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--ka-border);
}

.tweaks-title {
  font-weight: 700;
  font-size: 14px;
}

.tweaks-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--ka-fg-2);
  cursor: pointer;
  border-radius: var(--ka-r-sm);
}

.tweaks-close:hover {
  background: var(--ka-gray-100);
  color: var(--ka-fg);
}

.tweaks-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tweak-group {
  margin-bottom: 20px;
}

.tweak-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--ka-fg-2);
  margin-bottom: 8px;
}

.tweak-color {
  width: 100%;
  height: 36px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  cursor: pointer;
  background: transparent;
}

.tweak-range {
  width: 100%;
  margin-bottom: 4px;
}

.tweak-value {
  display: block;
  font-size: 11px;
  color: var(--ka-fg-3);
  font-family: ui-monospace, monospace;
}

.tweaks-reset {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: transparent;
  color: var(--ka-fg-2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.tweaks-reset:hover {
  background: var(--ka-gray-100);
  color: var(--ka-fg);
}
</style>
