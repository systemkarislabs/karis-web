<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Empresa</p>
        <h1>{{ company?.name || "Carregando..." }}</h1>
        <p>{{ company?.adminUser?.email || "Admin ainda não definido" }}</p>
      </div>
      <div class="super-admin-actions">
        <button type="button" @click="impersonate">
          <LogIn class="h-4 w-4" />
          Entrar como admin
        </button>
      </div>
    </header>

    <div class="super-admin-kpis">
      <article><span>Empresa</span><strong>{{ company?.active ? "Ativa" : "Suspensa" }}</strong><small>Status comercial</small></article>
      <article><span>Agente IA</span><strong>{{ company?.operationalStatus?.agentActive ? "Ativo" : "Off" }}</strong><small>{{ company?.assistant?.name || "Assistente" }}</small></article>
      <article><span>WhatsApp</span><strong>{{ company?.operationalStatus?.whatsappStatus || "Off" }}</strong><small>Conexão operacional</small></article>
      <article><span>Plano</span><strong>{{ company?.operationalStatus?.planName || "Sem plano" }}</strong><small>{{ company?.operationalStatus?.subscriptionStatus || "sem assinatura" }}</small></article>
    </div>

    <div class="super-admin-grid">
      <section class="super-admin-panel">
        <h2>Plano e funções</h2>
        <form class="stack-form" @submit.prevent="saveCompany">
          <label>Nome<input v-model="form.name" required /></label>
          <label>Logo URL<input v-model="form.logoUrl" placeholder="https://..." /></label>
          <label>Plano
            <select v-model="selectedPlanId">
              <option value="">Sem plano</option>
              <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
            </select>
          </label>
          <div class="feature-toggles">
            <label><input v-model="form.active" type="checkbox" /> Empresa ativa</label>
            <label><input v-model="form.aiEnabled" type="checkbox" /> IA ativa</label>
            <label><input v-model="form.whatsappEnabled" type="checkbox" /> WhatsApp</label>
            <label><input v-model="form.karisLinkEnabled" type="checkbox" /> Karis Link</label>
          </div>
          <button type="button" @click="applyPlan">Aplicar plano à empresa</button>

          <h3>Exceções por empresa</h3>
          <p>Essas opções sobrescrevem o plano somente para esta empresa.</p>
          <div class="module-grid">
            <label v-for="feature in features" :key="feature.key">
              <input v-model="featureOverrides[feature.key]" type="checkbox" />
              {{ feature.label }}
            </label>
          </div>

          <p v-if="message" class="success-copy">{{ message }}</p>
          <p v-if="error" class="form-error">{{ error }}</p>
          <button class="primary-action" type="submit">Salvar alterações</button>
        </form>
      </section>

      <section class="super-admin-panel">
        <h2>Acesso administrativo</h2>
        <p>Altere a senha do primeiro usuário ADMIN da empresa. Não há leitura de conversas de clientes aqui.</p>
        <form class="stack-form" @submit.prevent="resetPassword">
          <label>Nova senha<input v-model="newPassword" type="password" required /></label>
          <button type="submit">Resetar senha</button>
        </form>

        <div class="admin-user-card" v-if="company?.adminUser">
          <strong>{{ company.adminUser.name }}</strong>
          <span>{{ company.adminUser.email }}</span>
          <small>{{ company.adminUser.active ? "Ativo" : "Inativo" }}</small>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { LogIn } from "lucide-vue-next";

definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const route = useRoute();
const api = useAdminApi();
const company = ref<any | null>(null);
const plans = ref<any[]>([]);
const selectedPlanId = ref("");
const newPassword = ref("");
const message = ref("");
const error = ref("");
const form = reactive({ name: "", logoUrl: "", active: true, aiEnabled: true, whatsappEnabled: true, karisLinkEnabled: true });
const featureOverrides = reactive<Record<string, boolean>>({});
const features = [
  { key: "crm", label: "CRM" },
  { key: "sales", label: "Vendas" },
  { key: "campaigns", label: "Campanhas" },
  { key: "automations", label: "Automações" },
  { key: "calendar", label: "Calendário" },
  { key: "reports", label: "Relatórios" },
  { key: "knowledge", label: "Base de conhecimento" },
  { key: "playground", label: "Playground IA" },
  { key: "billing", label: "Faturamento" },
];

async function load() {
  const [data, plansData] = await Promise.all([
    api.fetch<{ company: any }>(`/companies/${route.params.id}`),
    api.fetch<{ plans: any[] }>("/plans?includeInactive=1"),
  ]);
  company.value = data.company;
  plans.value = plansData.plans;
  selectedPlanId.value = data.company.subscription?.planId || "";
  Object.assign(form, {
    name: data.company.name,
    logoUrl: data.company.logoUrl || "",
    active: data.company.active,
    aiEnabled: data.company.aiEnabled,
    whatsappEnabled: data.company.whatsappEnabled,
    karisLinkEnabled: data.company.karisLinkEnabled,
  });
  features.forEach(feature => {
    featureOverrides[feature.key] = data.company.features?.[feature.key] ?? true;
  });
}

async function applyPlan() {
  message.value = "";
  error.value = "";
  if (!selectedPlanId.value) {
    error.value = "Selecione um plano para aplicar.";
    return;
  }
  try {
    await api.fetch(`/companies/${route.params.id}/subscription`, {
      method: "PUT",
      body: JSON.stringify({ planId: selectedPlanId.value, status: "ACTIVE", applyPlanToCompany: true }),
    });
    message.value = "Plano aplicado à empresa.";
    await load();
  } catch (err: any) {
    error.value = err?.data?.message || "Não foi possível aplicar o plano.";
  }
}

async function saveCompany() {
  message.value = "";
  error.value = "";
  try {
    await api.fetch(`/companies/${route.params.id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...form, logoUrl: form.logoUrl || null, featuresOverride: featureOverrides }),
    });
    message.value = "Empresa atualizada.";
    await load();
  } catch (err: any) {
    error.value = err?.data?.message || "Não foi possível salvar.";
  }
}

async function resetPassword() {
  message.value = "";
  error.value = "";
  try {
    await api.fetch(`/companies/${route.params.id}/admin-password`, {
      method: "POST",
      body: JSON.stringify({ password: newPassword.value }),
    });
    newPassword.value = "";
    message.value = "Senha do admin atualizada.";
  } catch (err: any) {
    error.value = err?.data?.message || "Não foi possível resetar a senha.";
  }
}

async function impersonate() {
  const data = await api.fetch<{ token: string }>(`/companies/${route.params.id}/impersonate`, {
    method: "POST",
    body: JSON.stringify({ reason: "Acesso iniciado pelo painel Super Admin" }),
  });
  if (import.meta.client) localStorage.setItem("karis_impersonation_token", data.token);
  await navigateTo("/dashboard");
}

onMounted(load);
</script>
