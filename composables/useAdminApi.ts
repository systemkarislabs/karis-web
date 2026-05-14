import { z } from "zod";

// API response schemas
export const platformUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(["SUPERADMIN", "STAFF"]),
  totpEnabled: z.boolean(),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  platformUser: platformUserSchema,
});

export const requires2FAResponseSchema = z.object({
  requires2FA: z.literal(true),
});

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  aiEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  karisLinkEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });

export const overviewSchema = z.object({
  totalCompanies: z.number(),
  totalUsers: z.number(),
  totalConversations: z.number(),
  totalMessages: z.number(),
  activeWhatsApps: z.number(),
});

export type PlatformUser = z.infer<typeof platformUserSchema>;
export type Company = z.infer<typeof companySchema>;
export type Overview = z.infer<typeof overviewSchema>;

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

  /** Fetch with Zod validation. Throws if response fails validation. */
  async function fetchSafe<T>(schema: z.ZodType<T>, path: string, options: RequestInit = {}): Promise<T> {
    const data = await fetch<unknown>(path, options);
    return schema.parse(data);
  }

  return { fetch, fetchSafe, baseURL, platformUserSchema, loginResponseSchema, companySchema, overviewSchema };
}
