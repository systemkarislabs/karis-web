<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Relatórios</p>
        <h1>Saúde da plataforma</h1>
        <p>Relatórios agregados de operação, sem abrir conversas ou mensagens de clientes.</p>
      </div>
      <div class="period-tabs">
        <button v-for="option in [7, 30, 90]" :key="option" :class="{ active: period === option }" @click="period = option; load()">
          {{ option }}d
        </button>
      </div>
    </header>

    <div class="super-admin-kpis">
      <article><span>Empresas ativas</span><strong>{{ data?.kpis.activeCompanies ?? 0 }}</strong><small>{{ data?.kpis.companies ?? 0 }} cadastradas</small></article>
      <article><span>Agentes IA ativos</span><strong>{{ data?.kpis.activeAgents ?? 0 }}</strong><small>assistentes ligados</small></article>
      <article><span>WhatsApp conectado</span><strong>{{ data?.kpis.connectedWhatsapp ?? 0 }}</strong><small>instâncias ativas</small></article>
      <article><span>IA no período</span><strong>{{ data?.kpis.aiRate ?? 0 }}%</strong><small>uso agregado</small></article>
    </div>

    <section class="super-admin-panel">
      <div class="panel-title">
        <div>
          <h2>Volume agregado</h2>
          <p>Quantidade por dia para acompanhar limite e capacidade.</p>
        </div>
        <div class="chart-legend"><span></span> Mensagens <span class="blue"></span> Conversas</div>
      </div>
      <div class="bar-chart">
        <div v-for="item in data?.series || []" :key="item.day" class="bar-day">
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
const maxSeries = computed(() => Math.max(...(data.value?.series || []).flatMap((item: any) => [item.messages, item.conversations]), 1));

function formatDay(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

async function load() {
  data.value = await api.fetch(`/overview?period=${period.value}`);
}

onMounted(load);
</script>
