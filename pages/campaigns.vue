<template>
  <div class="camp-page">
    <!-- Header -->
    <div class="camp-header">
      <div>
        <div class="camp-eyebrow">Campanhas</div>
        <h1 class="camp-title">Campanhas</h1>
        <p class="camp-subtitle">Marketing via WhatsApp · {{ activeCount }} {{ activeCount === 1 ? 'campanha ativa' : 'campanhas ativas' }}</p>
      </div>
      <button class="btn primary sm" type="button" @click="openNew">
        <Icon name="plus" :size="14" />
        Nova campanha
      </button>
    </div>

    <!-- Stats -->
    <div class="camp-stats">
      <div class="camp-stat">
        <div class="camp-stat-icon" style="background:rgba(45,91,255,0.1);color:#2D5BFF;">
          <Icon name="megaphone" :size="18" />
        </div>
        <div>
          <div class="camp-stat-value">{{ activeCount }}</div>
          <div class="camp-stat-label">Campanhas ativas</div>
        </div>
      </div>
      <div class="camp-stat">
        <div class="camp-stat-icon" style="background:rgba(16,185,129,0.1);color:#10B981;">
          <Icon name="send" :size="18" />
        </div>
        <div>
          <div class="camp-stat-value">{{ sentLast7d.toLocaleString('pt-BR') }}</div>
          <div class="camp-stat-label">Enviadas (7 dias)</div>
        </div>
      </div>
      <div class="camp-stat">
        <div class="camp-stat-icon" style="background:rgba(139,92,246,0.1);color:#7C3AED;">
          <Icon name="reply" :size="18" />
        </div>
        <div>
          <div class="camp-stat-value">{{ responseRate }}%</div>
          <div class="camp-stat-label">Taxa de resposta</div>
        </div>
      </div>
      <div class="camp-stat">
        <div class="camp-stat-icon" style="background:rgba(245,158,11,0.1);color:#F59E0B;">
          <Icon name="dollar" :size="18" />
        </div>
        <div>
          <div class="camp-stat-value">{{ formatMoney(attributedRevenue) }}</div>
          <div class="camp-stat-label">Receita atribuída</div>
        </div>
      </div>
    </div>

    <!-- Campaign list -->
    <div class="camp-list">
      <!-- Skeletons -->
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="camp-row" style="pointer-events:none;">
          <div style="width:38px;height:38px;border-radius:50%;background:var(--ka-gray-100);flex-shrink:0;animation:camp-pulse 1.5s infinite;" />
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <div style="height:14px;width:45%;background:var(--ka-gray-100);border-radius:4px;animation:camp-pulse 1.5s infinite;" />
            <div style="height:11px;width:30%;background:var(--ka-gray-100);border-radius:4px;animation:camp-pulse 1.5s infinite;" />
          </div>
          <div v-for="j in 3" :key="j" style="width:44px;height:36px;background:var(--ka-gray-100);border-radius:6px;animation:camp-pulse 1.5s infinite;" />
        </div>
      </template>

      <template v-else-if="campaigns.length">
        <div
          v-for="(camp, idx) in campaigns"
          :key="camp.id"
          class="camp-row"
          :class="{ last: idx === campaigns.length - 1 }"
        >
          <!-- Icon -->
          <div class="camp-icon" :style="{ background: campColor(camp.status) + '18', color: campColor(camp.status) }">
            <Icon name="megaphone" :size="17" />
          </div>

          <!-- Info -->
          <div class="camp-info">
            <div class="camp-name">{{ camp.name }}</div>
            <div class="camp-meta">{{ camp.scheduledAt ? formatDateTime(camp.scheduledAt) : relativeTime(camp.createdAt) }}</div>
          </div>

          <!-- Metrics -->
          <div class="camp-metrics">
            <div class="camp-metric">
              <div class="camp-metric-val">{{ (camp._count?.recipients ?? camp.recipientCount ?? 0).toLocaleString('pt-BR') }}</div>
              <div class="camp-metric-lbl">Enviadas</div>
            </div>
            <div class="camp-metric">
              <div class="camp-metric-val">{{ (camp.readCount ?? 0).toLocaleString('pt-BR') }}</div>
              <div class="camp-metric-lbl">Lidas</div>
            </div>
            <div class="camp-metric">
              <div class="camp-metric-val">{{ (camp.replyCount ?? 0).toLocaleString('pt-BR') }}</div>
              <div class="camp-metric-lbl">Respostas</div>
            </div>
          </div>

          <!-- Status badge (dot style) -->
          <div class="camp-status-badge">
            <span class="camp-status-dot" :style="{ background: campColor(camp.status) }" />
            {{ statusLabel(camp.status) }}
          </div>

          <!-- Actions -->
          <div class="camp-actions">
            <button
              v-if="camp.status === 'DRAFT'"
              class="icon-btn"
              style="width:30px;height:30px;border:0;background:transparent;"
              title="Enviar agora"
              @click="scheduleCampaign(camp)"
            >
              <Icon name="send" :size="14" />
            </button>
            <button
              v-if="['DRAFT', 'SCHEDULED'].includes(camp.status)"
              class="icon-btn"
              style="width:30px;height:30px;border:0;background:transparent;color:var(--ka-danger);"
              title="Cancelar"
              @click="cancelCampaign(camp)"
            >
              <Icon name="x" :size="14" />
            </button>
            <button
              class="icon-btn"
              style="width:30px;height:30px;border:0;background:transparent;font-size:16px;letter-spacing:1px;color:var(--ka-fg-muted);"
              title="Mais opções"
            >···</button>
          </div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else class="camp-empty">
        <Icon name="megaphone" :size="36" style="opacity:0.18;display:block;margin:0 auto 12px;" />
        <div style="font-size:15px;font-weight:500;margin-bottom:6px;">Nenhuma campanha ainda</div>
        <div style="font-size:13px;margin-bottom:16px;">Crie sua primeira campanha para enviar mensagens em massa.</div>
        <button class="btn primary sm" type="button" @click="openNew">
          <Icon name="plus" :size="14" />
          Nova campanha
        </button>
      </div>
    </div>

    <!-- New campaign modal -->
    <Teleport to="body">
      <div v-if="showNew" style="position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;">
        <button style="position:absolute;inset:0;background:rgba(0,0,0,0.4);border:none;cursor:pointer;" @click="showNew = false" />
        <div class="camp-modal" style="position:relative;">
          <div class="camp-modal-head">
            <h3>Nova campanha</h3>
            <button class="icon-btn" style="width:30px;height:30px;border:0;background:transparent;" @click="showNew = false">
              <Icon name="x" :size="16" />
            </button>
          </div>
          <form class="camp-modal-body" @submit.prevent="createCampaign">
            <div class="form-group">
              <label class="form-label">Nome da campanha *</label>
              <input v-model="form.name" class="form-input" type="text" placeholder="Ex: Promo Black Friday" required />
            </div>
            <div class="form-group">
              <label class="form-label">Mensagem *</label>
              <textarea v-model="form.message" class="form-input" style="height:110px;resize:vertical;padding:10px 12px;" placeholder="Olá {nome}, temos uma oferta especial para você..." required />
              <span style="font-size:12px;color:var(--ka-fg-muted);">Use {nome} para personalizar com o nome do contato.</span>
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
              <span style="font-size:12px;color:var(--ka-fg-muted);">Deixe vazio para salvar como rascunho e enviar manualmente.</span>
            </div>
            <p v-if="formError" style="font-size:13px;color:var(--ka-danger);margin:0;">{{ formError }}</p>
            <div style="display:flex;justify-content:flex-end;gap:8px;padding-top:4px;">
              <button class="btn secondary sm" type="button" @click="showNew = false">Cancelar</button>
              <button class="btn primary sm" type="submit" :disabled="formLoading">
                {{ formLoading ? 'Salvando…' : 'Criar campanha' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { formatMoney, formatDateTime, unwrapList } from '~/composables/useKarisData'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const toast = useToast()
const loading = ref(true)
const campaigns = ref<any[]>([])

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10B981',
  RUNNING:   '#2D5BFF',
  SCHEDULED: '#F59E0B',
  DRAFT:     '#94A3B8',
  FAILED:    '#EF4444',
  CANCELLED: '#94A3B8',
  PAUSED:    '#F59E0B',
}

function campColor(status: string) {
  return STATUS_COLORS[status] || '#94A3B8'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'rascunho', SCHEDULED: 'agendada', RUNNING: 'enviando',
    COMPLETED: 'enviada', FAILED: 'falhou', CANCELLED: 'cancelada', PAUSED: 'pausada',
  }
  return map[status] ?? status.toLowerCase()
}

