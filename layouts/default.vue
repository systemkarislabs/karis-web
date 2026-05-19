<template>
  <div class="app">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <img src="/karis-icon.png" alt="Karis" />
        <div>
          <div class="name">Karis</div>
          <div class="sub">Atende</div>
        </div>
      </div>

      <p class="nav-section-label">Workspace</p>
      <NuxtLink class="nav-item" to="/dashboard" @click="mobileOpen = false">
        <Icon name="dashboard" :size="18" />
        <span>Dashboard</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/inbox" @click="mobileOpen = false">
        <Icon name="message" :size="18" />
        <span>Conversas</span>
        <span v-if="totalUnread" class="nav-badge">{{ totalUnread }}</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/crm" @click="mobileOpen = false">
        <Icon name="kanban" :size="18" />
        <span>CRM</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/agent" @click="mobileOpen = false">
        <Icon name="bot" :size="18" />
        <span>Agente IA</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/campaigns" @click="mobileOpen = false">
        <Icon name="megaphone" :size="18" />
        <span>Campanhas</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/contacts" @click="mobileOpen = false">
        <Icon name="users" :size="18" />
        <span>Contatos</span>
      </NuxtLink>

      <p class="nav-section-label" style="margin-top: 8px;">Conta</p>
      <NuxtLink class="nav-item" to="/integrations" @click="mobileOpen = false">
        <Icon name="link" :size="18" />
        <span>Integrações</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/settings" @click="mobileOpen = false">
        <Icon name="settings" :size="18" />
        <span>Configurações</span>
      </NuxtLink>

      <!-- User card -->
      <div class="user-card">
        <div class="uc-avatar">{{ initials }}</div>
        <div style="flex: 1; min-width: 0;">
          <p style="font-size: 13px; font-weight: 600; color: var(--ka-fg); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ auth.user?.name || 'Usuário' }}
          </p>
          <p style="font-size: 11px; color: var(--ka-fg-muted); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ auth.company?.name || '' }}
          </p>
        </div>
        <button
          class="ts-icon-btn"
          style="width: 28px; height: 28px; border: 0; background: transparent;"
          title="Sair"
          @click="auth.clear(); navigateTo('/login')"
        >
          <Icon name="logout" :size="15" />
        </button>
      </div>
    </aside>

    <!-- Topbar -->
    <header class="topbar">
      <!-- Mobile menu button -->
      <button
        class="ts-icon-btn ts-menu-btn"
        style="display: none;"
        aria-label="Abrir menu"
        @click="mobileOpen = true"
      >
        <Icon name="menu" :size="20" />
      </button>

      <!-- Search -->
      <div class="ts-search">
        <Icon name="search" :size="16" class="ts-icon" />
        <input
          placeholder="Buscar conversas, contatos e comandos"
          @focus="cmdK.isOpen.value = true"
          readonly
        />
      </div>

      <!-- Actions -->
      <div class="ts-actions">
        <button class="ts-icon-btn" title="Tema" @click="toggleTheme">
          <Icon :name="isDark ? 'sun' : 'moon'" :size="18" />
        </button>
        <button class="ts-icon-btn" title="Notificações">
          <Icon name="bell" :size="18" />
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="content">
      <AdminImpersonationBanner />
      <slot />
    </main>

    <ToastHost />

    <!-- Bottom navigation (mobile only) -->
    <nav class="mobile-bottom-nav" aria-label="Navegação principal">
      <NuxtLink to="/dashboard" title="Dashboard">
        <Icon name="dashboard" :size="20" />
        <span>Início</span>
      </NuxtLink>
      <NuxtLink to="/inbox" title="Conversas">
        <Icon name="message" :size="20" />
        <span>Chat</span>
        <span v-if="totalUnread" class="mbn-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
      </NuxtLink>
      <NuxtLink to="/crm" title="CRM">
        <Icon name="kanban" :size="20" />
        <span>CRM</span>
      </NuxtLink>
      <NuxtLink to="/contacts" title="Contatos">
        <Icon name="users" :size="20" />
        <span>Contatos</span>
      </NuxtLink>
      <button class="mbn-more" type="button" title="Menu" @click="mobileOpen = true">
        <Icon name="menu" :size="20" />
        <span>Mais</span>
      </button>
    </nav>

    <!-- Mobile drawer overlay -->
    <Teleport to="body">
      <div v-if="mobileOpen" style="position: fixed; inset: 0; z-index: 50; display: flex;">
        <button
          style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); border: none; cursor: pointer;"
          aria-label="Fechar menu"
          @click="mobileOpen = false"
        />
        <aside class="sidebar" style="position: relative; width: 260px; height: 100vh; box-shadow: var(--ka-shadow-lg);">
          <div class="brand">
            <img src="/karis-icon.png" alt="Karis" />
            <div>
              <div class="name">Karis</div>
              <div class="sub">Atende</div>
            </div>
            <button
              class="ts-icon-btn"
              style="margin-left: auto; border: 0; background: transparent;"
              @click="mobileOpen = false"
            >
              <Icon name="x" :size="18" />
            </button>
          </div>
          <NuxtLink class="nav-item" to="/dashboard" @click="mobileOpen = false"><Icon name="dashboard" :size="18" /><span>Dashboard</span></NuxtLink>
          <NuxtLink class="nav-item" to="/inbox" @click="mobileOpen = false"><Icon name="message" :size="18" /><span>Conversas</span></NuxtLink>
          <NuxtLink class="nav-item" to="/crm" @click="mobileOpen = false"><Icon name="kanban" :size="18" /><span>CRM</span></NuxtLink>
          <NuxtLink class="nav-item" to="/agent" @click="mobileOpen = false"><Icon name="bot" :size="18" /><span>Agente IA</span></NuxtLink>
          <NuxtLink class="nav-item" to="/campaigns" @click="mobileOpen = false"><Icon name="megaphone" :size="18" /><span>Campanhas</span></NuxtLink>
          <NuxtLink class="nav-item" to="/contacts" @click="mobileOpen = false"><Icon name="users" :size="18" /><span>Contatos</span></NuxtLink>
          <NuxtLink class="nav-item" to="/integrations" @click="mobileOpen = false"><Icon name="link" :size="18" /><span>Integrações</span></NuxtLink>
          <NuxtLink class="nav-item" to="/settings" @click="mobileOpen = false"><Icon name="settings" :size="18" /><span>Configurações</span></NuxtLink>
        </aside>
      </div>

      <!-- Command palette -->
      <div v-if="cmdK.isOpen.value" style="position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-start; justify-content: center; padding-top: 20vh;">
        <button
          style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); border: none; cursor: pointer;"
          aria-label="Fechar"
          @click="cmdK.isOpen.value = false"
        />
        <div class="cmdk-panel" style="position: relative;">
          <div class="cmdk-search">
            <Icon name="search" :size="18" class="cmdk-search-icon" />
            <input v-model="cmdK.query.value" class="cmdk-input" placeholder="Buscar comandos..." autofocus />
          </div>
          <div class="cmdk-results">
            <button
              v-for="cmd in cmdK.filtered.value"
              :key="cmd.key"
              class="cmdk-item"
              @click="cmdK.execute(cmd)"
            >
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
import { useCmdK } from '~/composables/useCmdK'

const auth = useAuthStore()
const { isDark, toggle: toggleTheme, init: initTheme } = useTheme()
const cmdK = useCmdK()
const mobileOpen = ref(false)
const { totalUnread, setFromConversations } = useUnread()

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'KA'
})

async function refreshUnread() {
  try {
    const api = useApi()
    const res = await api.fetch<any>('/conversations?limit=100')
    const convs: any[] = res.conversations || res || []
    setFromConversations(convs)
  } catch {
    // ignore
  }
}

onMounted(() => {
  initTheme()
  auth.fetchMe()
  refreshUnread()
  cmdK.register({ key: 'g d', label: 'Ir para Dashboard', action: () => navigateTo('/dashboard') })
  cmdK.register({ key: 'g i', label: 'Ir para Conversas', action: () => navigateTo('/inbox') })
  cmdK.register({ key: 'g c', label: 'Ir para CRM', action: () => navigateTo('/crm') })
  cmdK.register({ key: 'g a', label: 'Agente IA', action: () => navigateTo('/agent') })
  cmdK.register({ key: 'g s', label: 'Configurações', action: () => navigateTo('/settings') })
})
</script>
