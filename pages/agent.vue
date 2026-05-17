<template>
  <div class="agent-page">
    <!-- Hero header -->
    <div class="agent-hero">
      <div class="agent-hero-info">
        <div class="agent-hero-icon">
          <Icon name="sparkles" :size="22" />
        </div>
        <div>
          <div class="agent-eyebrow">Agente IA</div>
          <h1 class="agent-title">{{ form.name || 'Agente IA da Karis' }}</h1>
          <div class="agent-status-line">
            <span class="agent-status-dot" :class="form.isActive ? 'online' : 'offline'" />
            {{ form.isActive ? 'Ativa' : 'Inativa' }}
            <template v-if="agentStats.today > 0">
              · {{ agentStats.today }} conversas atendidas hoje · {{ agentStats.successRate }}% sem necessidade humana
            </template>
          </div>
        </div>
      </div>
      <div class="agent-hero-actions">
        <button class="btn secondary sm" type="button" :disabled="playgroundLoading" @click="runPlayground">
          <Icon name="play" :size="14" />
          Testar
        </button>
        <button class="btn primary sm" type="button" :disabled="saving" @click="saveAssistant">
          <Icon name="sparkles" :size="14" />
          {{ saving ? 'Publicando…' : 'Publicar mudanças' }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="agent-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="agent-tab"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- Config tab -->
    <div v-if="activeTab === 'config'" class="agent-config">
      <!-- Left: Instructions -->
      <div class="agent-main-col">
        <div class="agent-section">
          <div class="agent-section-head">
            <h2>Instruções do agente</h2>
            <p>Como sua IA deve se comportar — escreva como se estivesse treinando um novo atendente.</p>
          </div>
          <div class="form-group">
            <label class="form-label">Nome do agente</label>
            <input v-model="form.name" class="form-input" placeholder="Agente IA da Karis" />
          </div>
          <div class="form-group" style="flex:1;">
            <textarea
              v-model="form.instructions"
              class="agent-instructions"
              placeholder="Você é o agente de atendimento da Empresa X, em Curitiba.&#10;&#10;Tom: simpático, breve, usa 'você' e responde como uma pessoa real.&#10;Use no máximo 2 emojis por mensagem (não 🎉, café ☕, obrigada 🙏).&#10;&#10;REGRAS DE NEGÓCIO:&#10;- Entregamos em toda a Grande Curitiba, frete R$ 12,90 fixo.&#10;- Cardápio do dia: consulte o documento 'cardapio-hoje.pdf'.&#10;- Pagamentos via Pix (chave: contato@empresa.com.br).&#10;- Horário: seg–sáb, 7h–19h."
            />
          </div>
        </div>
      </div>

      <!-- Right: Settings sidebar -->
      <aside class="agent-aside-col">
        <div class="agent-section">
          <h3 class="agent-aside-title">Modelo</h3>
          <select v-model="form.model" class="form-input">
            <option v-for="opt in modelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div class="agent-section">
          <h3 class="agent-aside-title">Personalidade</h3>
          <div class="form-group">
            <label class="form-label">Tom de voz</label>
            <select v-model="form.personality" class="form-input">
              <option v-for="opt in personalityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <div class="agent-section">
          <h3 class="agent-aside-title">Idioma principal</h3>
          <select v-model="form.language" class="form-input">
            <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div class="agent-section">
          <h3 class="agent-aside-title">Auto-resposta</h3>
          <div class="agent-toggle-row">
            <span>Responder automaticamente</span>
            <label class="ka-switch">
              <input v-model="form.isActive" type="checkbox" />
              <span class="ka-switch-track" />
            </label>
          </div>
          <div class="agent-toggle-row">
            <span>Sugerir para o humano</span>
            <label class="ka-switch">
              <input v-model="form.suggestToHuman" type="checkbox" />
              <span class="ka-switch-track" />
            </label>
          </div>
        </div>
      </aside>
    </div>

    <!-- Knowledge tab -->
    <div v-else-if="activeTab === 'knowledge'" class="agent-section">
      <div class="agent-section-head" style="flex-direction:row;align-items:flex-start;justify-content:space-between;">
        <div>
          <h2>Base de conhecimento</h2>
          <p>Documentos e textos que a IA consulta para responder.</p>
        </div>
        <button class="btn primary sm" type="button" @click="createKnowledge">
          <Icon name="upload" :size="14" />
          Adicionar
        </button>
      </div>

      <div class="knowledge-add-form">
        <div class="form-group">
          <label class="form-label">Título</label>
          <input v-model="knowledgeForm.title" class="form-input" placeholder="FAQ de preços" />
        </div>
        <div class="form-group">
          <label class="form-label">Conteúdo</label>
          <input v-model="knowledgeForm.content" class="form-input" placeholder="Cole uma regra ou resposta frequente" />
        </div>
      </div>

      <div v-if="loading" style="display:flex;flex-direction:column;gap:10px;">
        <div v-for="i in 4" :key="i" style="height:52px;background:var(--ka-gray-100);border-radius:8px;animation:agent-pulse 1.5s infinite;" />
      </div>
      <div v-else-if="knowledge.length" class="knowledge-list">
        <div v-for="item in knowledge" :key="item.id" class="knowledge-item">
          <div class="knowledge-icon"><Icon name="fileText" :size="18" /></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;color:var(--ka-fg);">{{ item.title }}</div>
            <div style="font-size:12px;color:var(--ka-fg-muted);margin-top:2px;">{{ item.fileName || `${String(item.content || '').length} caracteres` }} · {{ formatDate(item.createdAt) }}</div>
          </div>
          <span class="badge success" style="height:20px;padding:0 8px;font-size:11px;">Indexado</span>
        </div>
      </div>
      <div v-else style="padding:40px;text-align:center;color:var(--ka-fg-muted);font-size:13px;">
        <Icon name="fileText" :size="32" style="opacity:0.2;display:block;margin:0 auto 10px;" />
        Nenhum conhecimento adicionado ainda.
      </div>
    </div>

    <!-- Transferências / Treinamento tab -->
    <div v-else-if="activeTab === 'sectors' || activeTab === 'training'" class="agent-section">
      <div class="agent-section-head" style="flex-direction:row;align-items:flex-start;justify-content:space-between;">
        <div>
          <h2>Setores de Transferência</h2>
          <p>A IA detecta automaticamente quando transferir e envia um resumo da conversa para o responsável.</p>
        </div>
        <button class="btn primary sm" type="button" @click="openSectorForm()">
          <Icon name="plus" :size="14" />
          Novo setor
        </button>
      </div>

      <div v-if="sectorFormVisible" class="sector-form">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Nome do setor</label>
            <input v-model="sectorForm.name" class="form-input" placeholder="Suporte Técnico" />
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp do setor</label>
            <input v-model="sectorForm.phone" class="form-input" placeholder="5541999999999" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Quando transferir</label>
          <textarea v-model="sectorForm.transferWhen" class="form-input" style="height:70px;resize:vertical;padding:8px 12px;" placeholder="Quando o cliente tiver problema técnico, precisar de instalação..." />
        </div>
        <div class="form-group">
          <label class="form-label">Descrição do setor (opcional)</label>
          <textarea v-model="sectorForm.description" class="form-input" style="height:56px;resize:vertical;padding:8px 12px;" placeholder="Equipe de suporte técnico especializado" />
        </div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button class="btn primary sm" type="button" :disabled="sectorSaving" @click="saveSector">{{ sectorSaving ? 'Salvando…' : 'Salvar setor' }}</button>
          <button class="btn secondary sm" type="button" @click="closeSectorForm">Cancelar</button>
        </div>
      </div>

      <div v-if="sectorsLoading" style="display:flex;flex-direction:column;gap:10px;">
        <div v-for="i in 3" :key="i" style="height:64px;background:var(--ka-gray-100);border-radius:8px;animation:agent-pulse 1.5s infinite;" />
      </div>
      <div v-else-if="sectors.length" class="sector-list">
        <div v-for="sector in sectors" :key="sector.id" class="sector-item">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
              <Icon name="arrowRight" :size="14" style="color:var(--ka-brand);flex-shrink:0;" />
              <span style="font-size:14px;font-weight:600;color:var(--ka-fg);">{{ sector.name }}</span>
              <span class="badge" :class="sector.isActive ? 'success' : 'neutral'" style="height:18px;padding:0 7px;font-size:10px;">{{ sector.isActive ? 'Ativo' : 'Inativo' }}</span>
            </div>
            <div style="font-size:12px;color:var(--ka-fg-muted);">{{ formatPhone(sector.phone) }}</div>
            <div v-if="sector.transferWhen" style="font-size:12px;color:var(--ka-fg-2);margin-top:2px;"><em>Quando:</em> {{ sector.transferWhen }}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="icon-btn" style="width:30px;height:30px;border:0;background:transparent;" title="Editar" @click="openSectorForm(sector)">
              <Icon name="edit" :size="14" />
            </button>
            <button class="icon-btn" style="width:30px;height:30px;border:0;background:transparent;color:var(--ka-danger);" title="Excluir" @click="deleteSector(sector.id)">
              <Icon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="!sectorFormVisible" style="padding:40px;text-align:center;color:var(--ka-fg-muted);font-size:13px;">
        <Icon name="arrowRight" :size="32" style="opacity:0.2;display:block;margin:0 auto 10px;" />
        Nenhum setor configurado.
      </div>
    </div>

    <!-- Playground tab -->
    <div v-else-if="activeTab === 'playground'" class="agent-section">
      <div class="agent-section-head">
        <h2>Playground</h2>
        <p>Ambiente de teste — não envia mensagens para clientes reais.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="form-group">
          <label class="form-label">Mensagem de teste</label>
          <textarea v-model="playgroundMessage" class="form-input" style="height:90px;resize:vertical;padding:10px 12px;" placeholder="Digite uma pergunta para testar o agente." />
        </div>
        <div class="playground-response">
          <div class="playground-response-label">
            <Icon name="sparkles" :size="13" />
            Resposta do agente
          </div>
          <div v-if="playgroundLoading" style="height:80px;background:var(--ka-gray-100);border-radius:8px;animation:agent-pulse 1.5s infinite;" />
          <div v-else class="playground-response-text">{{ playgroundReply || 'A resposta aparece aqui após você testar.' }}</div>
        </div>
        <div>
          <button class="btn primary sm" type="button" :disabled="playgroundLoading" @click="runPlayground">
            <Icon name="play" :size="14" />
            {{ playgroundLoading ? 'Testando…' : 'Testar agente' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate, unwrapList } from '~/composables/useKarisData'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const toast = useToast()
const activeTab = ref('config')
const loading = ref(true)
const saving = ref(false)
const playgroundLoading = ref(false)
const assistant = ref<any>(null)
const knowledge = ref<any[]>([])
const sectors = ref<any[]>([])
const sectorsLoading = ref(false)
const sectorSaving = ref(false)
const sectorFormVisible = ref(false)
const editingSectorId = ref<string | null>(null)

const form = reactive({
  name: 'Agente IA da Karis',
  instructions: '',
  isActive: true,
  suggestToHuman: false,
  personality: '',
  language: 'pt-BR',
  model: 'karis-pro',
  transferPhone: '',
  transferConditions: '',
})

const agentStats = reactive({ today: 0, successRate: 0 })
const knowledgeForm = reactive({ title: '', content: '' })
const sectorForm = reactive({ name: '', phone: '', description: '', transferWhen: '' })
const playgroundMessage = ref('Como vocês podem me ajudar?')
const playgroundReply = ref('')

const tabs = [
  { key: 'config',    label: 'Configuração' },
  { key: 'knowledge', label: 'Conhecimento' },
  { key: 'training',  label: 'Treinamento' },
  { key: 'sectors',   label: 'Transferências' },
  { key: 'playground',label: 'Playground' },
]

const modelOptions = [
  { value: 'karis-pro',  label: 'Karis Pro (recomendado)' },
  { value: 'karis-fast', label: 'Karis Fast — rápido · preciso' },
]

const languageOptions = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en',    label: 'English' },
  { value: 'es',    label: 'Español' },
]

const personalityOptions = [
  { value: '',             label: 'Padrão (cordial e profissional)' },
  { value: 'descontraido', label: 'Descontraído (usa emojis, tom próximo)' },
  { value: 'prestativo',   label: 'Prestativo (detalhado, proativo)' },
  { value: 'formal',       label: 'Formal (senhor/senhora, tom sério)' },
  { value: 'direto',       label: 'Direto (respostas curtas e precisas)' },
]

watch(activeTab, (value) => {
  if (value === 'sectors' && !sectors.value.length) loadSectors()
  if (value === 'training' && !sectors.value.length) loadSectors()
})

function formatPhone(phone: string) {
  const p = String(phone || '').replace(/\D/g, '')
  if (p.length === 13) return `+${p.slice(0,2)} (${p.slice(2,4)}) ${p.slice(4,9)}-${p.slice(9)}`
  if (p.length === 12) return `+${p.slice(0,2)} (${p.slice(2,4)}) ${p.slice(4,8)}-${p.slice(8)}`
  return phone
}

async function loadAgent() {
  loading.value = true
  try {
    const [assistantRes, knowledgeRes, overviewRes] = await Promise.allSettled([
      api.fetch<any>('/assistant'),
      api.fetch<any>('/knowledge'),
      api.fetch<any>('/analytics/overview'),
    ])

    if (assistantRes.status === 'fulfilled') {
      assistant.value = assistantRes.value.assistant
      Object.assign(form, {
        name: assistant.value?.name || 'Agente IA da Karis',
        instructions: assistant.value?.instructions || '',
        isActive: assistant.value?.isActive ?? true,
        suggestToHuman: assistant.value?.suggestToHuman ?? false,
        personality: assistant.value?.personality || '',
        language: assistant.value?.language || 'pt-BR',
        model: assistant.value?.model || 'karis-pro',
        transferPhone: assistant.value?.transferPhone || '',
        transferConditions: assistant.value?.transferConditions || '',
      })
      if (assistantRes.value.knowledge) knowledge.value = assistantRes.value.knowledge
    }

    if (knowledgeRes.status === 'fulfilled') {
      const k = knowledgeRes.value
      knowledge.value = k.knowledge || k || []
    }

    if (overviewRes.status === 'fulfilled') {
      const ov = overviewRes.value
      agentStats.today = ov?.conversations?.today ?? 0
      agentStats.successRate = ov?.ai?.successRate ?? 0
    }
  } finally {
    loading.value = false
  }
}

async function loadSectors() {
  sectorsLoading.value = true
  try {
    sectors.value = await api.fetch<any[]>('/assistant/transfer-sectors')
  } catch {
    sectors.value = []
  } finally {
    sectorsLoading.value = false
  }
}

function openSectorForm(sector?: any) {
  if (sector) {
    editingSectorId.value = sector.id
    Object.assign(sectorForm, { name: sector.name, phone: sector.phone, description: sector.description || '', transferWhen: sector.transferWhen || '' })
  } else {
    editingSectorId.value = null
    Object.assign(sectorForm, { name: '', phone: '', description: '', transferWhen: '' })
  }
  sectorFormVisible.value = true
}

function closeSectorForm() {
  sectorFormVisible.value = false
  editingSectorId.value = null
}

async function saveSector() {
  if (!sectorForm.name.trim() || !sectorForm.phone.trim()) {
    toast.warning('Informe o nome e o WhatsApp do setor.')
    return
  }
  sectorSaving.value = true
  try {
    if (editingSectorId.value) {
      const updated = await api.fetch<any>(`/assistant/transfer-sectors/${editingSectorId.value}`, { method: 'PUT', body: JSON.stringify(sectorForm) })
      const idx = sectors.value.findIndex(s => s.id === editingSectorId.value)
      if (idx !== -1) sectors.value[idx] = updated
    } else {
      const created = await api.fetch<any>('/assistant/transfer-sectors', { method: 'POST', body: JSON.stringify(sectorForm) })
      sectors.value = [...sectors.value, created]
    }
    toast.success('Setor salvo.')
    closeSectorForm()
  } catch (err: any) {
    toast.error(err?.data?.error || 'Erro ao salvar setor.')
  } finally {
    sectorSaving.value = false
  }
}

async function deleteSector(id: string) {
  if (!confirm('Excluir este setor de transferência?')) return
  try {
    await api.fetch(`/assistant/transfer-sectors/${id}`, { method: 'DELETE' })
    sectors.value = sectors.value.filter(s => s.id !== id)
    toast.success('Setor excluído.')
  } catch {
    toast.error('Erro ao excluir setor.')
  }
}

async function saveAssistant() {
  saving.value = true
  try {
    const res = await api.fetch<any>('/assistant', { method: 'PUT', body: JSON.stringify(form) })
    assistant.value = res.assistant
    Object.assign(form, {
      name: assistant.value?.name || 'Agente IA da Karis',
      instructions: assistant.value?.instructions || '',
      isActive: assistant.value?.isActive ?? true,
      suggestToHuman: assistant.value?.suggestToHuman ?? false,
      personality: assistant.value?.personality || '',
      language: assistant.value?.language || 'pt-BR',
      model: assistant.value?.model || 'karis-pro',
    })
    toast.success('Agente atualizado.')
  } catch (err: any) {
    toast.error(err?.data?.message || 'Não foi possível publicar as mudanças.')
  } finally {
    saving.value = false
  }
}

async function createKnowledge() {
  if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
    toast.warning('Informe título e conteúdo.')
    return
  }
  try {
    const res = await api.fetch<any>('/knowledge', {
      method: 'POST',
      body: JSON.stringify({ title: knowledgeForm.title, content: knowledgeForm.content }),
    })
    knowledge.value = [res.knowledge || res, ...knowledge.value]
    knowledgeForm.title = ''
    knowledgeForm.content = ''
    toast.success('Conhecimento adicionado.')
  } catch {
    toast.error('Erro ao adicionar conhecimento.')
  }
}

