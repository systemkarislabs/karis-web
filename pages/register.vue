<template>
  <NuxtLayout name="auth">
    <h2>Crie sua conta</h2>
    <div class="sub">Vamos preparar sua operação de atendimento com IA e WhatsApp.</div>

    <form @submit.prevent="handleRegister">
      <div class="row">
        <label class="field-label" for="companyName">Nome da empresa</label>
        <input id="companyName" v-model="companyName" class="input" autocomplete="organization" required />
      </div>
      <div class="row">
        <label class="field-label" for="name">Seu nome</label>
        <input id="name" v-model="name" class="input" autocomplete="name" required />
      </div>
      <div class="row">
        <label class="field-label" for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" required />
      </div>
      <div class="row">
        <label class="field-label" for="password">Senha</label>
        <input id="password" v-model="password" class="input" type="password" autocomplete="new-password" required />
      </div>
      <p v-if="error" class="form-alert" role="alert">{{ error }}</p>
      <button class="btn primary lg" type="submit" :disabled="loading">
        <span>{{ loading ? "Criando..." : "Criar conta" }}</span>
        <ArrowRight v-if="!loading" :size="16" />
        <LoaderCircle v-else class="spin" :size="16" />
      </button>
    </form>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowRight, LoaderCircle } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: undefined });
const { fetch } = useApi();
const authStore = useAuthStore();
const companyName = ref("");
const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleRegister() {
  error.value = "";
  loading.value = true;
  try {
    const data = await fetch<{ token: string; user: any; company: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ companyName: companyName.value, name: name.value, email: email.value, password: password.value }),
    });
    authStore.setAuth(data);
    await navigateTo("/dashboard");
  } catch (e: any) {
    error.value = e?.data?.message || "Não conseguimos criar a conta. Tenta de novo?";
  } finally {
    loading.value = false;
  }
}
</script>
