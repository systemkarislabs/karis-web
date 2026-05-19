import { defineStore } from "pinia";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  companyId: string;
}

interface Company {
  id: string;
  name: string;
}

interface Impersonation {
  active: boolean;
  by?: string | null;
  platformUserId?: string | null;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const company = ref<Company | null>(null);
  const token = ref<string | null>(null);
  const impersonation = ref<Impersonation | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "ADMIN");

  function setAuth(data: { user: User; company: Company; token: string }, remember = true) {
    user.value = data.user;
    company.value = data.company;
    token.value = data.token;
    if (import.meta.client) {
      if (remember) {
        localStorage.setItem("auth_token", data.token);
        sessionStorage.removeItem("auth_token");
      } else {
        sessionStorage.setItem("auth_token", data.token);
        localStorage.removeItem("auth_token");
      }
    }
  }

  function loadFromStorage() {
    if (!import.meta.client) return;
    const stored = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
    if (stored) {
      token.value = stored;
      fetchMe();
    }
  }

  function clear() {
    user.value = null;
    company.value = null;
    token.value = null;
    impersonation.value = null;
    if (import.meta.client) {
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");
    }
  }

  async function fetchMe() {
    const api = useApi();
    try {
      const data = await api.fetch<{ user: User; company?: Company | null; impersonation?: Impersonation | null }>("/auth/me");
      user.value = data.user;
      if (data.company) company.value = data.company;
      impersonation.value = data.impersonation || null;
    } catch (err: any) {
      // Só invalida a sessão em 401 explícito — erros de rede ou 5xx (ex: restart do servidor)
      // não devem deslogar o usuário nem apagar o token
      const status = err?.response?.status ?? err?.status ?? err?.statusCode;
      if (status === 401) {
        clear();
      }
    }
  }

  loadFromStorage();

  return { user, company, token, impersonation, isAuthenticated, isAdmin, setAuth, clear, fetchMe };
});
