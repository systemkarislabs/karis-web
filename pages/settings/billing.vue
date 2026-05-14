<template>
  <NuxtLayout name="default">
    <section class="ka-page space-y-6">
      <PageHeader eyebrow="Configuracoes" title="Faturamento" description="Assinatura e faturas carregadas da API de billing.">
        <template #actions>
          <NuxtLink to="/settings" class="btn-ghost inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold">
            <ChevronLeft class="h-4 w-4" />
            Voltar
          </NuxtLink>
        </template>
      </PageHeader>

      <div v-if="loading" class="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Skeleton class="h-56" />
        <Skeleton class="h-56" />
      </div>

      <EmptyState v-else-if="error" :icon="AlertCircle" title="Billing indisponivel" :description="error" />

      <div v-else class="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card padding="lg" class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-[--ka-fg]">Assinatura</p>
              <p class="text-sm text-[--ka-fg-muted]">{{ company?.subscription?.plan?.name || "Sem plano ativo" }}</p>
            </div>
            <Badge :variant="subscriptionStatus.variant" dot>{{ subscriptionStatus.label }}</Badge>
          </div>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-[--ka-fg-muted]">Cliente</dt>
              <dd class="max-w-44 truncate font-mono text-[--ka-fg]">{{ customer?.stripeCustomerId || customer?.id || "Nao criado" }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[--ka-fg-muted]">Criado em</dt>
              <dd class="text-[--ka-fg]">{{ customer?.createdAt ? formatDate(customer.createdAt) : "--" }}</dd>
            </div>
          </dl>
        </Card>

        <Card padding="none" class="overflow-hidden">
          <Table :columns="columns" :rows="invoiceRows" empty-title="Nenhuma fatura encontrada" empty-description="Quando houver cobrancas, elas aparecerao aqui." />
        </Card>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { AlertCircle, ChevronLeft } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const error = ref("");
const company = ref<any>(null);
const customer = ref<any>(null);
const invoices = ref<any[]>([]);

const columns = [
  { key: "id", label: "Fatura" },
  { key: "amount", label: "Valor" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Criada em" },
];

const subscriptionStatus = computed(() => {
  const status = String(company.value?.subscription?.status || "").toUpperCase();
  if (!status) return { label: "Sem assinatura", variant: "neutral" as const };
  if (status === "ACTIVE") return { label: "Ativa", variant: "success" as const };
  if (status === "PAST_DUE") return { label: "Pendente", variant: "warning" as const };
  return { label: statusLabel(status), variant: "neutral" as const };
});

const invoiceRows = computed(() =>
  invoices.value.map((invoice) => ({
    id: invoice.stripeInvoiceId || invoice.id,
    amount: typeof invoice.amountCents === "number" ? formatMoney(invoice.amountCents / 100) : "--",
    status: statusLabel(invoice.status || "UNKNOWN"),
    createdAt: invoice.createdAt ? formatDate(invoice.createdAt) : "--",
  })),
);

onMounted(async () => {
  try {
    const [companyData, customerData, invoiceData] = await Promise.all([
      api.fetch<any>("/companies/me"),
      api.fetch<any>("/billing/customer"),
      api.fetch<any>("/billing/invoices"),
    ]);
    company.value = companyData.company;
    customer.value = customerData.customer;
    invoices.value = unwrapList(invoiceData, ["invoices"]);
  } catch (err: any) {
    error.value = err?.data?.message || "Nao foi possivel carregar faturamento.";
  } finally {
    loading.value = false;
  }
});
</script>
