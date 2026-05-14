<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Empresas</p>
        <h1>Empresas e funções ativas</h1>
        <p>Controle plano, status da IA, WhatsApp e módulos liberados para cada empresa.</p>
      </div>
      <div class="super-admin-actions">
        <button type="button" @click="loadCompanies">
          <RefreshCw class="h-4 w-4" />
          Atualizar
        </button>
      </div>
    </header>

    <div class="super-admin-grid">
      <section class="super-admin-panel">
        <div class="panel-title">
          <div>
            <h2>Operação por empresa</h2>
            <p>{{ companies.length }} registros carregados</p>
          </div>
          <input v-model="search" placeholder="Buscar empresa ou admin" @keydown.enter="loadCompanies" />
        </div>

        <div class="ops-table">
          <NuxtLink v-for="company in companies" :key="company.id" :to="`/super-admin/companies/${company.id}`" class="ops-row">
            <div class="company-logo">
              <img v-if="company.logoUrl" :src="company.logoUrl" alt="" />
              <span v-else>{{ initials(company.name) }}</span>
            </div>
            <div>
              <strong>{{ company.name }}</strong>
              <span>{{ company.adminUser?.email || "Sem admin" }}</span>
            </div>
            <span>{{ company.operationalStatus?.planName || "Sem plano" }}</span>
            <span class="status-pill" :class="{ off: !company.operationalStatus?.agentActive }">IA {{ company.operationalStatus?.agentActive ? "ativa" : "off" }}</span>
            <span class="status-pill" :class="{ off: !company.operationalStatus?.whatsappConnected }">WhatsApp {{ company.operationalStatus?.whatsappStatus || "off" }}</span>
            <span class="status-pill" :class="{ off: !company.active }">{{ company.active ? "Ativa" : "Suspensa" }}</span>
          </NuxtLink>
        </div>
      </section>

      <section class="super-admin-panel">
        <h2>Cadastrar empresa</h2>
        <p>Cria empresa, usuário ADMIN, assistente IA e pipeline inicial.</p>
        <form class="stack-form" @submit.prevent="createCompany">
          <label>Empresa<input v-model="form.name" required /></label>
          <label>Nome do admin<input v-model="form.adminName" required /></label>
          <label>E-mail do admin<input v-model="form.adminEmail" type="email" required /></label>
          <label>Senha inicial<input v-model="form.adminPassword" type="password" required /></label>
          <label>Logo URL<input v-model="form.logoUrl" placeholder="https://..." /></label>
          <label>Plano
            <select v-model="form.planId">
              <option value="">Sem plano inicial</option>
              <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
            </select>
          </label>
          <div class="feature-toggles">
            <label><input v-model="form.aiEnabled" type="checkbox" /> IA</label>
            <label><input v-model="form.whatsappEnabled" type="checkbox" /> WhatsApp</label>
            <label><input v-model="form.karisLinkEnabled" type="checkbox" /> Karis Link</label>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <button class="primary-action" type="submit" :disabled="saving">{{ saving ? "Criando..." : "Cadastrar empresa" }}</button>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";

definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const api = useAdminApi();
const companies = ref<any[]>([]);
const plans = ref<any[]>([]);
const search = ref("");
const saving = ref(false);
const formError = ref("");
const form = reactive({
  name: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  logoUrl: "",
  planId: "",
  aiEnabled: true,
  whatsappEnabled: true,
  karisLinkEnabled: true,
});

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

async function loadCompanies() {
  const data = await api.fetch<{ companies: any[] }>(`/companies?take=100&search=${encodeURIComponent(search.value)}`);
  companies.value = data.companies;
}

async function loadPlans() {
  const data = await api.fetch<{ plans: any[] }>("/plans?includeInactive=1");
  plans.value = data.plans;
}

async function createCompany() {
  saving.value = true;
  formError.value = "";
  try {
    await api.fetch("/companies", {
      method: "POST",
      body: JSON.stringify({ ...form, logoUrl: form.logoUrl || null, planId: form.planId || null }),
    });
    Object.assign(form, { name: "", adminName: "", adminEmail: "", adminPassword: "", logoUrl: "", planId: "", aiEnabled: true, whatsappEnabled: true, karisLinkEnabled: true });
    await loadCompanies();
  } catch (err: any) {
    formError.value = err?.data?.message || "Não foi possível cadastrar.";
  } finally {
    saving.value = false;
  }
}

onMounted(() => Promise.all([loadCompanies(), loadPlans()]));
</script>
