const _isDark = ref(false)

export function useTheme() {
  function init() {
    if (!import.meta.client) return
    const saved = localStorage.getItem('ka-theme')
    _isDark.value = saved === 'dark'
    apply()
  }

  function toggle() {
    _isDark.value = !_isDark.value
    if (!import.meta.client) return
    localStorage.setItem('ka-theme', _isDark.value ? 'dark' : 'light')
    apply()
  }

  function apply() {
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-theme', _isDark.value ? 'dark' : 'light')
  }

  return { isDark: readonly(_isDark), toggle, init }
}
