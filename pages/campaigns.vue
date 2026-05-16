<template>
  <div class="campaigns-page">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Campanhas</p>
        <h1 class="page-title">Envios em massa</h1>
        <p class="page-subtitle">Marketing via WhatsApp · {{ activeCount }} {{ activeCount === 1 ? 'campanha ativa' : 'campanhas ativas' }}</p>
      </div>
      <div class="page-actions">
        <Button variant="secondary" size="sm" @click="loadCampaigns">
          <Icon name="refresh" :size="16" />
          Atualizar
        </Button>
        <Button size="sm" @click="openNew">
          <Icon name="plus" :size="16" />
          Nova campanha
        </Button>
      </div>
    </div>

    <div class="campaigns-stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-brand-alpha); color: var(--ka-brand);">
          <Icon name="megaphone" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">{{ activeCount }}</div>
          <div class="stat-label">Campanhas ativas</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-success-alpha); color: var(--ka-success);">
          <Icon name="send" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">{{ sentLast7d.toLocaleString('pt-BR') }}</div>
          <div class="stat-label">Enviadas (7 dias)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-brand-alpha); color: var(--ka-brand);">
          <Icon name="reply" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">{{ responseRate }}%</div>
          <div class="stat-label">Taxa de resposta</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-warning-alpha); color: var(--ka-warning);">
          <Icon name="dollar" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">{{ formatMoney(attributedRevenue) }}</div>
          <div class="stat-label">Receita atribuída</div>
        </div>
      </div>
    </div>

    <div class="campaigns-list">
      <div v-if="loading" class="campaigns-list-skeletons">
        <Skeleton v-for="i in 5" :key="i" height="80px" rounded="md" />
      </div>

      <template v-else-if="campaigns.length">
        <div
          v-for="(camp, idx) in campaigns"
          :key="camp.id"
          class="campaign-row"
          :class="{ 'campaign-row-last': idx === campaigns.length - 1 }"
        >
          <div class="campaign-icon" :style="{ background: campColor(camp.status) + '22', color: campColor(camp.status) }">
            <Icon name="megaphone" :size="18" />
          </div>

          <div class="campaign-info">
            <div class="campaign-name">{{ camp.name }}</div>
            <div class="campaign-meta">
              {{ camp.scheduledAt ? formatDateTime(camp.scheduledAt) : formatDate(camp.createdAt) }}
              · {{ camp.channel || 'WhatsApp' }}
            </div>
          </div>

          <div class="campaign-metrics">
            <div class="campaign-metric">
              <div class="campaign-metric-value">{{ (camp._count?.recipients ?? camp.recipientCount ?? 0).toLocaleString('pt-BR') }}</div>
              <div class="campaign-metric-label">Enviadas</div>
            </div>
            <div class="campaign-metric">
              <div class="campaign-metric-value">{{ (camp.readCount ?? 0).toLocaleString('pt-BR') }}</div>
              <div class="campaign-metric-label">Lidas</div>
            </div>
            <div class="campaign-metric">
              <div class="campaign-metric-value">{{ (camp.replyCount ?? 0).toLocaleString('pt-BR') }}</div>
              <div class="campaign-metric-label">Respostas</div>
            </div>
          </div>

          <Badge :variant="statusVariant(camp.status)" size="sm" style="min-width: 90px; justify-content: center;">
            {{ statusLabel(camp.status) }}
          </Badge>

          <div class="campaign-actions">
            <button
              v-if="camp.status === 'DRAFT'"
              class="campaign-action-btn"
              title="Enviar campanha"
              @click="scheduleCampaign(camp)"
            >
              <Icon name="send" :size="16" />
            </button>
            <button
              v-if="['DRAFT', 'SCHEDULED'].includes(camp.status)"
              class="campaign-action-btn campaign-action-danger"
              title="Cancelar"
              @click="cancelCampaign(camp)"
            >
              <Icon name="x" :size="16" />
            </button>
            <button class="campaign-action-btn" title="Mais opções">
              <Icon name="moreH" :size="16" />
            </button>
          </div>
        </div>
      </template>

      <EmptyState v-else icon="megaphone" title="Nenhuma campanha ainda" description="Crie sua primeira campanha para enviar mensagens em massa." />
    </div>

    <Modal :open="showNew" title="Nova campanha" @close="showNew = false">
      <form class="modal-form" @submit.prevent="createCampaign">
        <div class="form-group">
          <label class="form-label">Nome da campanha *</label>
          <input v-model="form.name" class="form-input" type="text" placeholder="Ex: Promo Black Friday" required />
        </div>
        <div class="form-group">
          <label class="form-label">Mensagem *</label>
          <textarea v-model="form.message" class="form-textarea" rows="4" placeholder="Olá {nome}, temos uma oferta especial para você..." required />
          <p class="form-hint">Use {nome} para personalizar com o nome do contato.</p>
        </div>
        <div class="form-group">
          <label class="form-label">Público-alvo *</label>
          <select v-model="form.targetType" class="form-input" required>
            <option value="ALL_CONTACTS">Todos os contatos</option>
            <option value="STAGE">Etapa do CRM</option>
          </select>
        </div>
        <div v-if="form.targetType === 'STAGE'" class="form-group">
          <label class="form-label">Etapa do CRM *</label>
          <select v-model="form.stageId" class="form-input" :required="form.targetType === 'STAGE'">
            <option value="">Selecionar etapa</option>
            <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Canal</label>
          <select v-model="form.channel" class="form-input">
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Agendamento (opcional)</label>
          <input v-model="form.scheduledAt" class="form-input" type="datetime-local" />
          <p class="form-hint">Deixe vazio para salvar como rascunho e enviar manualmente.</p>
        </div>
        <p v-if="formError" class="form-alert">{{ formError }}</p>
        <div class="modal-actions">
          <Button variant="secondary" type="button" @click="showNew = false">Cancelar</Button>
          <Button type="submit" :loading="formLoading">
            {{ formLoading ? "Salvando..." : "Criar campanha" }}
          </Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const api = useApi();
