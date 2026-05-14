<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="app-brand notranslate" translate="no">
        <img class="app-brand-wordmark" src="/karis-atende-wordmark-blue.png" alt="Karis Atende" />
      </div>

      <nav class="app-nav scrollbar-thin">
        <p class="app-nav-label">Operação</p>
        <NavItem to="/dashboard" :icon="LayoutDashboard" :label="$t('nav.dashboard')" />
        <NavItem to="/inbox" :icon="MessageSquare" :label="$t('nav.inbox')" />
        <NavItem to="/whatsapp" :icon="MessageCircle" :label="$t('nav.whatsapp')" />
        <NavItem to="/contacts" :icon="Users" :label="$t('nav.contacts')" />
        <NavItem to="/crm" :icon="Kanban" :label="$t('nav.crm')" />
        <NavItem to="/agent" :icon="Bot" :label="$t('nav.agent')" />

        <p class="app-nav-label app-nav-label-spaced">Crescimento</p>
        <NavItem to="/queue" :icon="ListOrdered" :label="$t('nav.queue')" />
        <NavItem to="/campaigns" :icon="Megaphone" :label="$t('nav.campaigns')" />
        <NavItem to="/reports" :icon="BarChart3" :label="$t('nav.reports')" />
        <NavItem to="/settings" :icon="Settings" :label="$t('nav.settings')" />
      </nav>

      <div class="app-user-card">
        <Avatar :name="auth.user?.name || 'Usuário'" size="sm" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-[--ka-fg]">{{ auth.user?.name || "Usuário" }}</p>
          <p class="company-identity-line text-xs text-[--ka-fg-muted]">
            <CompanyIdentity :name="auth.company?.name" />
          </p>
        </div>
      </div>
    </aside>

    <header class="app-header">
      <Button class="app-menu-button" variant="ghost" size="icon" aria-label="Abrir menu" @click="mobileMenuOpen = true">
        <Menu class="h-5 w-5" />
      </Button>
      <div class="relative hidden w-full max-w-xl md:block">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--ka-fg-muted]" />
        <input class="input-field h-10 min-h-10 bg-[--ka-gray-50] pl-9" placeholder="Buscar conversas, contatos e comandos" @focus="cmdK.isOpen.value = true" />
      </div>
      <div class="ml-auto flex items-center gap-2">
        <Button variant="secondary" size="icon" aria-label="Notificações">
          <Bell class="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Sair" @click="auth.clear(); navigateTo('/login')">
          <LogOut class="h-4 w-4" />
        </Button>
      </div>
    </header>

    <main class="app-main">
      <AdminImpersonationBanner />
      <slot />
    </main>

    <Teleport to="body">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 lg:hidden">
        <button class="absolute inset-0 bg-slate-950/45" aria-label="Fechar menu" @click="mobileMenuOpen = false" />
        <aside class="relative flex h-full w-72 flex-col border-r border-[--ka-border] bg-[--ka-surface] p-3 shadow-[--ka-shadow-lg]">
          <div class="app-brand notranslate mb-3 !h-12 !border-0 !px-0" translate="no">
            <img class="app-brand-wordmark" src="/karis-atende-wordmark-blue.png" alt="Karis Atende" />
            <Button class="ml-auto" variant="ghost" size="icon" aria-label="Fechar menu" @click="mobileMenuOpen = false">
              <X class="h-5 w-5" />
            </Button>
          </div>
          <nav class="space-y-1 overflow-y-auto">
            <NavItem v-for="item in mobileItems" :key="item.to" :to="item.to" :icon="item.icon" :label="item.label" @click="mobileMenuOpen = false" />
          </nav>
        </aside>
      </div>

      <div v-if="cmdK.isOpen.value" class="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
        <button class="fixed inset-0 bg-slate-950/45" aria-label="Fechar comandos" @click="cmdK.isOpen.value = false" />
        <div class="relative w-full max-w-lg overflow-hidden rounded-[--ka-r-xl] border border-[--ka-border] bg-[--ka-surface] shadow-[--ka-shadow-lg]">
          <div class="border-b border-[--ka-border] p-3">
            <input v-model="cmdK.query.value" class="input-field" placeholder="Buscar comandos..." autofocus />
          </div>
          <div class="max-h-72 overflow-auto p-2">
            <button v-for="cmd in cmdK.filtered.value" :key="cmd.key" class="flex w-full items-center gap-3 rounded-[--ka-r-md] px-3 py-2 text-left text-sm hover:bg-[--ka-gray-50]" @click="cmdK.execute(cmd)">
              <span class="rounded bg-[--ka-gray-100] px-1.5 py-0.5 font-mono text-xs text-[--ka-fg-muted]">{{ cmd.key }}</span>
              <span>{{ cmd.label }}</span>
            </button>
            <p v-if="cmdK.filtered.value.length === 0" class="py-6 text-center text-sm text-[--ka-fg-muted]">Nenhum comando encontrado.</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { BarChart3, Bell, Bot, Kanban, LayoutDashboard, ListOrdered, LogOut, Megaphone, Menu, MessageCircle, MessageSquare, Search, Settings, Users, X } from "lucide-vue-next";
import { useCmdK } from "~/composables/useCmdK";

const auth = useAuthStore();
const { init: initTheme } = useTheme();
const cmdK = useCmdK();
const mobileMenuOpen = ref(false);

const mobileItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inbox", icon: MessageSquare, label: "Inbox" },
  { to: "/whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { to: "/contacts", icon: Users, label: "Contatos" },
  { to: "/crm", icon: Kanban, label: "CRM" },
  { to: "/agent", icon: Bot, label: "Agente IA" },
  { to: "/queue", icon: ListOrdered, label: "Fila" },
  { to: "/campaigns", icon: Megaphone, label: "Campanhas" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

onMounted(() => {
  initTheme();
  auth.fetchMe();
  cmdK.register({ key: "g d", label: "Ir para Dashboard", action: () => navigateTo("/dashboard") });
  cmdK.register({ key: "g i", label: "Ir para Inbox", action: () => navigateTo("/inbox") });
  cmdK.register({ key: "g w", label: "Ir para WhatsApp", action: () => navigateTo("/whatsapp") });
  cmdK.register({ key: "g c", label: "Ir para CRM", action: () => navigateTo("/crm") });
  cmdK.register({ key: "g a", label: "Agente IA", action: () => navigateTo("/agent") });
  cmdK.register({ key: "g s", label: "Configurações", action: () => navigateTo("/settings") });
});
</script>
