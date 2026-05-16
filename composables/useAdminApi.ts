export function useAdminApi() {
  const config = useRuntimeConfig();
  const baseURL = (config.public.apiBaseUrl as string).replace(/\/+$/, "");
  const superAdmin = useSuperAdminStore();

  async function fetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (superAdmin.token) {
      headers.Authorization = `Bearer ${superAdmin.token}`;
    }

    return await $fetch<T>(`${baseURL}/api/admin${path}`, {
      ...options,
      headers,
    });
  }

  return { fetch, baseURL };
}
