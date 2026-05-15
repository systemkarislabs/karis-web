<template>
  <NuxtLayout name="default">
    <section class="ka-page space-y-6">
      <PageHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Ajuste empresa, faturamento e canais da sua conta."
      />

      <div class="grid gap-4 md:grid-cols-3">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="ka-card group flex min-h-36 flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-[--ka-shadow-md]"
        >
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-[--ka-radius-sm] bg-[--ka-primary-soft] text-[--ka-primary]">
              <component :is="link.icon" class="h-5 w-5" />
            </span>
            <ChevronRight class="h-5 w-5 text-[--ka-fg-muted] transition group-hover:translate-x-0.5 group-hover:text-[--ka-primary]" />
          </div>
          <div>
            <h2 class="font-display text-lg font-semibold text-[--ka-fg]">{{ link.label }}</h2>
            <p class="mt-1 text-sm leading-6 text-[--ka-fg-muted]">{{ link.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Building2, ChevronRight, MessageCircle } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const links = [
  { to: "/settings/business", label: "Empresa", description: "Nome, recursos habilitados e limites do plano.", icon: Building2 },
  { to: "/whatsapp", label: "WhatsApp", description: "Status da instância, QR Code e diagnóstico do canal.", icon: MessageCircle },
];
</script>
