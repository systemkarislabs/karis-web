import { defineStore } from "pinia";

interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
  role: "SUPERADMIN" | "STAFF";
  totpEnabled: boolean;
}

export const useSuperAdminStore = defineStore("superAdmin", () => {
  const token = ref<string | null>(null);
  const platformUser = ref<PlatformUser | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const isSuperAdmin = computed(() => platformUser.value?.role === "SUPERADMIN");

  function setSession(data: { token: string; platformUser: PlatformUser }) {
    token.value = data.token;
    platformUser.value = data.platformUser;
    if (import.meta.client) localStorage.setItem("super_admin_token", data.token);
  }

  function loadFromStorage() {
    if (!import.meta.client) return;
    const stored = localStorage.getItem("super_admin_token");
    if (stored) token.value = stored;
  }

  function clear() {
    token.value = null;
    platformUser.value = null;
    if (import.meta.client) {
      localStorage.removeItem("super_admin_token");
      localStorage.removeItem("karis_impersonation_token");
    }
  }

  async function fetchMe() {
    if (!token.value) return;
    const api = useAdminApi();
    try {
      const data = await api.fetch<{ platformUser: PlatformUser }>("/auth/me");
      platformUser.value = data.platformUser;
    } catch {
      clear();
    }
  }

  async function logout() {
    const api = useAdminApi();
    try { await api.fetch("/auth/logout", { method: "POST" }); } catch {}
    clear();
    navigateTo("/login");
  }

  loadFromStorage();

  return { token, platformUser, isAuthenticated, isSuperAdmin, setSession, loadFromStorage, clear, fetchMe, logout };
});
