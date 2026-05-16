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

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: var(--ka-sidebar-width, 260px) 1fr;
  grid-template-rows: var(--ka-topbar-height, 64px) 1fr;
  min-height: 100vh;
}

.app-sidebar {
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ka-border);
  background: var(--ka-surface);
  box-shadow: var(--ka-shadow-sm);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  height: var(--ka-topbar-height, 64px);
  padding: 0 20px;
  border-bottom: 1px solid var(--ka-border);
}

.brand-wordmark {
  height: 28px;
  width: auto;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
}

.nav-section-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ka-fg-3);
}

.nav-section-label-spaced {
  margin-top: 8px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--ka-border);
}

.app-header {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--ka-border);
  background: var(--ka-surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-menu-btn {
  display: none;
}

@media (max-width: 768px) {
  .header-menu-btn {
    display: inline-flex;
  }
}

.header-search {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.header-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ka-fg-3);
  pointer-events: none;
}

.header-search-input {
  width: 100%;
  height: 40px;
  padding: 0 14px 0 38px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-gray-50);
  font-size: 14px;
  color: var(--ka-fg);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.header-search-input:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 3px var(--ka-brand-alpha);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-main {
  grid-column: 2;
  overflow: auto;
  padding: 24px;
  background: var(--ka-bg);
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
}

.mobile-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  cursor: pointer;
}

.mobile-drawer {
  position: relative;
  width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--ka-surface);
  border-right: 1px solid var(--ka-border);
  box-shadow: var(--ka-shadow-lg);
}

.mobile-drawer-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--ka-topbar-height, 64px);
  padding: 0 16px;
  border-bottom: 1px solid var(--ka-border);
}

.mobile-drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.cmdk-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
}

.cmdk-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  cursor: pointer;
}

.cmdk-panel {
  position: relative;
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-lg);
  background: var(--ka-surface);
  box-shadow: var(--ka-shadow-lg);
}

.cmdk-search {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--ka-border);
}

.cmdk-search-icon {
  color: var(--ka-fg-3);
  margin-right: 10px;
}

.cmdk-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--ka-fg);
  outline: none;
}

.cmdk-results {
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
}

.cmdk-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: var(--ka-r-md);
  text-align: left;
  font-size: 14px;
  color: var(--ka-fg);
  cursor: pointer;
}

.cmdk-item:hover {
  background: var(--ka-gray-50);
}

.cmdk-key {
  padding: 2px 6px;
  border-radius: var(--ka-r-sm);
  background: var(--ka-gray-100);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--ka-fg-3);
}

.cmdk-empty {
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--ka-fg-3);
}
</style>
