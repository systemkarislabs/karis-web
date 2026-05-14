<template>
  <div class="login-page">
    <section class="login-brand" aria-label="Karis Atende">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />

      <div class="brand-lockup notranslate" translate="no">
        <img class="brand-lockup-wordmark" src="/karis-atende-wordmark-white.png" alt="Karis Atende" />
      </div>

      <div class="hero">
        <h1>
          Conecta.<br />
          Atende.<br />
          <span class="accent">Resolve.</span>
        </h1>
        <p>
          A plataforma de atendimento com IA que sua equipe vai querer abrir todo dia.
          Conversas no WhatsApp, CRM visual e automações em uma interface só.
        </p>
      </div>

      <div class="trust">
        <div class="item"><LockKeyhole :size="14" />Conexão segura</div>
        <div class="item"><ShieldCheck :size="14" />Dados protegidos</div>
        <div class="item"><CircleCheck :size="14" />LGPD</div>
      </div>
    </section>

    <main class="login-form-wrap">
      <div class="top-actions">
        <span>{{ actionCopy.text }}</span>
        <NuxtLink :to="actionCopy.to">{{ actionCopy.label }}</NuxtLink>
      </div>

      <section class="login-form" aria-live="polite">
        <div class="mobile-brand notranslate" translate="no">
          <img src="/karis-atende-wordmark-blue.png" alt="Karis Atende" />
        </div>
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { CircleCheck, LockKeyhole, ShieldCheck } from "lucide-vue-next";

const route = useRoute();

const actionCopy = computed(() => {
  if (route.path === "/register") {
    return { text: "Já tem conta?", label: "Entrar", to: "/login" };
  }

  if (route.path === "/forgot-password") {
    return { text: "Lembrou a senha?", label: "Entrar", to: "/login" };
  }

  return { text: "Ainda não tem conta?", label: "Criar conta", to: "/register" };
});
</script>
