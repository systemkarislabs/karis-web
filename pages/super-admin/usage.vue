<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Uso</p>
        <h1>Consumo sem conteúdo de clientes</h1>
        <p>Métricas agregadas para cobrança, limite e saúde da IA.</p>
      </div>
    </header>
    <div class="super-admin-kpis">
      <article><span>Mensagens no período</span><strong>{{ overview?.kpis.messagesInPeriod ?? 0 }}</strong><small>agregado global</small></article>
      <article><span>IA no período</span><strong>{{ overview?.kpis.aiMessagesInPeriod ?? 0 }}</strong><small>respostas geradas</small></article>
      <article><span>Contatos</span><strong>{{ overview?.kpis.contacts ?? 0 }}</strong><small>base total</small></article>
      <article><span>Negócios CRM</span><strong>{{ overview?.kpis.deals ?? 0 }}</strong><small>pipeline total</small></article>
    </div>
    <section class="super-admin-panel">
      <h2>Empresas por consumo</h2>
      <div v-for="item in overview?.topCompanies || []" :key="item.company.id" class="top-company-row">
        <strong>{{ item.company.name }}</strong>
        <span>{{ item.messages }} mensagens agregadas</span>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "super-admin", middleware: "super-admin" });
const api = useAdminApi();
const overview = ref<any | null>(null);
onMounted(async () => {
  overview.value = await api.fetch("/overview?period=30");
});
</script>
