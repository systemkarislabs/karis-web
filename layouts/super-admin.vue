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
        <span class="sa-mode-badge">Admin</span>
      </div>

      <p class="nav-section-label">Plataforma</p>
      <NuxtLink
        class="nav-item"
        to="/super-admin"
        exact-active-class="router-link-active"
        active-class=""
      >
        <Icon name="dashboard" :size="18" />
        <span>Dashboard</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/super-admin/companies">
        <Icon name="building" :size="18" />
        <span>Empresas</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/super-admin/plans">
        <Icon name="dollar" :size="18" />
        <span>Planos</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/super-admin/reports">
        <Icon name="fileText" :size="18" />
        <span>Relatórios</span>
      </NuxtLink>
      <NuxtLink class="nav-item" to="/super-admin/security">
        <Icon name="shield" :size="18" />
        <span>Segurança</span>
      </NuxtLink>

      <!-- User card -->
      <div class="user-card">
        <div class="uc-avatar" style="background:linear-gradient(135deg,var(--ka-brand-light),var(--ka-brand));">SA</div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:12px;font-weight:600;color:var(--ka-fg);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            {{ superAdmin.platformUser?.email || 'Super Admin' }}
          </p>
          <p style="font-size:11px;color:var(--ka-fg-muted);margin:0;">Administrador</p>
        </div>
        <button
          class="ts-icon-btn"
          style="width:28px;height:28px;border:0;background:transparent;"
          title="Sair"
          @click="logout"
        >
          <Icon name="logout" :size="15" />
        </button>
      </div>
    </aside>

    <!-- Topbar -->
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="sa-topbar-badge">
          <Icon name="shield" :size="13" />
          Modo Super Admin
        </span>
      </div>
      <div class="ts-actions" style="margin-left:auto;">
        <button class="btn secondary sm" type="button" @click="navigateTo('/dashboard')">
          <Icon name="arrowLeft" :size="14" />
          Voltar ao app
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const superAdmin = useSuperAdminStore()

onMounted(() => superAdmin.fetchMe())

function logout() {
  superAdmin.clear()
  navigateTo('/login')
}
</script>

<style scoped>
.sa-mode-badge {
  margin-left: auto;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ka-brand);
  background: var(--ka-brand-50);
  border-radius: 6px;
  padding: 3px 7px;
}

.sa-topbar-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ka-brand);
  background: var(--ka-brand-50);
  border: 1px solid var(--ka-brand-100);
  border-radius: 8px;
  padding: 4px 10px;
}
</style>
