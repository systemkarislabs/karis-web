import { ref, reactive } from 'vue';

export interface Tweaks {
  brand: string;
  sidebarWidth: number;
  radius: string;
  fontSize: string;
  spacing: number;
  shadow: number;
  topbarHeight: number;
  hoverBrightness: number;
}

const DEFAULTS: Tweaks = {
  brand: '#00A884',
  sidebarWidth: 260,
  radius: '10px',
  fontSize: '14px',
  spacing: 6,
  shadow: 8,
  topbarHeight: 64,
  hoverBrightness: 1.05,
};

const tweaks = reactive<Tweaks>({ ...DEFAULTS });
const open = ref(false);

function setTweak<K extends keyof Tweaks>(key: K, value: Tweaks[K]) {
  tweaks[key] = value;
}

function resetTweaks() {
  Object.assign(tweaks, { ...DEFAULTS });
}

function applyTweaks(t: Tweaks) {
  const root = document.documentElement;
  root.style.setProperty('--ka-brand', t.brand);
  root.style.setProperty('--ka-brand-dark', adjustBrightness(t.brand, -15));
  root.style.setProperty('--ka-sidebar-width', `${t.sidebarWidth}px`);
  root.style.setProperty('--ka-r-md', t.radius);
  root.style.setProperty('--ka-r-sm', `calc(${t.radius} - 2px)`);
  root.style.setProperty('--ka-r-lg', `calc(${t.radius} + 2px)`);
  root.style.setProperty('font-size', t.fontSize);
  root.style.setProperty('--ka-spacing', `${t.spacing}px`);
  root.style.setProperty('--ka-topbar-height', `${t.topbarHeight}px`);
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export function useTweaks() {
  return { tweaks, open, setTweak, resetTweaks, applyTweaks };
}