const loading   = ref(true);
const campaigns = ref<any[]>([]);

const CAMP_COLORS: Record<string, string> = {
  COMPLETED: "#10B981",
  RUNNING:   "#2D5BFF",
  SCHEDULED: "#F59E0B",
  DRAFT:     "#94A3B8",
  FAILED:    "#EF4444",
  CANCELLED: "#94A3B8",
  PAUSED:    "#F59E0B",
};

function campColor(status: string) {
  return CAMP_COLORS[status] || "#94A3B8";
}

const activeCount = computed(() => campaigns.value.filter(c => ["RUNNING", "SCHEDULED"].includes(c.status)).length);

const sentLast7d = computed(() => {
  const cutoff = Date.now() - 7 * 86400_000;
  return campaigns.value
    .filter(c => c.status === "COMPLETED" && new Date(c.updatedAt || c.createdAt).getTime() > cutoff)
    .reduce((s, c) => s + (c._count?.recipients ?? c.recipientCount ?? 0), 0);
});

const totalRecipients = computed(() => campaigns.value.reduce((s, c) => s + (c._count?.recipients ?? c.recipientCount ?? 0), 0));
const totalReplies    = computed(() => campaigns.value.reduce((s, c) => s + (c.replyCount ?? 0), 0));
const attributedRevenue = computed(() => campaigns.value.reduce((s, c) => s + (c.attributedRevenueCents ?? 0), 0));

const responseRate = computed(() => {
  if (!totalRecipients.value) return 0;
  return Math.round((totalReplies.value / totalRecipients.value) * 100);
});

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Rascunho", SCHEDULED: "Agendada", RUNNING: "Enviando",
    COMPLETED: "Concluída", FAILED: "Falhou", CANCELLED: "Cancelada", PAUSED: "Pausada",
  };
  return map[status] ?? status;
}

function statusVariant(status: string) {
  if (status === "COMPLETED")                         return "success";
  if (status === "FAILED")                            return "destructive";
  if (status === "RUNNING" || status === "SCHEDULED") return "default";
  if (status === "PAUSED")                            return "warning";
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

async function scheduleCampaign(campaign: any) {
  if (!confirm(`Enviar a campanha "${campaign.name}" agora?`)) return;
  try {
    await api.fetch<any>(`/campaigns/${campaign.id}/send`, { method: "POST" });
    await loadCampaigns();
  } catch (e: any) {
    alert(e?.data?.message || "Erro ao enviar campanha.");
  }
}

async function cancelCampaign(campaign: any) {
  if (!confirm(`Cancelar a campanha "${campaign.name}"?`)) return;
  const idx = campaigns.value.findIndex(c => c.id === campaign.id);
  if (idx !== -1) campaigns.value[idx] = { ...campaigns.value[idx], status: "CANCELLED" };
}

const showNew     = ref(false);
const formLoading = ref(false);
const formError   = ref("");
const stages      = ref<any[]>([]);

const form = reactive({
  name: "", message: "", targetType: "ALL_CONTACTS" as "ALL_CONTACTS" | "STAGE",
  stageId: "", channel: "WHATSAPP", scheduledAt: "",
});

async function openNew() {
  Object.assign(form, { name: "", message: "", targetType: "ALL_CONTACTS", stageId: "", channel: "WHATSAPP", scheduledAt: "" });
  formError.value = "";
  showNew.value = true;
  if (!stages.value.length) {
    try { const res = await api.fetch<any>("/crm/stages"); stages.value = res.stages || []; }
    catch { stages.value = []; }
  }
}

async function createCampaign() {
  formError.value = "";
  formLoading.value = true;
  try {
    const body: any = { name: form.name, message: form.message, targetType: form.targetType, channel: form.channel };
    if (form.targetType === "STAGE" && form.stageId) body.stageId = form.stageId;
    if (form.scheduledAt) body.scheduledAt = new Date(form.scheduledAt).toISOString();
    const res = await api.fetch<any>("/campaigns", { method: "POST", body: JSON.stringify(body) });
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


