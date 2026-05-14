export function useApi() {
  const config = useRuntimeConfig();
  const baseURL = (config.public.apiBaseUrl as string).replace(/\/+$/, "");
  const auth = useAuthStore();

  async function fetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    const impersonationToken = import.meta.client ? localStorage.getItem("karis_impersonation_token") : null;
    const activeToken = impersonationToken || auth.token;
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }
    const res = await $fetch<T>(`${baseURL}/api${path}`, {
      ...options,
      headers,
    });
    return res;
  }

  return { fetch, baseURL };
}
