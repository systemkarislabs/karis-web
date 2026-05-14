import { ref } from "vue";

interface Toast {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

let nextId = 0;
const toasts = ref<Toast[]>([]);

export function useToast() {
  function add(type: Toast["type"], message: string) {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, type, message }];

    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 4000);
  }

  return {
    toasts,
    success: (message: string) => add("success", message),
    error: (message: string) => add("error", message),
    warning: (message: string) => add("warning", message),
    info: (message: string) => add("info", message),
  };
}