async function runPlayground() {
  if (!playgroundMessage.value.trim()) {
    toast.warning('Digite uma mensagem para testar.')
    return
  }
  playgroundLoading.value = true
  playgroundReply.value = ''
  activeTab.value = 'playground'
  try {
    const res = await api.fetch<any>('/assistant/playground', {
      method: 'POST',
      body: JSON.stringify({ message: playgroundMessage.value }),
    })
    playgroundReply.value = res.reply || 'Sem resposta do modelo.'
  } catch (err: any) {
    toast.error(err?.data?.message || 'Não foi possível testar o agente.')
  } finally {
    playgroundLoading.value = false
  }
}

onMounted(loadAgent)
</script>

<style scoped>
@keyframes agent-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.agent-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Hero */
.agent-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  flex-shrink: 0;
}

.agent-hero-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.agent-hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(139, 92, 246, 0.12);
  color: #7C3AED;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.agent-eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ka-fg-muted);
  margin-bottom: 2px;
}

.agent-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 0 0 4px;
}

.agent-status-line {
  font-size: 13px;
  color: var(--ka-fg-muted);
  display: flex;
  align-items: center;
  gap: 0;
}

.agent-status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;
}
.agent-status-dot.online { background: var(--ka-success); }
.agent-status-dot.offline { background: var(--ka-fg-muted); }

