export function useTheme() {
  const theme = ref<"light" | "dark">("light");

  function init() {
    if (!import.meta.client) return;
    theme.value = "light";
    localStorage.setItem("theme", "light");
    apply();
  }

  function toggle() {
    theme.value = theme.value === "light" ? "dark" : "light";
    if (!import.meta.client) return;
    localStorage.setItem("theme", theme.value);
    apply();
  }

  function apply() {
    if (!import.meta.client) return;
    document.documentElement.setAttribute("data-theme", theme.value);
  }

  return { theme, init, toggle };
}
