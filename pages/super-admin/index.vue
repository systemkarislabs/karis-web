<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Painel operacional</p>
        <h1>Controle do Karis Atende IA</h1>
        <p>Veja se cada empresa está com agente, WhatsApp, plano e funções críticas ativos. Sem leitura de conversas de clientes.</p>
      </div>
      <div class="super-admin-actions">
        <NuxtLink to="/super-admin/plans">Configurar planos</NuxtLink>
        <button type="button" :disabled="loading" @click="refresh">
          <Icon name="refresh" :size="15" />
          {{ loading ? "Atualizando..." : "Atualizar" }}
        </button>
      </div>
    </header>

    <div class="super-admin-kpis">
      <article>
        <span>Empresas ativas</span>
        <strong>{{ overview?.kpis.activeCompanies ?? 0 }}</strong>
        <small>{{ overview?.kpis.companies ?? 0 }} cadastradas</small>
      </article>
      <article>
        <span>Agentes IA ativos</span>
        <strong>{{ overview?.kpis.activeAgents ?? 0 }}</strong>
        <small>Assistentes prontos para responder</small>
      </article>
      <article>
        <span>WhatsApp conectado</span>
        <strong>{{ overview?.kpis.connectedWhatsapp ?? 0 }}</strong>
        <small>Instâncias operacionais</small>
      </article>
      <article>
        <span>Respostas IA</span>
        <strong>{{ overview?.kpis.aiRate ?? 0 }}%</strong>
        <small>Participação da IA no período</small>
      </article>
    </div>

    <div class="super-admin-grid">
      <section class="super-admin-panel">
        <div class="panel-title">
          <div>
            <h2>Status das empresas</h2>
            <p>Foco em funções ativas, não em conteúdo de atendimento.</p>
          </div>
          <NuxtLink class="panel-link" to="/super-admin/companies">Ver todas</NuxtLink>
        </div>

        <div class="ops-table">
          <NuxtLink v-for="company in companies.slice(0, 8)" :key="company.id" :to="`/super-admin/companies/${company.id}`" class="ops-row">
            <div class="company-logo">
              <img v-if="company.logoUrl" :src="company.logoUrl" alt="" />
              <span v-else>{{ initials(company.name) }}</span>
            </div>
            <div>
              <strong>{{ company.name }}</strong>
              <span>{{ company.operationalStatus?.planName || "Sem plano" }}</span>
            </div>
            <span class="status-pill" :class="{ off: !company.operationalStatus?.agentActive }">IA {{ company.operationalStatus?.agentActive ? "ativa" : "off" }}</span>
            <span class="status-pill" :class="{ off: !company.operationalStatus?.whatsappConnected }">WhatsApp {{ company.operationalStatus?.whatsappStatus || "off" }}</span>
            <span class="status-pill" :class="{ off: !company.active }">{{ company.active ? "Empresa ativa" : "Suspensa" }}</span>
          </NuxtLink>
        </div>
      </section>

      <section class="super-admin-panel">
        <h2>Funções críticas</h2>
        <p>Itens que você deve decidir por plano ou por exceção de empresa.</p>
        <div class="feature-health-list">
          <div v-for="item in criticalFeatures" :key="item.key">
            <strong>{{ item.label }}</strong>
            <span>{{ countFeature(item.key) }} empresas liberadas</span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">

definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const api = useAdminApi();
const toast = useToast();
const overview = ref<any | null>(null);
const companies = ref<any[]>([]);
const loading = ref(false);
const criticalFeatures = [
  { key: "ai", label: "Agente IA" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "crm", label: "CRM" },
  { key: "campaigns", label: "Campanhas" },
  { key: "automations", label: "Automações" },
  { key: "reports", label: "Relatórios" },
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function countFeature(key: string) {
  return companies.value.filter(company => company.features?.[key]).length;
}

async function refresh() {
  loading.value = true;
  try {
    const companiesData = await api.fetch<{ companies: any[] }>(`/companies?take=100`);
    companies.value = companiesData.companies;

    // overview é opcional — endpoint pode não existir ainda
    try {
      const overviewData = await api.fetch(`/overview?period=30`);
      overview.value = overviewData;
    } catch {
      // silencioso: KPIs ficam zerados se endpoint não existir
    }
  } catch (err: any) {
    toast.error(err?.data?.message || "Não foi possível carregar os dados.");
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
</script>