.agent-hero-actions {
  display: flex;
  gap: 8px;
}

/* Tabs */
.agent-tabs {
  display: flex;
  gap: 2px;
  padding: 16px 24px 0;
  border-bottom: 1px solid var(--ka-border);
  margin-bottom: 0;
  flex-shrink: 0;
}

.agent-tab {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.agent-tab:hover { color: var(--ka-fg); }

.agent-tab.active {
  color: var(--ka-brand);
  border-bottom-color: var(--ka-brand);
  font-weight: 600;
}

/* Config two-column layout */
.agent-config {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

.agent-main-col {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ka-border);
}

.agent-aside-col {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Section */
.agent-section {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.agent-section-head {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.agent-section-head h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0 0 4px;
}

.agent-section-head p {
  font-size: 13px;
  color: var(--ka-fg-muted);
  margin: 0;
}

.agent-aside-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ka-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 10px;
}

.agent-aside-col .agent-section {
  padding: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--ka-border);
  margin-bottom: 20px;
  overflow: visible;
  flex: none;
}

.agent-aside-col .agent-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

/* Instructions textarea */
.agent-instructions {
  width: 100%;
  min-height: 280px;
  flex: 1;
  padding: 14px 16px;
  border: 1px solid var(--ka-border);
  border-radius: 10px;
  background: var(--ka-gray-50);
  font-size: 13px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  color: var(--ka-fg);
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.agent-instructions:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 3px rgba(45, 91, 255, 0.1);
  background: var(--ka-surface);
}

/* Toggle switch */
.agent-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 13px;
  color: var(--ka-fg);
  border-bottom: 1px solid var(--ka-border);
}

