<template>
  <NuxtLayout name="default">
    <div class="ka-page" style="max-width:960px">
      <div class="page-header">
        <div>
          <p class="page-header-eyebrow">Operação</p>
          <h1>Automações</h1>
          <p class="page-header-description">Regras e fluxos que operam em segundo plano.</p>
        </div>
      </div>

      <div class="dashboard-panel" style="padding:64px 32px;text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--ka-gray-100);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <Zap class="h-7 w-7" style="color:var(--ka-fg-muted)" />
        </div>
        <h2 style="font-size:18px;font-weight:700;color:var(--ka-fg);margin-bottom:8px">Em breve</h2>
        <p style="font-size:14px;color:var(--ka-fg-muted);max-width:420px;margin:0 auto 24px">
          O módulo de automações está em desenvolvimento. Em breve você poderá criar fluxos automáticos para disparos de mensagem, mudança de estágio no CRM e muito mais.
        </p>
        <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;background:var(--ka-gray-100);color:var(--ka-fg-muted);font-size:13px;font-weight:500">
          <Clock class="h-4 w-4" />
          Em desenvolvimento
        </span>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Clock, Zap } from "lucide-vue-next";
definePageMeta({ middleware: "auth" });
</script>