function relativeTime(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  return `há ${d} dias`
}

const activeCount = computed(() => campaigns.value.filter(c => ['RUNNING', 'SCHEDULED'].includes(c.status)).length)

const sentLast7d = computed(() => {
  const cutoff = Date.now() - 7 * 86400_000
  return campaigns.value
    .filter(c => c.status === 'COMPLETED' && new Date(c.updatedAt || c.createdAt).getTime() > cutoff)
    .reduce((s, c) => s + (c._count?.recipients ?? c.recipientCount ?? 0), 0)
})

const totalRecipients = computed(() => campaigns.value.reduce((s, c) => s + (c._count?.recipients ?? c.recipientCount ?? 0), 0))
const totalReplies    = computed(() => campaigns.value.reduce((s, c) => s + (c.replyCount ?? 0), 0))
const attributedRevenue = computed(() => campaigns.value.reduce((s, c) => s + (c.attributedRevenueCents ?? 0), 0))

const responseRate = computed(() => {
  if (!totalRecipients.value) return 0
  return Math.round((totalReplies.value / totalRecipients.value) * 100)
})

async function loadCampaigns() {
  loading.value = true
  try {
    campaigns.value = unwrapList(await api.fetch<any>('/campaigns?limit=100'), ['campaigns'])
  } catch {
    campaigns.value = []
  } finally {
    loading.value = false
  }
}

