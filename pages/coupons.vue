<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="Cupons" description="Cupons reais para campanhas, afiliados e conversas.">
        <template #actions><Button variant="secondary" size="sm" @click="loadCoupons"><RefreshCw class="h-4 w-4" />Atualizar</Button></template>
      </PageHeader>
      <Table :columns="columns" :rows="rows" :loading="loading" empty-title="Nenhum cupom cadastrado">
        <template #cell-isActive="{ row }"><Badge :variant="row.raw.isActive ? 'success' : 'neutral'" size="sm" dot>{{ row.isActive }}</Badge></template>
      </Table>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
definePageMeta({ layout: false, middleware: "auth" });
const api = useApi();
const loading = ref(true);
const coupons = ref<any[]>([]);
const columns = [
  { key: "code", label: "CÃ³digo" },
  { key: "type", label: "Tipo" },
  { key: "value", label: "Valor" },
  { key: "isActive", label: "Status" },
  { key: "validUntil", label: "VÃ¡lido atÃ©" },
];
const rows = computed(() => coupons.value.map(c => ({ code: c.code, type: c.type, value: c.type === "PERCENT" ? `${c.value}%` : formatMoney(c.value), isActive: c.isActive ? "Ativo" : "Inativo", validUntil: formatDate(c.validUntil), raw: c })));
async function loadCoupons() {
  loading.value = true;
  try { coupons.value = unwrapList(await api.fetch<any>("/coupons?limit=100")); } finally { loading.value = false; }
}
onMounted(loadCoupons);
</script>
