<template>
  <NuxtLayout name="auth">
    <!-- Step: credentials -->
    <template v-if="step === 'credentials'">
      <h2>Entrar na sua conta</h2>
      <div class="sub">Bem-vindo de volta. Continue de onde parou.</div>

      <form @submit.prevent="handleLogin">
        <div class="row">
          <label class="field-label" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            class="input"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div class="row">
          <label class="field-label" for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            class="input"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>

        <div class="options">
          <label>
            <input v-model="remember" type="checkbox" />
            Lembrar de mim
          </label>
          <NuxtLink to="/forgot-password">Esqueci a senha</NuxtLink>
        </div>

        <p v-if="error" class="form-alert" role="alert">{{ error }}</p>

        <button class="btn primary lg" type="submit" :disabled="loading">
          <span>{{ loading ? "Identificando..." : "Entrar" }}</span>
          <ArrowRight v-if="!loading" :size="16" />
          <LoaderCircle v-else class="spin" :size="16" />
        </button>
      </form>

      <p class="terms">
        Ao entrar, você aceita nossos
        <a href="#">termos de uso</a>
        e
        <a href="#">política de privacidade</a>.
      </p>
    </template>

    <!-- Step: 2FA -->
    <template v-else-if="step === '2fa'">
      <h2>Verificação em duas etapas</h2>
      <div class="sub">
        {{ authType === 'admin' ? 'Acesso Super Admin — d' : 'D' }}igite o código do seu aplicativo autenticador.
      </div>

      <form @submit.prevent="handleLogin">
        <div class="row">
          <label class="field-label" for="totp">Código 2FA</label>
          <input
            id="totp"
            v-model="totpCode"
            class="input"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            autocomplete="one-time-code"
            required
          />
        </div>

        <p v-if="error" class="form-alert" role="alert">{{ error }}</p>

        <button class="btn primary lg" type="submit" :disabled="loading">
          <span>{{ loading ? "Verificando..." : "Verificar" }}</span>
          <ShieldCheck v-if="!loading" :size="16" />
          <LoaderCircle v-else class="spin" :size="16" />
        </button>

        <button
          type="button"
          class="btn ghost lg"
          style="margin-top: 0.5rem; width: 100%"
          @click="resetToCredentials"
        >
          Voltar
        </button>
      </form>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: undefined });

const route = useRoute();
const { fetch: apiFetch } = useApi();
const adminApi = useAdminApi();
const auth = useAuthStore();
const superAdmin = useSuperAdminStore();

// Form state
const email = ref("");
const password = ref("");
const remember = ref(true);
const totpCode = ref("");

// UI state
const loading = ref(false);
const error = ref("");
const step = ref<"credentials" | "2fa">("credentials");
const authType = ref<"tenant" | "admin" | null>(null);

function resetToCredentials() {
  step.value = "credentials";
  authType.value = null;
  totpCode.value = "";
  error.value = "";
}

async function handleLogin() {
  error.value = "";
  loading.value = true;

  try {
    if (step.value === "2fa") {
      if (authType.value === "tenant") {
        await loginTenant(true);
      } else {
        await loginAdmin(true);
      }
    } else {
      // Try tenant first, then admin on failure
      const tenantOk = await loginTenant(false);
      if (!tenantOk) {
        await loginAdmin(false);
      }
    }
  } finally {
    loading.value = false;
  }
}

/** Attempt tenant login. Returns true if login succeeded or 2FA step was entered. */
async function loginTenant(with2FA: boolean): Promise<boolean> {
  try {
    const body: Record<string, string> = {
      email: email.value,
      password: password.value,
    };
    if (with2FA && totpCode.value) body.totpCode = totpCode.value;

    const data = await apiFetch<{
      token?: string;
      user?: any;
      company?: any;
      requires2FA?: boolean;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (data.requires2FA) {
      step.value = "2fa";
      authType.value = "tenant";
      return true;
    }

    if (data.token && data.user) {
      auth.setAuth(data as { token: string; user: any; company: any });
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard";
      await navigateTo(redirect.startsWith("/super-admin") ? "/dashboard" : redirect);
      return true;
    }

    return false;
  } catch (e: any) {
    // If we're in 2FA mode for tenant, show the error directly
    if (with2FA) {
      error.value = e?.data?.message || "Código inválido. Tente novamente.";
      return false;
    }
    // Otherwise, let caller try admin
    return false;
  }
}

/** Attempt admin (Super Admin) login. Shows final error if this also fails. */
async function loginAdmin(with2FA: boolean): Promise<boolean> {
  try {
    const body: Record<string, string> = {
      email: email.value,
      password: password.value,
    };
    if (with2FA && totpCode.value) body.totpCode = totpCode.value;

    const data = await adminApi.fetch<{
      token?: string;
      platformUser?: any;
      requires2FA?: boolean;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (data.requires2FA) {
      step.value = "2fa";
      authType.value = "admin";
      return true;
    }

    if (data.token && data.platformUser) {
      superAdmin.setSession(data as { token: string; platformUser: any });
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/super-admin";
      await navigateTo(redirect);
      return true;
    }

    return false;
  } catch (e: any) {
    const msg = e?.data?.message || null;
    error.value = with2FA
      ? msg || "Código inválido. Tente novamente."
      : msg || "Email ou senha incorretos. Confere os dados e tenta de novo.";
    return false;
  }
}
</script>
