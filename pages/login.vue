<template>
  <div class="login-shell">
    <div class="login-left">
      <div class="login-logo-bar">
        <img src="/karis-atende-wordmark-blue.png" alt="Karis Atende" class="login-wordmark" />
      </div>

      <div class="login-form-panel">
        <template v-if="step === 'credentials'">
          <h1 class="login-title">Entrar na sua conta</h1>
          <p class="login-sub">Bem-vindo de volta. Continue de onde parou.</p>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                v-model="email"
                class="form-input"
                type="email"
                autocomplete="email"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Senha</label>
              <input
                id="password"
                v-model="password"
                class="form-input"
                type="password"
                autocomplete="current-password"
                required
              />
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input v-model="remember" type="checkbox" />
                <span>Lembrar de mim</span>
              </label>
              <NuxtLink to="/forgot-password" class="form-link">Esqueci a senha</NuxtLink>
            </div>

            <p v-if="error" class="form-alert" role="alert">{{ error }}</p>

            <button class="btn-login" type="submit" :disabled="loading">
              <span>{{ loading ? "Identificando..." : "Entrar" }}</span>
              <Icon v-if="!loading" name="arrowRight" :size="16" />
              <Icon v-else name="loader" :size="16" className="spin" />
            </button>
          </form>

          <p class="login-terms">
            Ao entrar, você aceita nossos
            <a href="#">termos de uso</a>
            e
            <a href="#">política de privacidade</a>.
          </p>
        </template>

        <template v-else-if="step === '2fa'">
          <h1 class="login-title">Verificação em duas etapas</h1>
          <p class="login-sub">
            {{ authType === 'admin' ? 'Acesso Super Admin — ' : '' }}Digite o código do seu aplicativo autenticador.
          </p>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label" for="totp">Código 2FA</label>
              <input
                id="totp"
                v-model="totpCode"
                class="form-input"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                autocomplete="one-time-code"
                required
              />
            </div>

            <p v-if="error" class="form-alert" role="alert">{{ error }}</p>

            <button class="btn-login" type="submit" :disabled="loading">
              <span>{{ loading ? "Verificando..." : "Verificar" }}</span>
              <Icon v-if="!loading" name="shield" :size="16" />
              <Icon v-else name="loader" :size="16" className="spin" />
            </button>

            <button
              type="button"
              class="btn-login-ghost"
              @click="resetToCredentials"
            >
              Voltar
            </button>
          </form>
        </template>
      </div>
    </div>

    <div class="login-right" aria-hidden="true">
      <div class="login-right-content">
        <div class="login-right-badge">
          <Icon name="zap" :size="16" />
          <span>Atendimento inteligente com IA</span>
        </div>
        <h2 class="login-right-title">Transforme seu atendimento com automação e inteligência artificial</h2>
        <p class="login-right-desc">
          Conecte seu WhatsApp, configure seu agente IA e acompanhe tudo em um só lugar.
        </p>
        <div class="login-right-stats">
          <div class="login-stat">
            <div class="login-stat-value">98%</div>
            <div class="login-stat-label">Satisfação dos clientes</div>
          </div>
          <div class="login-stat">
            <div class="login-stat-value">3x</div>
            <div class="login-stat-label">Mais rápido que atendimento manual</div>
          </div>
          <div class="login-stat">
            <div class="login-stat-value">24/7</div>
            <div class="login-stat-label">Disponibilidade do agente IA</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: undefined });

const route = useRoute();
const { fetch: apiFetch } = useApi();
const adminApi = useAdminApi();
const auth = useAuthStore();
const superAdmin = useSuperAdminStore();

const email = ref("");
const password = ref("");
const remember = ref(true);
const totpCode = ref("");

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
        await loginTenant(true, remember.value);
      } else {
        await loginAdmin(true);
      }
    } else {
      const tenantOk = await loginTenant(false, remember.value);
      if (!tenantOk) {
        await loginAdmin(false);
      }
    }
  } finally {
    loading.value = false;
  }
}

async function loginTenant(with2FA: boolean, remember = true): Promise<boolean> {
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
      auth.setAuth(data as { token: string; user: any; company: any }, remember);
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard";
      await navigateTo(redirect.startsWith("/super-admin") ? "/dashboard" : redirect);
      return true;
    }

    return false;
  } catch (e: any) {
    if (with2FA) {
      error.value = e?.data?.message || "Código inválido. Tente novamente.";
      return false;
    }
    return false;
  }
}

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

<style scoped>
.login-shell {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  /* força tema claro independente da preferência do usuário */
  color-scheme: light;
}

@media (max-width: 900px) {
  .login-shell {
    grid-template-columns: 1fr;
  }
  .login-right {
    display: none;
  }
}

.login-left {
  display: flex;
  flex-direction: column;
  padding: 40px 48px;
  background: #ffffff;
  color: #1a1a2e;
  /* garante que nada do tema escuro vaze */
  --ka-fg: #0f172a;
  --ka-fg-2: #475569;
  --ka-fg-muted: #94a3b8;
  --ka-surface: #ffffff;
  --ka-border: #e2e8f0;
  --ka-brand-alpha: rgba(45, 91, 255, 0.12);
  --ka-danger: #dc2626;
  --ka-danger-alpha: rgba(220, 38, 38, 0.08);
  --ka-gray-50: #f8fafc;
  --ka-r-md: 10px;
}

.login-logo-bar {
  margin-bottom: 40px;
}

.login-wordmark {
  height: 32px;
  width: auto;
}

.login-form-panel {
  max-width: 400px;
  width: 100%;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 0 0 8px;
}

.login-sub {
  font-size: 15px;
  color: var(--ka-fg-2);
  margin: 0 0 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-fg-2);
}

.form-input {
  height: 44px;
  padding: 0 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  font-size: 15px;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  border-color: #2d5bff;
  box-shadow: 0 0 0 3px rgba(45, 91, 255, 0.12);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ka-fg-2);
  cursor: pointer;
}

.form-link {
  color: var(--ka-brand);
  text-decoration: none;
  font-weight: 500;
}

.form-link:hover {
  text-decoration: underline;
}

.form-alert {
  padding: 12px 14px;
  border: 1px solid var(--ka-danger);
  border-radius: var(--ka-r-md);
  background: var(--ka-danger-alpha);
  color: var(--ka-danger);
  font-size: 13px;
  margin: 0;
}

.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: var(--ka-r-md);
  background: var(--ka-brand);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-login:hover:not(:disabled) {
  background: var(--ka-brand-dark);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-login-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 24px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: transparent;
  color: var(--ka-fg-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.btn-login-ghost:hover {
  background: var(--ka-gray-50);
  color: var(--ka-fg);
}

.login-terms {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 24px;
}

.login-terms a {
  color: var(--ka-brand);
  text-decoration: none;
}

.login-terms a:hover {
  text-decoration: underline;
}

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: linear-gradient(135deg, var(--ka-brand) 0%, var(--ka-brand-dark) 100%);
  color: white;
}

.login-right-content {
  max-width: 480px;
}

.login-right-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
}

.login-right-title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 16px;
}

.login-right-desc {
  font-size: 16px;
  line-height: 1.5;
  opacity: 0.85;
  margin: 0 0 40px;
}

.login-right-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.login-stat-value {
  font-size: 28px;
  font-weight: 700;
}

.login-stat-label {
  font-size: 13px;
  opacity: 0.75;
  margin-top: 4px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
