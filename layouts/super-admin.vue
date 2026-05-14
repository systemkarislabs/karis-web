<template>
  <div class="super-admin-shell">
    <aside class="super-admin-sidebar">
      <NuxtLink class="super-admin-brand" to="/super-admin">
        <img src="/karis-atende-wordmark-white.png" alt="Karis Atende" />
        <span>Super Admin</span>
      </NuxtLink>

      <nav>
        <NuxtLink to="/super-admin" class="super-admin-nav" active-class="is-active">
          <LayoutDashboard class="h-4 w-4" />
          Dashboard
        </NuxtLink>
        <NuxtLink to="/super-admin/companies" class="super-admin-nav" active-class="is-active">
          <Building2 class="h-4 w-4" />
          Empresas
        </NuxtLink>
        <NuxtLink to="/super-admin/plans" class="super-admin-nav" active-class="is-active">
          <PackageCheck class="h-4 w-4" />
          Planos
        </NuxtLink>
        <NuxtLink to="/super-admin/usage" class="super-admin-nav" active-class="is-active">
          <Gauge class="h-4 w-4" />
          Uso
        </NuxtLink>
        <NuxtLink to="/super-admin/reports" class="super-admin-nav" active-class="is-active">
          <BarChart3 class="h-4 w-4" />
          Relatórios
        </NuxtLink>
        <NuxtLink to="/super-admin/security" class="super-admin-nav" active-class="is-active">
          <ShieldCheck class="h-4 w-4" />
          Segurança
        </NuxtLink>
      </nav>

      <div class="super-admin-user">
        <ShieldCheck class="h-4 w-4" />
        <div>
          <strong>{{ superAdmin.platformUser?.email || "Super Admin" }}</strong>
          <button type="button" @click="logout">Sair</button>
        </div>
      </div>
    </aside>

    <main class="super-admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { BarChart3, Building2, Gauge, LayoutDashboard, PackageCheck, ShieldCheck } from "lucide-vue-next";

const superAdmin = useSuperAdminStore();

onMounted(() => superAdmin.fetchMe());

function logout() {
  superAdmin.clear();
  navigateTo("/super-admin/login");
}
</script>
