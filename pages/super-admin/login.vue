<template>
  <main class="super-admin-login">
    <section class="super-admin-login-card">
      <img src="/karis-atende-wordmark-blue.png" alt="Karis Atende" />
      <p class="eyebrow">Super Admin</p>
      <h1>Entrar no controle da plataforma</h1>
      <p class="muted">Acesso exclusivo para administrar empresas, permissoes e relatorios globais.</p>

      <form @submit.prevent="handleSubmit">
        <label v-if="!requires2FA">
          E-mail
          <input v-model="email" type="email" autocomplete="email" required :disabled="loading" />
        </label>
        <label v-if="!requires2FA">
          Senha
          <input v-model="password" type="password" autocomplete="current-password" required :disabled="loading" />
        </label>
        <label v-if="requires2FA">
          Codigo 2FA
          <input v-model="totpCode" type="text" inputmode="numeric" maxlength="6" placeholder="000000" required :disabled="loading" />
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-action" type="submit" :disabled="loading">
          {{ loading ? "Entrando..." : (requires2FA ? "Verificar 2FA" : "Entrar") }}
        </button>
        <button v-if="requires2FA" type="button" class="secondary-action" @click="requires2FA = false; totpCode = ''">
          Voltar
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const superAdmin = useSuperAdminStore();
const api = useAdminApi();
const email = ref("");
const password = ref("");
const totpCode = ref("");
const loading = ref(false);
const error = ref("");
const requires2FA = ref(false);

async function handleSubmit() {
  loading.value = true;
  error.value = "";
  try {
    const body: any = { email: email.value, password: password.value };
    if (requires2FA.value && totpCode.value) body.totpCode = totpCode.value;

    const data = await api.fetch<{ token?: string; platformUser?: PlatformUser; requires2FA?: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (data.requires2FA) {
      requires2FA.value = true;
      loading.value = false;
      return;
    }

    if (data.token && data.platformUser) {
      superAdmin.setSession(data as { token: string; platformUser: PlatformUser });
      await navigateTo(typeof route.query.redirect === "string" ? route.query.redirect : "/super-admin");
    }
  } catch (err: any) {
    error.value = err?.data?.message || "Nao foi possivel entrar.";
  } finally {
    loading.value = false;
  }
}
</script>