.agent-toggle-row:last-child { border-bottom: none; }

.ka-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}

.ka-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.ka-switch-track {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: var(--ka-gray-200, #E2E8F0);
  transition: background 0.2s;
  cursor: pointer;
}

.ka-switch-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
  transition: left 0.2s;
}

.ka-switch input:checked + .ka-switch-track {
  background: var(--ka-brand);
}

.ka-switch input:checked + .ka-switch-track::after {
  left: 18px;
}

/* Knowledge */
.knowledge-add-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.knowledge-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--ka-border);
  border-radius: 10px;
  background: var(--ka-surface);
}

.knowledge-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(45, 91, 255, 0.08);
  color: var(--ka-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Sectors */
.sector-form {
  padding: 16px;
  border: 1px solid var(--ka-border);
  border-radius: 10px;
  background: var(--ka-gray-50);
  margin-bottom: 16px;
}

.sector-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sector-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid var(--ka-border);
  border-radius: 10px;
  background: var(--ka-surface);
}

/* Playground */
.playground-response {
  padding: 16px;
  border: 1px solid var(--ka-border);
  border-radius: 10px;
  background: var(--ka-gray-50);
  min-height: 100px;
}

.playground-response-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ka-fg-muted);
  margin-bottom: 10px;
}

.playground-response-text {
  font-size: 14px;
  color: var(--ka-fg);
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .agent-config {
    grid-template-columns: 1fr;
  }
  .agent-main-col { border-right: none; border-bottom: 1px solid var(--ka-border); }
}
</style>
