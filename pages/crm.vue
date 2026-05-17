<template>
  <div class="crm-page">
    <!-- Header -->
    <div class="crm-header">
      <div>
        <div class="crm-eyebrow">Pipeline de vendas</div>
        <h1 class="crm-title">Pipeline</h1>
        <p class="crm-subtitle">{{ activeDeals.length }} leads ativos · {{ formatMoney(totalPipelineValue) }} em negociação</p>
      </div>
      <div class="crm-header-actions">
        <button class="btn secondary sm" type="button" @click="loadCrm">
          <Icon name="refresh" :size="14" />
          Atualizar
        </button>
        <button class="btn secondary sm" type="button" @click="showFilters = !showFilters">
          <Icon name="filter" :size="14" />
          Filtros
        </button>
        <button class="btn primary sm" type="button" @click="openNewDeal()">
          <Icon name="plus" :size="14" />
          Novo lead
        </button>
      </div>
    </div>

    <!-- Board -->
    <div v-if="loading" class="crm-board">
      <div v-for="i in 4" :key="i" class="crm-col">
        <div style="height:28px;background:var(--ka-gray-100);border-radius:6px;animation:crm-pulse 1.5s infinite;margin-bottom:12px;" />
        <div v-for="j in 3" :key="j" style="height:130px;background:var(--ka-gray-100);border-radius:10px;animation:crm-pulse 1.5s infinite;margin-bottom:10px;" />
      </div>
    </div>

    <div v-else-if="stages.length" class="crm-board">
      <div v-for="stage in stages" :key="stage.id" class="crm-col">
        <!-- Column header -->
        <div class="crm-col-head">
          <span class="crm-col-dot" :style="{ background: stage.color || '#5B7FFF' }" />
          <span class="crm-col-name">{{ stage.name }}</span>
          <span class="crm-col-badge">{{ stageDeals(stage.id).length }}</span>
        </div>

        <!-- Cards -->
        <div class="crm-cards">
          <div
            v-for="deal in stageDeals(stage.id)"
            :key="deal.id"
            class="crm-card"
            @click="openDeal(deal)"
          >
            <!-- Top row: avatar + name + score -->
            <div class="crm-card-top">
              <div class="crm-avatar" :style="{ background: avatarColor(deal.contact?.name || deal.title) }">
                {{ initials(deal.contact?.name || deal.title) }}
              </div>
              <span class="crm-card-name">{{ deal.contact?.name || deal.title }}</span>
              <span v-if="deal.aiScore" class="crm-score">{{ deal.aiScore }}</span>
            </div>

            <!-- Value -->
            <div v-if="deal.valueCents" class="crm-card-value">
              <span class="crm-val-currency">R$</span>{{ (deal.valueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) }}
            </div>

            <!-- Next action -->
            <div v-if="deal.aiNextAction" class="crm-card-action">
              <span class="crm-diamond">◆</span>
              {{ deal.aiNextAction }}
            </div>

            <!-- Tags -->
            <div v-if="(deal.contact?.tags || deal.tags || []).length" class="crm-card-tags">
              <span
                v-for="tag in (deal.contact?.tags || deal.tags || []).slice(0, 2)"
                :key="tag"
                class="crm-tag"
                :style="{ background: tagBg(tag), color: tagColor(tag) }"
              >{{ tag }}</span>
            </div>

            <!-- Footer -->
            <div class="crm-card-footer">
              <span class="crm-card-time">{{ relativeTime(deal.updatedAt) }}</span>
              <button
                class="crm-card-menu"
                type="button"
                @click.stop="openDeal(deal)"
              >···</button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!stageDeals(stage.id).length" class="crm-col-empty">
            Sem negócios nesta etapa.
          </div>
        </div>

        <!-- Add button -->
        <button class="crm-add-btn" type="button" @click="openNewDeal(stage.id)">
          <Icon name="plus" :size="13" /> Adicionar
        </button>
      </div>
    </div>

    <div v-else style="padding:60px;text-align:center;color:var(--ka-fg-muted);font-size:14px;">
      <Icon name="kanban" :size="36" style="opacity:0.2;display:block;margin:0 auto 12px;" />
      Nenhuma etapa encontrada.
    </div>

    <!-- New lead modal -->
    <Teleport to="body">
      <div v-if="showNewDeal" style="position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;">
        <button style="position:absolute;inset:0;background:rgba(0,0,0,0.4);border:none;cursor:pointer;" @click="showNewDeal = false" />
        <div class="crm-modal" style="position:relative;">
          <div class="crm-modal-header">
            <h3>Novo lead</h3>
            <button class="icon-btn" style="width:30px;height:30px;border:0;background:transparent;" @click="showNewDeal = false">
              <Icon name="x" :size="16" />
            </button>
          </div>
          <form class="crm-modal-body" @submit.prevent="createDeal">
            <div class="form-group">
              <label class="form-label">Título do lead *</label>
              <input v-model="form.title" class="form-input" type="text" placeholder="Ex: Proposta para João" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nome do contato</label>
              <input v-model="form.contactName" class="form-input" type="text" placeholder="Nome do cliente" />
            </div>
            <div class="form-group">
              <label class="form-label">Etapa</label>
              <select v-model="form.stageId" class="form-input">
                <option value="">Selecionar etapa</option>
                <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valor (R$)</label>
              <input v-model.number="form.valueReais" class="form-input" type="number" min="0" step="0.01" placeholder="0,00" />
            </div>
            <p v-if="formError" style="color:var(--ka-danger);font-size:13px;margin:0;">{{ formError }}</p>
            <div style="display:flex;justify-content:flex-end;gap:8px;padding-top:8px;">
              <button class="btn secondary sm" type="button" @click="showNewDeal = false">Cancelar</button>
              <button class="btn primary sm" type="submit" :disabled="formLoading">
                {{ formLoading ? 'Salvando…' : 'Criar lead' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Deal drawer -->
    <Teleport to="body">
      <template v-if="selectedDeal">
        <div class="crm-backdrop" @click="selectedDeal = null" />
        <aside class="crm-drawer">
          <div class="crm-drawer-head">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="crm-avatar" :style="{ background: avatarColor(selectedDeal.contact?.name || selectedDeal.title), width: '44px', height: '44px', fontSize: '16px' }">
                {{ initials(selectedDeal.contact?.name || selectedDeal.title) }}
              </div>
              <div>
                <div style="font-size:16px;font-weight:600;color:var(--ka-fg);">{{ selectedDeal.contact?.name || selectedDeal.title }}</div>
                <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ka-fg-muted);margin-top:3px;">
                  <span class="crm-col-dot" :style="{ background: stageColor(selectedDeal.stageId) }" />
                  {{ stageName(selectedDeal.stageId) }}
                </div>
              </div>
            </div>
            <button class="icon-btn" style="width:30px;height:30px;border:0;background:transparent;" @click="selectedDeal = null">
              <Icon name="x" :size="16" />
            </button>
          </div>

          <div class="crm-drawer-body">
            <!-- Stats -->
            <div class="crm-drawer-stats">
              <div class="crm-stat">
                <div class="crm-stat-label">Valor</div>
                <div class="crm-stat-value">{{ selectedDeal.valueCents ? formatMoney(selectedDeal.valueCents) : '—' }}</div>
              </div>
              <div class="crm-stat crm-stat-ai">
                <div class="crm-stat-label">Score IA</div>
                <div class="crm-stat-value" style="color:var(--ka-brand);">{{ selectedDeal.aiScore ?? 0 }}/100</div>
              </div>
            </div>

            <!-- AI next action -->
            <div v-if="selectedDeal.aiNextAction" class="crm-drawer-section">
              <h5 class="crm-drawer-section-title">Próxima ação</h5>
              <div class="crm-ai-action">
                <Icon name="sparkles" :size="15" />
                <span>{{ selectedDeal.aiNextAction }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div class="crm-drawer-section">
              <h5 class="crm-drawer-section-title">Notas</h5>
              <form style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;" @submit.prevent="addNote">
                <textarea v-model="noteText" class="form-input" rows="2" placeholder="Adicionar nota…" />
                <button class="btn primary sm" type="submit" :disabled="!noteText.trim() || noteLoading" style="align-self:flex-end;">
                  {{ noteLoading ? '…' : 'Salvar nota' }}
                </button>
              </form>
              <div v-if="notesLoading" style="height:56px;background:var(--ka-gray-100);border-radius:8px;animation:crm-pulse 1.5s infinite;" />
              <div v-else-if="notes.length" style="display:flex;flex-direction:column;gap:8px;">
                <div v-for="note in notes" :key="note.id" class="crm-note">
                  <p>{{ note.content }}</p>
                  <span>{{ relativeTime(note.createdAt) }}</span>
                </div>
              </div>
              <p v-else style="font-size:13px;color:var(--ka-fg-muted);margin:0;">Nenhuma nota ainda.</p>
            </div>

            <!-- Tasks -->
            <div class="crm-drawer-section">
              <h5 class="crm-drawer-section-title">Tarefas</h5>
              <form style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;" @submit.prevent="addTask">
                <input v-model="taskTitle" class="form-input" type="text" placeholder="Descrição da tarefa…" />
                <input v-model="taskDueAt" class="form-input" type="datetime-local" />
                <button class="btn primary sm" type="submit" :disabled="!taskTitle.trim() || taskLoading" style="align-self:flex-end;">
                  {{ taskLoading ? '…' : 'Adicionar tarefa' }}
                </button>
              </form>
              <div v-if="tasksLoading" style="height:56px;background:var(--ka-gray-100);border-radius:8px;animation:crm-pulse 1.5s infinite;" />
              <div v-else-if="tasks.length" style="display:flex;flex-direction:column;gap:8px;">
                <div v-for="task in tasks" :key="task.id" class="crm-note">
                  <p :style="task.completedAt ? 'text-decoration:line-through;opacity:0.5;' : ''">{{ task.title }}</p>
                  <span>{{ task.dueAt ? relativeTime(task.dueAt) : 'Sem prazo' }}</span>
                </div>
              </div>
              <p v-else style="font-size:13px;color:var(--ka-fg-muted);margin:0;">Nenhuma tarefa ainda.</p>
            </div>
          </div>

          <div class="crm-drawer-footer">
            <button class="btn secondary sm" @click="selectedDeal = null">Fechar</button>
            <button class="btn primary sm" @click="navigateTo('/inbox')">Ver conversa</button>
          </div>
        </aside>
      </template>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { formatMoney, unwrapList } from '~/composables/useKarisData'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const toast = useToast()
const loading = ref(true)
const stages = ref<any[]>([])
const deals = ref<any[]>([])
const showFilters = ref(false)

const AVATAR_COLORS = ['#5B7FFF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

function avatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0]
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function relativeTime(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ontem'
  return `${d} dias`
}

const TAG_PALETTES: Record<string, { bg: string; fg: string }> = {
  recente:      { bg: '#D1FAE5', fg: '#065F46' },
  urgente:      { bg: '#FEF3C7', fg: '#92400E' },
  'cliente-fiel': { bg: '#DBEAFE', fg: '#1E40AF' },
  vip:          { bg: '#EDE9FE', fg: '#5B21B6' },
}

function tagBg(tag: string) { return TAG_PALETTES[tag]?.bg || '#F1F5F9' }
function tagColor(tag: string) { return TAG_PALETTES[tag]?.fg || '#475569' }

const activeDeals = computed(() => deals.value.filter(d => d.status !== 'CLOSED'))
const totalPipelineValue = computed(() => activeDeals.value.reduce((s, d) => s + Number(d.valueCents || 0), 0))

function stageDeals(stageId: string) {
  return deals.value.filter(d => d.stageId === stageId)
}

function stageName(stageId?: string) {
  return stages.value.find(s => s.id === stageId)?.name || '—'
}

function stageColor(stageId?: string) {
  return stages.value.find(s => s.id === stageId)?.color || '#5B7FFF'
}

async function loadCrm() {
  loading.value = true
  try {
    const [stagesRes, dealsRes] = await Promise.all([
      api.fetch<any>('/crm/stages'),
      api.fetch<any>('/crm/deals?limit=200'),
    ])
    stages.value = stagesRes.stages || []
    deals.value = unwrapList(dealsRes, ['deals'])
  } finally {
    loading.value = false
  }
}

onMounted(loadCrm)

// New deal form
const showNewDeal = ref(false)
const formLoading = ref(false)
const formError = ref('')
const form = reactive({ title: '', contactName: '', stageId: '', valueReais: null as number | null })

function openNewDeal(stageId?: string) {
  Object.assign(form, { title: '', contactName: '', stageId: stageId || stages.value[0]?.id || '', valueReais: null })
  formError.value = ''
  showNewDeal.value = true
}

async function createDeal() {
  formError.value = ''
  formLoading.value = true
  try {
    const body: any = { title: form.title, stageId: form.stageId || stages.value[0]?.id }
    if (form.contactName) body.contactName = form.contactName
    if (form.valueReais != null) body.valueCents = Math.round(form.valueReais * 100)
    const res = await api.fetch<any>('/crm/deals', { method: 'POST', body: JSON.stringify(body) })
    deals.value.unshift(res.deal || res)
    showNewDeal.value = false
    toast.success('Lead criado com sucesso.')
  } catch (e: any) {
    formError.value = e?.data?.message || 'Erro ao criar lead.'
  } finally {
    formLoading.value = false
  }
}

// Deal drawer
const selectedDeal = ref<any | null>(null)
const notes = ref<any[]>([])
const notesLoading = ref(false)
const noteText = ref('')
const noteLoading = ref(false)
const tasks = ref<any[]>([])
const tasksLoading = ref(false)
const taskTitle = ref('')
const taskDueAt = ref('')
const taskLoading = ref(false)

async function openDeal(deal: any) {
  selectedDeal.value = deal
  noteText.value = ''
  taskTitle.value = ''
  taskDueAt.value = ''
  await Promise.all([loadNotes(deal.id), loadTasks(deal.id)])
}

async function loadNotes(dealId: string) {
  notesLoading.value = true
  try {
    const res = await api.fetch<any>(`/crm/deals/${dealId}/notes`)
    notes.value = unwrapList(res, ['notes'])
  } catch { notes.value = [] } finally { notesLoading.value = false }
}

async function loadTasks(dealId: string) {
  tasksLoading.value = true
  try {
    const res = await api.fetch<any>(`/crm/deals/${dealId}/tasks`)
    tasks.value = unwrapList(res, ['tasks'])
  } catch { tasks.value = [] } finally { tasksLoading.value = false }
}

async function addNote() {
  if (!selectedDeal.value || !noteText.value.trim()) return
  noteLoading.value = true
  try {
    const res = await api.fetch<any>(`/crm/deals/${selectedDeal.value.id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: noteText.value.trim() }),
    })
    notes.value.unshift(res.note || res)
    noteText.value = ''
  } catch {} finally { noteLoading.value = false }
}

async function addTask() {
  if (!selectedDeal.value || !taskTitle.value.trim()) return
  taskLoading.value = true
  try {
    const body: any = { title: taskTitle.value.trim() }
    if (taskDueAt.value) body.dueAt = new Date(taskDueAt.value).toISOString()
    const res = await api.fetch<any>(`/crm/deals/${selectedDeal.value.id}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    tasks.value.unshift(res.task || res)
    taskTitle.value = ''
    taskDueAt.value = ''
  } catch {} finally { taskLoading.value = false }
}
</script>

<style scoped>
@keyframes crm-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.crm-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.crm-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 20px 24px 16px;
  flex-shrink: 0;
}

.crm-eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ka-fg-muted);
  margin-bottom: 2px;
}

