<template>
  <NuxtLayout name="auth">
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
        <span>{{ loading ? "Entrando..." : "Entrar" }}</span>
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
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowRight, LoaderCircle } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: undefined });

const { fetch } = useApi();
const auth = useAuthStore();
const email = ref("");
const password = ref("");
const remember = ref(true);
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    const data = await fetch<{ token: string; user: any; company: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    auth.setAuth(data);
    await navigateTo("/dashboard");
  } catch (e: any) {
    error.value = e?.data?.message || "Não conseguimos entrar. Confere os dados e tenta de novo.";
  } finally {
    loading.value = false;
  }
}
</script>