async function scheduleCampaign(camp: any) {
  if (!confirm(`Enviar a campanha "${camp.name}" agora?`)) return
  try {
    await api.fetch<any>(`/campaigns/${camp.id}/send`, { method: 'POST' })
    toast.success('Campanha enviada.')
    await loadCampaigns()
  } catch (e: any) {
    toast.error(e?.data?.message || 'Erro ao enviar campanha.')
  }
}

async function cancelCampaign(camp: any) {
  if (!confirm(`Cancelar a campanha "${camp.name}"?`)) return
  const idx = campaigns.value.findIndex(c => c.id === camp.id)
  if (idx !== -1) campaigns.value[idx] = { ...campaigns.value[idx], status: 'CANCELLED' }
}

// New campaign form
const showNew     = ref(false)
const formLoading = ref(false)
const formError   = ref('')
const stages      = ref<any[]>([])
const form = reactive({
  name: '', message: '', targetType: 'ALL_CONTACTS' as 'ALL_CONTACTS' | 'STAGE',
  stageId: '', channel: 'WHATSAPP', scheduledAt: '',
})

async function openNew() {
  Object.assign(form, { name: '', message: '', targetType: 'ALL_CONTACTS', stageId: '', channel: 'WHATSAPP', scheduledAt: '' })
  formError.value = ''
  showNew.value = true
  if (!stages.value.length) {
    try { const res = await api.fetch<any>('/crm/stages'); stages.value = res.stages || [] }
    catch { stages.value = [] }
  }
}

async function createCampaign() {
  formError.value = ''
  formLoading.value = true
  try {
    const body: any = { name: form.name, message: form.message, targetType: form.targetType, channel: form.channel }
    if (form.targetType === 'STAGE' && form.stageId) body.stageId = form.stageId
    if (form.scheduledAt) body.scheduledAt = new Date(form.scheduledAt).toISOString()
    const res = await api.fetch<any>('/campaigns', { method: 'POST', body: JSON.stringify(body) })
    campaigns.value.unshift(res.campaign || res)
    showNew.value = false
    toast.success('Campanha criada.')
  } catch (e: any) {
    formError.value = e?.data?.message || 'Erro ao criar campanha.'
  } finally {
    formLoading.value = false
  }
}

onMounted(loadCampaigns)
</script>

<style scoped>
@keyframes camp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.camp-page {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
}

/* Header */
.camp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}

.camp-eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ka-fg-muted);
  margin-bottom: 2px;
}

.camp-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 0 0 2px;
}

.camp-subtitle {
  font-size: 13px;
  color: var(--ka-fg-muted);
  margin: 0;
}

/* Stats */
.camp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

@media (max-width: 860px) {
  .camp-stats { grid-template-columns: repeat(2, 1fr); }
}

.camp-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--ka-border);
  border-radius: 12px;
  background: var(--ka-surface);
}

.camp-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.camp-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--ka-fg);
  line-height: 1;
}

.camp-stat-label {
  font-size: 12px;
  color: var(--ka-fg-muted);
  margin-top: 3px;
}

/* Campaign list */
.camp-list {
  border: 1px solid var(--ka-border);
  border-radius: 12px;
  background: var(--ka-surface);
  overflow: hidden;
}

.camp-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ka-border);
}

.camp-row.last { border-bottom: none; }

.camp-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.camp-info { flex: 1; min-width: 0; }

.camp-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ka-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.camp-meta {
  font-size: 12px;
  color: var(--ka-fg-muted);
  margin-top: 2px;
}

.camp-metrics {
  display: flex;
  gap: 20px;
}

.camp-metric { text-align: center; }

.camp-metric-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--ka-fg);
}

.camp-metric-lbl {
  font-size: 10px;
  color: var(--ka-fg-muted);
  margin-top: 1px;
}

/* Dot status badge */
.camp-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ka-fg-2);
  min-width: 80px;
  flex-shrink: 0;
}

.camp-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.camp-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

/* Empty state */
.camp-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--ka-fg-muted);
  font-size: 13px;
}

/* Modal */
.camp-modal {
  background: var(--ka-surface);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  width: 480px;
  max-width: calc(100vw - 40px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.camp-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--ka-border);
}

.camp-modal-head h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
}

.camp-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  overflow-y: auto;
}
</style>