.crm-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 0;
}

.crm-subtitle {
  font-size: 13px;
  color: var(--ka-fg-muted);
  margin: 2px 0 0;
}

.crm-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Board */
.crm-board {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 0 24px 24px;
  flex: 1;
  align-items: flex-start;
}

.crm-col {
  min-width: 260px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
}

/* Column header */
.crm-col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 0 2px;
}

.crm-col-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.crm-col-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-fg);
  flex: 1;
}

.crm-col-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--ka-fg-muted);
  background: var(--ka-gray-100);
  border-radius: 10px;
  padding: 1px 8px;
}

/* Cards container */
.crm-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

/* Deal card */
.crm-card {
  background: var(--ka-surface);
  border: 1px solid var(--ka-border);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.crm-card:hover {
  border-color: var(--ka-brand);
  box-shadow: 0 2px 10px rgba(45, 91, 255, 0.1);
}

.crm-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crm-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.crm-card-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crm-score {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--ka-brand);
  border-radius: 8px;
  padding: 2px 7px;
  flex-shrink: 0;
}

.crm-card-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--ka-fg);
  line-height: 1;
}

.crm-val-currency {
  font-size: 11px;
  font-weight: 500;
  color: var(--ka-fg-muted);
  margin-right: 2px;
}

.crm-card-action {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ka-fg-2);
}

