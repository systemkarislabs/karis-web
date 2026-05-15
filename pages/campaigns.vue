<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="Campanhas" description="Envios em massa para contatos e etapas do CRM.">
        <template #actions>
          <Button variant="secondary" size="sm" @click="loadCampaigns">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm" @click="openNew">
            <Plus class="h-4 w-4" />
            Nova campanha
          </Button>
        </template>
      </PageHeader>

      <!-- Lista de campanhas -->
      <Table
        :columns="columns"
        :rows="rows"
        :loading="loading"
        empty-title="Nenhuma campanha ainda"
        empty-description="Crie sua primeira campanha para enviar mensagens em massa."
      >
        <template #cell-status="{ row }">
          <Badge :variant="statusVariant(row.raw.status)" size="sm" dot>
            {{ statusLabel(row.raw.status) }}
          </Badge>
        </template>
        <template #cell-actions="{ row }">
          <button
            v-if="row.raw.status === 'DRAFT'"
            class="table-action"
            title="Enviar campanha"
            @click="scheduleCampaign(row.raw)"
          >
            <Send class="h-4 w-4" />
          </button>
          <button
            v-if="['DRAFT', 'SCHEDULED'].includes(row.raw.status)"
            class="table-action text-destructive"
            title="Cancelar"
            @click="cancelCampaign(row.raw)"
          >
            <X class="h-4 w-4" />
          </button>
        </template>
      </Table>

      <!-- Modal de criação -->
      <Modal :open="showNew" title="Nova campanha" @close="showNew = false">
        <form class="space-y-4" @submit.prevent="createCampaign">
          <div>
            <label class="field-label">Nome da campanha *</label>
            <input
              v-model="form.name"
              class="input"
              type="text"
              placeholder="Ex: Promo Black Friday"
              required
            />
          </div>

          <div>
            <label class="field-label">Mensagem *</label>
            <textarea
              v-model="form.message"
              class="input"
              rows="4"
              placeholder="Olá {nome}, temos uma oferta especial para você..."
              required
            />
            <p class="field-hint">Use {nome} para personalizar com o nome do contato.</p>
          </div>

          <div>
            <label class="field-label">Público-alvo *</label>
            <select v-model="form.targetType" class="input" required>
              <option value="ALL_CONTACTS">Todos os contatos</option>
              <option value="STAGE">Etapa do CRM</option>
            </select>
          </div>

          <div v-if="form.targetType === 'STAGE'">
            <label class="field-label">Etapa do CRM *</label>
            <select v-model="form.stageId" class="input" :required="form.targetType === 'STAGE'">
              <option value="">Selecionar etapa</option>
              <option v-for="stage in stages" :key="stage.id" :value="stage.id">
                {{ stage.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="field-label">Canal</label>
            <select v-model="form.channel" class="input">
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>

          <div>
            <label class="field-label">Agendamento (opcional)</label>
            <input v-model="form.scheduledAt" class="input" type="datetime-local" />
            <p class="field-hint">Deixe vazio para salvar como rascunho e enviar manualmente.</p>
          </div>

          <p v-if="formError" class="form-alert" role="alert">{{ formError }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" @click="showNew = false">Cancelar</Button>
            <Button type="submit" :disabled="formLoading">
              <LoaderCircle v-if="formLoading" class="h-4 w-4 spin" />
              {{ formLoading ? "Salvando..." : "Criar campanha" }}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { LoaderCircle, Plus, RefreshCw, Send, X } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();

// ── Listagem ───────────────────────────────────────
const loading = ref(true);
const campaigns = ref<any[]>([]);

const columns = [
  { key: "name",       label: "Campanha",       sortable: true },
  { key: "channel",    label: "Canal" },
  { key: "recipients", label: "Destinatários" },
  { key: "status",     label: "Status" },
  { key: "scheduledAt",label: "Agendada para" },
  { key: "createdAt",  label: "Criada em" },
  { key: "actions",    label: "" },
];

const rows = computed(() =>
  campaigns.value.map((c) => ({
    name:        c.name,
    channel:     c.channel || "WhatsApp",
    recipients:  c._count?.recipients ?? c.recipientCount ?? 0,
    status:      statusLabel(c.status),
    scheduledAt: c.scheduledAt ? formatDateTime(c.scheduledAt) : "—",
    createdAt:   formatDate(c.createdAt),
    raw: c,
  }))
);

function statusVariant(status: string) {
  if (status === "COMPLETED")                           return "success";
  if (status === "FAILED")                              return "destructive";
  if (status === "RUNNING" || status === "SCHEDULED")   return "default";
  if (status === "PAUSED")                              return "warning";
  return "neutral";
}

async function loadCampaigns() {
  loading.value = true;
  try {
    campaigns.value = unwrapList(await api.fetch<any>("/campaigns?limit=100"), ["campaigns"]);
  } catch {
    campaigns.value = [];
  } finally {
    loading.value = false;
  }
}

// ── Ações inline ──────────────────────────────────
async function scheduleCampaign(campaign: any) {
  if (!confirm(`Enviar a campanha "${campaign.name}" agora?`)) return;
  try {
    const updated = await api.fetch<any>(`/campaigns/${campaign.id}/send`, { method: "POST" });
    const idx = campaigns.value.findIndex((c) => c.id === campaign.id);
    if (idx !== -1) campaigns.value[idx] = updated.campaign || updated;
    await loadCampaigns();
  } catch (e: any) {
    alert(e?.data?.message || "Erro ao enviar campanha.");
  }
}

async function cancelCampaign(campaign: any) {
  if (!confirm(`Cancelar a campanha "${campaign.name}"?`)) return;
  try {
    // marca como cancelada localmente enquanto não há endpoint de cancel
    const idx = campaigns.value.findIndex((c) => c.id === campaign.id);
    if (idx !== -1) campaigns.value[idx] = { ...campaigns.value[idx], status: "CANCELLED" };
  } catch (e: any) {
    alert(e?.data?.message || "Erro ao cancelar campanha.");
  }
}

// ── Criação ───────────────────────────────────────
const showNew    = ref(false);
const formLoading = ref(false);
const formError  = ref("");
const stages     = ref<any[]>([]);

const form = reactive({
  name:        "",
  message:     "",
  targetType:  "ALL_CONTACTS" as "ALL_CONTACTS" | "STAGE",
  stageId:     "",
  channel:     "WHATSAPP",
  scheduledAt: "",
});

async function openNew() {
  Object.assign(form, { name: "", message: "", targetType: "ALL_CONTACTS", stageId: "", channel: "WHATSAPP", scheduledAt: "" });
  formError.value = "";
  showNew.value = true;
  if (!stages.value.length) {
    try {
      const res = await api.fetch<any>("/crm/stages");
      stages.value = res.stages || [];
    } catch { stages.value = []; }
  }
}

async function createCampaign() {
  formError.value = "";
  formLoading.value = true;
  try {
    const body: any = {
      name:       form.name,
      message:    form.message,
      targetType: form.targetType,
      channel:    form.channel,
    };
    if (form.targetType === "STAGE" && form.stageId) body.stageId = form.stageId;
    if (form.scheduledAt) body.scheduledAt = new Date(form.scheduledAt).toISOString();

    const res = await api.fetch<any>("/campaigns", {
      method: "POST",
      body: JSON.stringify(body),
    });
    campaigns.value.unshift(res.campaign || res);
    showNew.value = false;
  } catch (e: any) {
    formError.value = e?.data?.message || "Erro ao criar campanha. Tente novamente.";
  } finally {
    formLoading.value = false;
  }
}

onMounted(loadCampaigns);
</script>

<style scoped>
.field-hint {
  font-size: 0.75rem;
  color: var(--ka-fg-muted);
  margin-top: 0.25rem;
}
.table-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: var(--ka-r-sm);
  color: var(--ka-fg-muted);
  transition: color 0.15s, background 0.15s;
}
.table-action:hover {
  color: var(--ka-fg);
  background: var(--ka-gray-100);
}
.table-action.text-destructive:hover {
  color: var(--ka-danger);
  background: var(--ka-danger-soft);
}
</style>
