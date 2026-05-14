<template>
  <NuxtLayout name="auth">
    <h2>Recuperar acesso</h2>
    <div class="sub">Informe seu email e enviaremos o link de redefinição quando a conta existir.</div>

    <form @submit.prevent="handleForgot">
      <div class="row">
        <label class="field-label" for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" required />
      </div>
      <p v-if="sent" class="form-success">Se o email existir, enviaremos um link.</p>
      <button class="btn primary lg" type="submit" :disabled="sent || loading">
        <span>{{ loading ? "Enviando..." : "Enviar link" }}</span>
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
const email = ref("");
const loading = ref(false);
const sent = ref(false);

async function handleForgot() {
  loading.value = true;
  try {
    await fetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: email.value }) });
  } catch {
    // Same visible result avoids leaking account existence.
  }
  sent.value = true;
  loading.value = false;
}
</script>
