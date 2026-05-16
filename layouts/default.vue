<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="sidebar-brand">
        <img class="brand-wordmark" src="/karis-atende-wordmark-blue.png" alt="Karis Atende" />
      </div>

      <nav class="sidebar-nav scrollbar-thin">
        <p class="nav-section-label">Operação</p>
        <NavItem to="/dashboard" icon="dashboard" :label="$t('nav.dashboard')" />
        <NavItem to="/inbox" icon="message" :label="$t('nav.inbox')" :badge="unreadCount || undefined" />
        <NavItem to="/contacts" icon="users" :label="$t('nav.contacts')" />
        <NavItem to="/crm" icon="kanban" :label="$t('nav.crm')" />
        <NavItem to="/agent" icon="bot" :label="$t('nav.agent')" />

        <p class="nav-section-label nav-section-label-spaced">Crescimento</p>
        <NavItem to="/campaigns" icon="megaphone" :label="$t('nav.campaigns')" />
        <NavItem to="/settings" icon="settings" :label="$t('nav.settings')" />
      </nav>

      <div class="sidebar-footer">
        <Avatar :name="auth.user?.name || 'Usuário'" size="sm" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-[--ka-fg]">{{ auth.user?.name || "Usuário" }}</p>
          <p class="truncate text-xs text-[--ka-fg-3]">{{ auth.company?.name || "" }}</p>
        </div>
      </div>
    </aside>

    <header class="app-header">
      <div class="header-left">
        <Button class="header-menu-btn" variant="ghost" size="icon" aria-label="Abrir menu" @click="mobileMenuOpen = true">
          <Icon name="menu" :size="20" />
        </Button>
        <div class="header-search">
          <Icon name="search" :size="16" class="header-search-icon" />
          <input class="header-search-input" placeholder="Buscar conversas, contatos e comandos" @focus="cmdK.isOpen.value = true" />
        </div>
      </div>
      <div class="header-right">
        <Button variant="ghost" size="icon" aria-label="Tweaks" @click="tweaksOpen = !tweaksOpen">
          <Icon name="sparkles" :size="18" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Icon name="bell" :size="18" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Sair" @click="auth.clear(); navigateTo('/login')">
          <Icon name="logout" :size="18" />
        </Button>
      </div>
    </header>

    <main class="app-main">
      <AdminImpersonationBanner />
      <slot />
    </main>

    <TweaksPanel />
    <ToastHost />

    <Teleport to="body">
      <div v-if="mobileMenuOpen" class="mobile-overlay">
        <button class="mobile-backdrop" aria-label="Fechar menu" @click="mobileMenuOpen = false" />
        <aside class="mobile-drawer">
          <div class="mobile-drawer-brand">
            <img class="brand-wordmark" src="/karis-atende-wordmark-blue.png" alt="Karis Atende" />
            <Button variant="ghost" size="icon" aria-label="Fechar menu" @click="mobileMenuOpen = false">
              <Icon name="x" :size="20" />
            </Button>
          </div>
          <nav class="mobile-drawer-nav">
            <NavItem v-for="item in mobileItems" :key="item.to" :to="item.to" :icon="item.icon" :label="item.label" @click="mobileMenuOpen = false" />
          </nav>
        </aside>
      </div>

      <div v-if="cmdK.isOpen.value" class="cmdk-overlay">
        <button class="cmdk-backdrop" aria-label="Fechar comandos" @click="cmdK.isOpen.value = false" />
        <div class="cmdk-panel">
          <div class="cmdk-search">
            <Icon name="search" :size="18" class="cmdk-search-icon" />
            <input v-model="cmdK.query.value" class="cmdk-input" placeholder="Buscar comandos..." autofocus />
          </div>
          <div class="cmdk-results">
            <button v-for="cmd in cmdK.filtered.value" :key="cmd.key" class="cmdk-item" @click="cmdK.execute(cmd)">
              <span class="cmdk-key">{{ cmd.key }}</span>
              <span>{{ cmd.label }}</span>
            </button>
            <p v-if="cmdK.filtered.value.length === 0" class="cmdk-empty">Nenhum comando encontrado.</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useCmdK } from "~/composables/useCmdK";

const auth = useAuthStore();
const { init: initTheme } = useTheme();
const cmdK = useCmdK();
const mobileMenuOpen = ref(false);
const unreadCount = ref(0);
const tweaksOpen = ref(false);

async function refreshUnread() {
  try {
    const api = useApi();
    const res = await api.fetch<any>("/conversations?limit=100");
    const convs: any[] = res.conversations || res || [];
    unreadCount.value = convs.reduce((sum: number, c: any) => sum + Number(c.unreadCount || 0), 0);
  } catch {
    // silently ignore
  }
}

const mobileItems = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/inbox", icon: "message", label: "Inbox" },
  { to: "/contacts", icon: "users", label: "Contatos" },
  { to: "/crm", icon: "kanban", label: "CRM" },
  { to: "/agent", icon: "bot", label: "Agente IA" },
  { to: "/campaigns", icon: "megaphone", label: "Campanhas" },
  { to: "/settings", icon: "settings", label: "Configurações" },
];

watch(tweaksOpen, (v) => {
  const { open } = useTweaks();
  open.value = v;
});

onMounted(() => {
  initTheme();
  auth.fetchMe();
  refreshUnread();
  cmdK.register({ key: "g d", label: "Ir para Dashboard", action: () => navigateTo("/dashboard") });
  cmdK.register({ key: "g i", label: "Ir para Inbox", action: () => navigateTo("/inbox") });
  cmdK.register({ key: "g c", label: "Ir para CRM", action: () => navigateTo("/crm") });
  cmdK.register({ key: "g a", label: "Agente IA", action: () => navigateTo("/agent") });
  cmdK.register({ key: "g s", label: "Configurações", action: () => navigateTo("/settings") });
});
</script>


