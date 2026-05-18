<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Uso</p>
        <h1>Consumo sem conteúdo de clientes</h1>
        <p>Métricas agregadas para cobrança, limite e saúde da IA.</p>
      </div>
      <div class="super-admin-actions">
        <button type="button" :disabled="loading" @click="load">
          <Icon name="refresh" :size="15" />
          {{ loading ? "Atualizando..." : "Atualizar" }}
        </button>
      </div>
    </header>

    <div class="super-admin-kpis">
      <article>
        <div class="kpi-icon brand"><Icon name="message" :size="17" /></div>
        <span>Mensagens no período</span>
        <strong>{{ overview?.kpis?.messagesInPeriod ?? 0 }}</strong>
        <small>agregado global</small>
      </article>
      <article>
        <div class="kpi-icon purple"><Icon name="bot" :size="17" /></div>
        <span>IA no período</span>
        <strong>{{ overview?.kpis?.aiMessagesInPeriod ?? 0 }}</strong>
        <small>respostas geradas</small>
      </article>
      <article>
        <div class="kpi-icon green"><Icon name="users" :size="17" /></div>
        <span>Contatos</span>
        <strong>{{ overview?.kpis?.contacts ?? 0 }}</strong>
        <small>base total</small>
      </article>
      <article>
        <div class="kpi-icon amber"><Icon name="kanban" :size="17" /></div>
        <span>Negócios CRM</span>
        <strong>{{ overview?.kpis?.deals ?? 0 }}</strong>
        <small>pipeline total</small>
      </article>
    </div>

    <section class="super-admin-panel">
      <h2>Empresas por consumo</h2>
      <p>Ranking agregado de uso no período. Sem acesso a conteúdo de conversas.</p>

      <div v-if="loading" class="sa-empty">
        <Icon name="refresh" :size="24" />
        Carregando...
      </div>
      <div v-else-if="error" class="sa-empty" style="color:var(--ka-danger)">
        <Icon name="alert" :size="24" />
        {{ error }}
      </div>
      <div v-else-if="!overview?.topCompanies?.length" class="sa-empty">
        <Icon name="trendUp" :size="28" />
        Nenhum dado de consumo no período.
      </div>
      <div v-else>
        <div v-for="item in overview.topCompanies" :key="item.company.id" class="top-company-row">
          <strong>{{ item.company.name }}</strong>
          <span>{{ item.messages }} mensagens agregadas</span>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const api = useAdminApi();
const overview = ref<any | null>(null);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    overview.value = await api.fetch("/overview?period=30");
  } catch (err: any) {
    error.value = err?.data?.message || "Não foi possível carregar os dados de uso.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
