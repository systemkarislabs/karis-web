<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Relatórios</p>
        <h1>Saúde da plataforma</h1>
        <p>Relatórios agregados de operação, sem abrir conversas ou mensagens de clientes.</p>
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
        <small>uso agregado</small>
      </article>
    </div>

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
        Nenhum dado de volume disponível ainda.<br />
        <span style="font-size:11px;margin-top:4px;">O endpoint /overview precisa estar ativo no backend.</span>
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
