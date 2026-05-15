<template>
  <NuxtLayout name="default">
    <div class="ka-page" style="max-width:960px">

      <!-- Header -->
      <div class="page-header">
        <div>
          <p class="page-header-eyebrow">Configurações</p>
          <h1>Faturamento</h1>
          <p class="page-header-description">Informações de assinatura e histórico de cobranças.</p>
        </div>
        <div class="page-header-actions">
          <Button variant="secondary" size="sm" @click="navigateTo('/settings')">
            <ChevronLeft class="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="display:grid;grid-template-columns:340px 1fr;gap:16px">
        <Skeleton height="220px" style="border-radius:var(--ka-r-lg)" />
        <Skeleton height="220px" style="border-radius:var(--ka-r-lg)" />
      </div>

      <!-- Loaded -->
      <div v-else style="display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start">

        <!-- Subscription card -->
        <div class="dashboard-panel" style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div>
              <p style="font-size:13px;font-weight:600;color:var(--ka-fg-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Plano atual</p>
              <p style="font-size:18px;font-weight:700;color:var(--ka-fg)">{{ company?.subscription?.plan?.name || "Sem plano ativo" }}</p>
            </div>
            <span
              style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:600;flex-shrink:0"
              :style="subscriptionStyle"
            >
              <span style="width:6px;height:6px;border-radius:50%" :style="subscriptionDotStyle" />
              {{ subscriptionStatus.label }}
            </span>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ka-gray-50)">
              <span style="font-size:13px;color:var(--ka-fg-muted)">Status</span>
              <strong style="font-size:13px;color:var(--ka-fg)">{{ subscriptionStatus.label }}</strong>
            </div>
            <div v-if="company?.subscription?.currentPeriodEnd" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ka-gray-50)">
              <span style="font-size:13px;color:var(--ka-fg-muted)">Próxima renovação</span>
              <strong style="font-size:13px;color:var(--ka-fg)">{{ formatDate(company.subscription.currentPeriodEnd) }}</strong>
            </div>
            <div v-if="company?.createdAt" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ka-gray-50)">
              <span style="font-size:13px;color:var(--ka-fg-muted)">Cliente desde</span>
              <strong style="font-size:13px;color:var(--ka-fg)">{{ formatDate(company.createdAt) }}</strong>
            </div>
          </div>
        </div>

        <!-- Invoices panel -->
        <div class="dashboard-panel" style="overflow:hidden">
          <div class="dashboard-panel-header">
            <div>
              <h2>Histórico de faturas</h2>
              <p>Cobranças processadas na sua conta.</p>
            </div>
          </div>

          <div v-if="invoices.length === 0" style="padding:40px 24px;text-align:center">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--ka-gray-100);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
              <Receipt class="h-5 w-5" style="color:var(--ka-fg-muted)" />
            </div>
            <p style="font-size:14px;font-weight:600;color:var(--ka-fg);margin-bottom:4px">Nenhuma fatura</p>
            <p style="font-size:13px;color:var(--ka-fg-muted)">Quando houver cobranças, elas aparecerão aqui.</p>
          </div>

          <table v-else style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:1px solid var(--ka-border)">
                <th v-for="col in columns" :key="col.key"
                  style="padding:10px 20px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ka-fg-muted)">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in invoiceRows" :key="i" style="border-bottom:1px solid var(--ka-divider)">
                <td style="padding:11px 20px;color:var(--ka-fg);font-family:monospace;font-size:12px">{{ row.id }}</td>
                <td style="padding:11px 20px;color:var(--ka-fg);font-weight:600">{{ row.amount }}</td>
                <td style="padding:11px 20px">
                  <span style="display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:var(--ka-gray-100);color:var(--ka-fg-muted)">
                    {{ row.status }}
                  </span>
                </td>
                <td style="padding:11px 20px;color:var(--ka-fg-muted)">{{ row.createdAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ChevronLeft, Receipt } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const company = ref<any>(null);
const invoices = ref<any[]>([]);

const columns = [
  { key: "id",        label: "Fatura" },
  { key: "amount",    label: "Valor" },
  { key: "status",    label: "Status" },
  { key: "createdAt", label: "Criada em" },
];

const subscriptionStatus = computed(() => {
  const s = String(company.value?.subscription?.status || "").toUpperCase();
  if (s === "ACTIVE")   return { label: "Ativa",      variant: "success" };
  if (s === "TRIAL")    return { label: "Trial",       variant: "warning" };
  if (s === "PAST_DUE") return { label: "Pendente",    variant: "warning" };
  if (s === "CANCELED") return { label: "Cancelada",   variant: "neutral" };
  return { label: "Sem assinatura", variant: "neutral" };
});

const subscriptionStyle = computed(() => {
  const v = subscriptionStatus.value.variant;
  if (v === "success") return "background:var(--ka-success-bg,#f0fdf4);color:var(--ka-success)";
  if (v === "warning") return "background:#fef3c7;color:#92400e";
  return "background:var(--ka-gray-100);color:var(--ka-fg-muted)";
});

const subscriptionDotStyle = computed(() => {
  const v = subscriptionStatus.value.variant;
  if (v === "success") return "background:var(--ka-success)";
  if (v === "warning") return "background:#f59e0b";
  return "background:var(--ka-fg-muted)";
});

const invoiceRows = computed(() =>
  invoices.value.map((invoice) => ({
    id:        invoice.stripeInvoiceId || invoice.id,
    amount:    typeof invoice.amountCents === "number" ? formatMoney(invoice.amountCents) : "--",
    status:    statusLabel(invoice.status || "UNKNOWN"),
    createdAt: formatDate(invoice.createdAt),
  }))
);

onMounted(async () => {
  try {
    // Company data always loads (real endpoint)
    const companyData = await api.fetch<any>("/companies/me");
    company.value = companyData.company;

    // Billing endpoints may not exist yet — fail silently
    try {
      const [customerData, invoiceData] = await Promise.all([
        api.fetch<any>("/billing/customer"),
        api.fetch<any>("/billing/invoices"),
      ]);
      invoices.value = unwrapList(invoiceData, ["invoices"]);
    } catch {
      // billing API not yet implemented — show empty invoices
    }
  } catch {
    // company data failed — rare, ignore
  } finally {
    loading.value = false;
  }
});
</script>
