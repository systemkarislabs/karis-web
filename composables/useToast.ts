import { ref } from 'vue';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

function add(toast: Omit<Toast, 'id'>) {
  const id = nextId++;
  const duration = toast.duration ?? 4000;
  toasts.value.push({ ...toast, id } as Toast);

  if (duration > 0) {
    setTimeout(() => remove(id), duration);
  }

  return id;
}

function remove(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id);
}

function success(message: string, title?: string) {
  return add({ type: 'success', message, title });
}

function error(message: string, title?: string) {
  return add({ type: 'error', message, title });
}

function warning(message: string, title?: string) {
  return add({ type: 'warning', message, title });
}

function info(message: string, title?: string) {
  return add({ type: 'info', message, title });
}

export function useToast() {
  return { toasts, add, remove, success, error, warning, info };
}
