<template>
  <NuxtLayout name="default">
    <div class="contacts-v2">
      <!-- Header -->
      <div class="contacts-v2-header">
        <div>
          <p class="dashboard-eyebrow">Campanhas</p>
          <h1 style="font-family:var(--ka-font-display);font-size:26px;font-weight:700;letter-spacing:-0.01em;color:var(--ka-fg);margin:2px 0 4px;">
            Envios em massa
          </h1>
          <p style="font-size:14px;color:var(--ka-fg-muted);">
            Marketing via WhatsApp · {{ activeCount }} {{ activeCount === 1 ? 'campanha ativa' : 'campanhas ativas' }}
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <Button variant="secondary" size="sm" @click="loadCampaigns">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm" @click="openNew">
            <Plus class="h-4 w-4" />
            Nova campanha
          </Button>
        </div>
      </div>

      <!-- 4 Stat cards -->
      <div class="campaign-stat-grid">
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-brand-50);color:var(--ka-brand);">
            <Megaphone class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">{{ activeCount }}</div>
            <div class="lbl">Campanhas ativas</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-success-bg);color:var(--ka-success);">
            <Send class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">{{ sentLast7d.toLocaleString('pt-BR') }}</div>
            <div class="lbl">Enviadas (7 dias)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-bot-bg);color:var(--ka-bot);">
            <Reply class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">{{ responseRate }}%</div>
            <div class="lbl">Taxa de resposta</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-warning-bg);color:var(--ka-warning);">
            <DollarSign class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">{{ formatMoney(attributedRevenue) }}</div>
            <div class="lbl">Receita atribuída</div>
          </div>
        </div>
      </div>

      <!-- Campaign list -->
      <div class="card" style="padding:0;background:var(--ka-surface);border:1px solid var(--ka-border);border-radius:14px;overflow:hidden;box-shadow:var(--ka-shadow-sm);">
        <div v-if="loading" class="p-4 space-y-3">
          <Skeleton v-for="i in 5" :key="i" height="5rem" />
        </div>

        <template v-else-if="campaigns.length">
          <div
            v-for="(camp, idx) in campaigns"
            :key="camp.id"
            style="display:flex;align-items:center;gap:14px;padding:16px 20px;"
            :style="{ borderBottom: idx < campaigns.length - 1 ? '1px solid var(--ka-divider)' : 'none' }"
          >
            <!-- Icon -->
            <div
              style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
              :style="{ background: campColor(camp.status) + '22', color: campColor(camp.status) }"
            >
              <Megaphone class="h-4.5 w-4.5" style="width:18px;height:18px;" />
            </div>

            <!-- Name + date -->
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:14px;color:var(--ka-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                {{ camp.name }}
              </div>
              <div style="font-size:12px;color:var(--ka-fg-muted);margin-top:2px;">
                {{ camp.scheduledAt ? formatDateTime(camp.scheduledAt) : formatDate(camp.createdAt) }}
                · {{ camp.channel || 'WhatsApp' }}
              </div>
            </div>

            <!-- Metrics -->
            <div style="display:flex;gap:24px;font-size:12px;color:var(--ka-fg-2);">
              <div style="text-align:center;min-width:52px;">
                <div style="font-family:var(--ka-font-display);font-weight:700;font-size:16px;color:var(--ka-fg);">
                  {{ (camp._count?.recipients ?? camp.recipientCount ?? 0).toLocaleString('pt-BR') }}
                </div>
                <div>Enviadas</div>
              </div>
              <div style="text-align:center;min-width:52px;">
                <div style="font-family:var(--ka-font-display);font-weight:700;font-size:16px;color:var(--ka-fg);">
                  {{ (camp.readCount ?? 0).toLocaleString('pt-BR') }}
                </div>
                <div>Lidas</div>
              </div>
              <div style="text-align:center;min-width:52px;">
                <div style="font-family:var(--ka-font-display);font-weight:700;font-size:16px;color:var(--ka-fg);">
                  {{ (camp.replyCount ?? 0).toLocaleString('pt-BR') }}
                </div>
                <div>Respostas</div>
              </div>
            </div>

            <!-- Status badge -->
            <Badge :variant="statusVariant(camp.status)" size="sm" dot style="min-width:90px;justify-content:center;">
              {{ statusLabel(camp.status) }}
            </Badge>

            <!-- Actions -->
            <div style="display:flex;gap:4px;flex-shrink:0;">
              <button
                v-if="camp.status === 'DRAFT'"
                class="icon-action"
                title="Enviar campanha"
                @click="scheduleCampaign(camp)"
              >
                <Send class="h-4 w-4" />
              </button>
              <button
                v-if="['DRAFT', 'SCHEDULED'].includes(camp.status)"
                class="icon-action danger"
                title="Cancelar"
                @click="cancelCampaign(camp)"
              >
                <X class="h-4 w-4" />
              </button>
              <button class="icon-action" title="Mais opções">
                <MoreHorizontal class="h-4 w-4" />
              </button>
            </div>
          </div>
        </template>

        <div v-else class="p-10">
          <EmptyState :icon="Megaphone" title="Nenhuma campanha ainda" description="Crie sua primeira campanha para enviar mensagens em massa." />
        </div>
      </div>

      <!-- Modal de criação -->
      <Modal :open="showNew" title="Nova campanha" @close="showNew = false">
        <form class="space-y-4" @submit.prevent="createCampaign">
          <div>
            <label class="field-label">Nome da campanha *</label>
            <input v-model="form.name" class="input-field" type="text" placeholder="Ex: Promo Black Friday" required />
          </div>
          <div>
            <label class="field-label">Mensagem *</label>
            <textarea v-model="form.message" class="input-field" rows="4" placeholder="Olá {nome}, temos uma oferta especial para você..." required style="resize:vertical;" />
            <p class="field-hint">Use {nome} para personalizar com o nome do contato.</p>
          </div>
          <div>
            <label class="field-label">Público-alvo *</label>
            <select v-model="form.targetType" class="input-field" required>
              <option value="ALL_CONTACTS">Todos os contatos</option>
              <option value="STAGE">Etapa do CRM</option>
            </select>
          </div>
          <div v-if="form.targetType === 'STAGE'">
            <label class="field-label">Etapa do CRM *</label>
            <select v-model="form.stageId" class="input-field" :required="form.targetType === 'STAGE'">
              <option value="">Selecionar etapa</option>
              <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
            </select>
          </div>
          <div>
            <label class="field-label">Canal</label>
            <select v-model="form.channel" class="input-field">
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
          <div>
            <label class="field-label">Agendamento (opcional)</label>
            <input v-model="form.scheduledAt" class="input-field" type="datetime-local" />
            <p class="field-hint">Deixe vazio para salvar como rascunho e enviar manualmente.</p>
          </div>
          <p v-if="formError" class="form-alert" role="alert">{{ formError }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" @click="showNew = false">Cancelar</Button>
            <Button type="submit" :loading="formLoading">
              {{ formLoading ? "Salvando..." : "Criar campanha" }}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { DollarSign, Megaphone, MoreHorizontal, Plus, RefreshCw, Reply, Send, X } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

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

<style scoped>
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--ka-fg);
  margin-bottom: 6px;
}
.field-hint {
  font-size: 12px;
  color: var(--ka-fg-muted);
  margin-top: 4px;
}
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  color: var(--ka-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.14s, background 0.14s;
}
.icon-action:hover        { background: var(--ka-gray-100); color: var(--ka-fg); }
.icon-action.danger:hover { background: var(--ka-danger-bg); color: var(--ka-danger); }
</style>