.crm-diamond {
  color: var(--ka-brand);
  font-size: 9px;
  flex-shrink: 0;
}

.crm-card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.crm-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
}

.crm-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.crm-card-time {
  font-size: 11px;
  color: var(--ka-fg-muted);
}

.crm-card-menu {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--ka-fg-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.crm-card-menu:hover { color: var(--ka-fg); }

.crm-col-empty {
  font-size: 12px;
  color: var(--ka-fg-muted);
  text-align: center;
  padding: 20px 12px;
  border: 1px dashed var(--ka-border);
  border-radius: 10px;
}

.crm-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 9px;
  margin-top: 8px;
  border: 1px dashed var(--ka-border);
  border-radius: 10px;
  background: transparent;
  font-size: 12px;
  color: var(--ka-fg-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.crm-add-btn:hover {
  border-color: var(--ka-brand);
  color: var(--ka-brand);
}

/* Modal */
.crm-modal {
  background: var(--ka-surface);
  border-radius: 14px;
  box-shadow: var(--ka-shadow-lg);
  width: 440px;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.crm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--ka-border);
}

.crm-modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
}

.crm-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  overflow-y: auto;
}

/* Drawer */
.crm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
}

.crm-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: var(--ka-surface);
  border-left: 1px solid var(--ka-border);
  box-shadow: var(--ka-shadow-lg);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.crm-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--ka-border);
  flex-shrink: 0;
}

.crm-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.crm-drawer-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}

.crm-stat {
  padding: 14px;
  border-radius: 10px;
  background: var(--ka-gray-50);
}

.crm-stat-ai {
  background: rgba(45, 91, 255, 0.07);
}

.crm-stat-label {
  font-size: 11px;
  color: var(--ka-fg-muted);
  margin-bottom: 4px;
}

.crm-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--ka-fg);
}

.crm-drawer-section {
  margin-bottom: 24px;
}

.crm-drawer-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ka-fg-muted);
  margin: 0 0 10px;
}

.crm-ai-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(45, 91, 255, 0.07);
  font-size: 13px;
  color: var(--ka-brand);
}

.crm-note {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--ka-gray-50);
}

.crm-note p {
  font-size: 13px;
  color: var(--ka-fg);
  margin: 0 0 4px;
}

.crm-note span {
  font-size: 11px;
  color: var(--ka-fg-muted);
}

.crm-drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--ka-border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
</style>
