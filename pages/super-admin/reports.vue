<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Relatórios</p>
        <h1>Saúde e consumo da plataforma</h1>
        <p>Métricas agregadas de operação e consumo. Sem acesso a conversas ou mensagens de clientes.</p>
      </div>
      <div class="super-admin-actions">
        <div class="period-tabs">
          <button v-for="option in [7, 30, 90]" :key="option" :class="{ active: period === option }" @click="setPeriod(option)">
            {{ option }}d
          </button>
        </div>
        <button type="button" :disabled="loading" @click="load">
          <Icon name="refresh" :size="15" />
          {{ loading ? "Atualizando..." : "Atualizar" }}
        </button>
      </div>
    </header>

    <!-- KPIs — linha 1: operacional -->
    <div class="super-admin-kpis">
      <article>
        <div class="kpi-icon brand"><Icon name="building" :size="17" /></div>
        <span>Empresas ativas</span>
        <strong>{{ data?.kpis?.activeCompanies ?? 0 }}</strong>
        <small>{{ data?.kpis?.companies ?? 0 }} cadastradas</small>
      </article>
      <article>
        <div class="kpi-icon purple"><Icon name="bot" :size="17" /></div>
        <span>Agentes IA ativos</span>
        <strong>{{ data?.kpis?.activeAgents ?? 0 }}</strong>
        <small>assistentes ligados</small>
      </article>
      <article>
        <div class="kpi-icon teal"><Icon name="whatsapp" :size="17" /></div>
        <span>WhatsApp conectado</span>
        <strong>{{ data?.kpis?.connectedWhatsapp ?? 0 }}</strong>
        <small>instâncias ativas</small>
      </article>
      <article>
        <div class="kpi-icon amber"><Icon name="trendUp" :size="17" /></div>
        <span>IA no período</span>
        <strong>{{ data?.kpis?.aiRate ?? 0 }}%</strong>
        <small>participação da IA</small>
      </article>
    </div>

    <!-- KPIs — linha 2: consumo -->
    <div class="super-admin-kpis" style="margin-top:0">
      <article>
        <div class="kpi-icon brand"><Icon name="message" :size="17" /></div>
        <span>Mensagens no período</span>
        <strong>{{ data?.kpis?.messagesInPeriod ?? 0 }}</strong>
        <small>agregado global</small>
      </article>
      <article>
        <div class="kpi-icon purple"><Icon name="bot" :size="17" /></div>
        <span>Respostas IA</span>
        <strong>{{ data?.kpis?.aiMessagesInPeriod ?? 0 }}</strong>
        <small>geradas no período</small>
      </article>
      <article>
        <div class="kpi-icon green"><Icon name="users" :size="17" /></div>
        <span>Contatos</span>
        <strong>{{ data?.kpis?.contacts ?? 0 }}</strong>
        <small>base total</small>
      </article>
      <article>
        <div class="kpi-icon amber"><Icon name="kanban" :size="17" /></div>
        <span>Negócios CRM</span>
        <strong>{{ data?.kpis?.deals ?? 0 }}</strong>
        <small>pipeline total</small>
      </article>
    </div>

    <div class="super-admin-grid">
      <!-- Gráfico de volume -->
      <section class="super-admin-panel">
        <div class="panel-title">
          <div>
            <h2>Volume agregado</h2>
            <p>Quantidade por dia para acompanhar limite e capacidade.</p>
          </div>
          <div class="chart-legend">
            <span></span> Mensagens
            <span class="blue"></span> Conversas
          </div>
        </div>

        <div v-if="loading" class="sa-empty">
          <Icon name="refresh" :size="24" />
          Carregando...
        </div>
        <div v-else-if="error" class="sa-empty" style="color:var(--ka-danger)">
          <Icon name="alert" :size="24" />
          {{ error }}
        </div>
        <div v-else-if="!data?.series?.length" class="sa-empty">
          <Icon name="fileText" :size="28" />
          Nenhum volume registrado no período.
        </div>
        <div v-else class="bar-chart">
          <div v-for="item in data.series" :key="item.day" class="bar-day">
            <div class="bars">
              <i class="green" :style="{ height: `${(item.messages / (maxSeries || 1)) * 100}%` }"></i>
              <i :style="{ height: `${(item.conversations / (maxSeries || 1)) * 100}%` }"></i>
            </div>
            <small>{{ formatDay(item.day) }}</small>
          </div>
        </div>
      </section>

      <!-- Ranking de empresas por consumo -->
      <section class="super-admin-panel">
        <h2>Empresas por consumo</h2>
        <p>Ranking no período selecionado. Sem acesso ao conteúdo das conversas.</p>

        <div v-if="loading" class="sa-empty">
          <Icon name="refresh" :size="20" />
          Carregando...
        </div>
        <div v-else-if="!data?.topCompanies?.length" class="sa-empty">
          <Icon name="building" :size="24" />
          Nenhum dado disponível ainda.
        </div>
        <div v-else class="top-companies-list">
          <div v-for="(item, index) in data.topCompanies" :key="item.company.id" class="top-company-row">
            <span class="top-company-rank">{{ index + 1 }}</span>
            <div class="top-company-info">
              <strong>{{ item.company.name }}</strong>
              <small>{{ item.messages }} mensagens</small>
            </div>
            <span class="top-company-bar-wrap">
              <span
                class="top-company-bar"
                :style="{ width: `${(item.messages / (data.topCompanies[0].messages || 1)) * 100}%` }"
              ></span>
            </span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const api = useAdminApi();
const period = ref(30);
const data = ref<any | null>(null);
const loading = ref(false);
const error = ref("");

const maxSeries = computed(() =>
  Math.max(...(data.value?.series || []).flatMap((item: any) => [item.messages, item.conversations]), 1)
);

function formatDay(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

function setPeriod(value: number) {
  period.value = value;
  load();
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await api.fetch(`/overview?period=${period.value}`);
  } catch (err: any) {
    error.value = err?.data?.message || "Não foi possível carregar os relatórios.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
