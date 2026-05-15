<template>
  <NuxtLayout name="default">
    <div class="agent-page">
      <section class="agent-hero">
        <div class="agent-title-lockup">
          <span><Sparkles class="h-6 w-6" /></span>
          <div>
            <p>Agente IA</p>
            <h1>{{ form.name || "Agente IA da Karis" }}</h1>
            <small>
              <i :class="form.isActive ? 'is-online' : 'is-offline'" />
              {{ assistantStatus }}
            </small>
          </div>
        </div>
        <div class="agent-actions">
          <Button variant="secondary" size="sm" @click="runPlayground">
            <Play class="h-4 w-4" />
            Testar
          </Button>
          <Button size="sm" :loading="saving" @click="saveAssistant">
            <Sparkles class="h-4 w-4" />
            Publicar mudanças
          </Button>
        </div>
      </section>

      <nav class="agent-tabs">
        <button v-for="tab in tabs" :key="tab.key" :class="activeTab === tab.key ? 'is-active' : ''" type="button" @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </nav>

      <!-- Aba: Configuração -->
      <section v-if="activeTab === 'config'" class="agent-grid">
        <div class="agent-main">
          <article class="agent-card">
            <div class="agent-card-heading">
              <h2>Identidade</h2>
              <p>Nome e instruções que definem como o agente se apresenta.</p>
            </div>
            <Input v-model="form.name" label="Nome do agente" placeholder="Assistente Karis" />
            <label class="mt-4 block">
              <span class="mb-1.5 block text-sm font-semibold text-[--ka-fg]">Instruções</span>
              <textarea v-model="form.instructions" class="input-field min-h-36 py-3" placeholder="Você é um atendente da empresa X. Responda apenas sobre produtos e serviços da empresa..." />
            </label>
          </article>
        </div>

        <aside class="agent-aside">
          <article class="agent-card">
            <h3>Personalidade</h3>
            <Select v-model="form.personality" class="mt-4" label="Tom de voz" :options="personalityOptions" />
          </article>

          <article class="agent-card">
            <h3>Auto-resposta</h3>
            <label class="agent-toggle">
              <span>Responder automaticamente</span>
              <input v-model="form.isActive" type="checkbox" />
            </label>
          </article>
        </aside>
      </section>

      <!-- Aba: Setores de Transferência -->
      <section v-else-if="activeTab === 'sectors'" class="agent-card">
        <div class="agent-card-heading agent-row-heading">
          <div>
            <h2>Setores de Transferência</h2>
            <p>A IA detecta automaticamente quando transferir e envia um resumo da conversa para o responsável.</p>
          </div>
          <Button size="sm" @click="openSectorForm()">
            <Plus class="h-4 w-4" />
            Novo setor
          </Button>
        </div>

        <!-- Formulário de criação/edição -->
        <div v-if="sectorFormVisible" class="agent-sector-form">
          <div class="agent-sector-form-grid">
            <Input v-model="sectorForm.name" label="Nome do setor" placeholder="Suporte Técnico" />
            <Input v-model="sectorForm.phone" label="WhatsApp do setor" placeholder="5541999999999" />
          </div>
          <label class="mt-3 block">
            <span class="mb-1.5 block text-sm font-semibold text-[--ka-fg]">Quando transferir</span>
            <textarea v-model="sectorForm.transferWhen" class="input-field min-h-20 py-3" placeholder="Quando o cliente tiver problema técnico, defeito no produto, precisar de instalação..." />
          </label>
          <label class="mt-3 block">
            <span class="mb-1.5 block text-sm font-semibold text-[--ka-fg]">Descrição do setor (opcional)</span>
            <textarea v-model="sectorForm.description" class="input-field min-h-16 py-3" placeholder="Equipe de suporte técnico especializado" />
          </label>
          <div class="mt-4 flex gap-2">
            <Button size="sm" :loading="sectorSaving" @click="saveSector">Salvar setor</Button>
            <Button size="sm" variant="secondary" @click="closeSectorForm">Cancelar</Button>
          </div>
        </div>

        <!-- Lista de setores -->
        <div v-if="sectorsLoading" class="space-y-2 mt-4">
          <Skeleton v-for="i in 3" :key="i" height="4rem" />
        </div>
        <div v-else-if="sectors.length" class="agent-sector-list mt-4">
          <div v-for="sector in sectors" :key="sector.id" class="agent-sector-item">
            <div class="agent-sector-info">
              <div class="agent-sector-header">
                <ArrowRightLeft class="h-4 w-4 text-[--ka-accent]" />
                <strong>{{ sector.name }}</strong>
                <Badge :variant="sector.isActive ? 'success' : 'secondary'" size="sm">
                  {{ sector.isActive ? 'Ativo' : 'Inativo' }}
                </Badge>
              </div>
              <span class="agent-sector-phone">📱 {{ formatPhone(sector.phone) }}</span>
              <p v-if="sector.transferWhen" class="agent-sector-when">
                <em>Quando:</em> {{ sector.transferWhen }}
              </p>
            </div>
            <div class="agent-sector-actions">
              <button class="icon-btn" title="Editar" @click="openSectorForm(sector)">
                <Pencil class="h-4 w-4" />
              </button>
              <button class="icon-btn text-red-500" title="Excluir" @click="deleteSector(sector.id)">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <EmptyState
          v-else-if="!sectorFormVisible"
          :icon="ArrowRightLeft"
          title="Nenhum setor configurado"
          description="Adicione setores para que a IA transfira automaticamente quando necessário."
        />
      </section>

      <!-- Aba: Conhecimento -->
      <section v-else-if="activeTab === 'knowledge'" class="agent-card">
        <div class="agent-card-heading agent-row-heading">
          <div>
            <h2>Base de conhecimento</h2>
            <p>Documentos e textos que a IA consulta para responder.</p>
          </div>
          <Button size="sm" @click="createKnowledge">
            <Upload class="h-4 w-4" />
            Adicionar texto
          </Button>
        </div>

        <div class="agent-knowledge-form">
          <Input v-model="knowledgeForm.title" label="Título" placeholder="FAQ de preços" />
          <Input v-model="knowledgeForm.content" label="Conteúdo rápido" placeholder="Cole uma regra ou resposta frequente" />
        </div>

        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="i in 4" :key="i" height="3rem" />
        </div>
        <div v-else-if="knowledge.length" class="agent-knowledge-list">
          <div v-for="item in knowledge" :key="item.id">
            <FileText class="h-5 w-5" />
            <span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.fileName || `${String(item.content || '').length} caracteres` }} · {{ formatDate(item.createdAt) }}</small>
            </span>
            <Badge variant="success" size="sm">Indexado</Badge>
          </div>
        </div>
        <EmptyState v-else :icon="FileText" title="Nenhum conhecimento adicionado" description="Adicione textos ou documentos para a IA responder com mais precisão." />
      </section>

      <!-- Aba: Playground -->
      <section v-else class="agent-card">
        <div class="agent-card-heading">
          <h2>Playground</h2>
          <p>Ambiente de teste. Não envia mensagens para clientes reais.</p>
        </div>
        <div class="agent-playground">
          <textarea v-model="playgroundMessage" class="agent-textarea is-playground" placeholder="Digite uma pergunta para testar o agente." />
          <div class="agent-response">
            <p>Resposta</p>
            <Skeleton v-if="playgroundLoading" height="6rem" />
            <span v-else>{{ playgroundReply || "A resposta do teste aparece aqui." }}</span>
          </div>
        </div>
        <Button class="mt-4" :loading="playgroundLoading" @click="runPlayground">Testar agente</Button>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowRightLeft, FileText, Pencil, Play, Plus, Sparkles, Trash2, Upload } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const toast = useToast();
const activeTab = ref("config");
const loading = ref(true);
const saving = ref(false);
const playgroundLoading = ref(false);
const assistant = ref<any>(null);
const knowledge = ref<any[]>([]);
const sectors = ref<any[]>([]);
const sectorsLoading = ref(false);
const sectorSaving = ref(false);
const sectorFormVisible = ref(false);
const editingSectorId = ref<string | null>(null);

const form = reactive({ name: "Assistente Karis", instructions: "", isActive: true, personality: "", transferPhone: "", transferConditions: "" });
const knowledgeForm = reactive({ title: "", content: "" });
const sectorForm = reactive({ name: "", phone: "", description: "", transferWhen: "" });
const playgroundMessage = ref("Como vocês podem me ajudar no atendimento?");
const playgroundReply = ref("");

const tabs = [
  { key: "config",    label: "Configuração" },
  { key: "sectors",   label: "Transferências" },
  { key: "knowledge", label: "Conhecimento" },
  { key: "playground",label: "Playground" },
];

const personalityOptions = [
  { value: "",            label: "Padrão (cordial e profissional)" },
  { value: "descontraido",label: "Descontraído 😊 (usa emojis, tom próximo)" },
  { value: "prestativo",  label: "Prestativo (detalhado, proativo)" },
  { value: "formal",      label: "Formal (senhor/senhora, tom sério)" },
  { value: "direto",      label: "Direto (respostas curtas e precisas)" },
];

const assistantStatus = computed(() => assistant.value?.isActive ? "Ativa · pronta para responder conversas reais." : "Inativa · publique mudanças para retomar o atendimento.");

watch(activeTab, (value) => {
  if (value === "sectors" && !sectors.value.length) loadSectors();
});

function formatPhone(phone: string) {
  const p = String(phone || "").replace(/\D/g, "");
  if (p.length === 13) return `+${p.slice(0,2)} (${p.slice(2,4)}) ${p.slice(4,9)}-${p.slice(9)}`;
  if (p.length === 12) return `+${p.slice(0,2)} (${p.slice(2,4)}) ${p.slice(4,8)}-${p.slice(8)}`;
  return phone;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

async function loadAgent() {
  loading.value = true;
  try {
    const [assistantRes, knowledgeRes] = await Promise.all([
      api.fetch<any>("/assistant"),
      api.fetch<any>("/knowledge").catch(() => ({ knowledge: [] })),
    ]);
    assistant.value = assistantRes.assistant;
    Object.assign(form, {
      name: assistant.value?.name || "Assistente Karis",
      instructions: assistant.value?.instructions || "",
      isActive: assistant.value?.isActive ?? true,
      personality: assistant.value?.personality || "",
      transferPhone: assistant.value?.transferPhone || "",
      transferConditions: assistant.value?.transferConditions || "",
    });
    knowledge.value = knowledgeRes.knowledge || assistant.value?.knowledge || [];
  } finally {
    loading.value = false;
  }
}

async function loadSectors() {
  sectorsLoading.value = true;
  try {
    sectors.value = await api.fetch<any[]>("/assistant/transfer-sectors");
  } catch {
    sectors.value = [];
  } finally {
    sectorsLoading.value = false;
  }
}

function openSectorForm(sector?: any) {
  if (sector) {
    editingSectorId.value = sector.id;
    Object.assign(sectorForm, {
      name: sector.name,
      phone: sector.phone,
      description: sector.description || "",
      transferWhen: sector.transferWhen || "",
    });
  } else {
    editingSectorId.value = null;
    Object.assign(sectorForm, { name: "", phone: "", description: "", transferWhen: "" });
  }
  sectorFormVisible.value = true;
}

function closeSectorForm() {
  sectorFormVisible.value = false;
  editingSectorId.value = null;
}

async function saveSector() {
  if (!sectorForm.name.trim() || !sectorForm.phone.trim()) {
    toast.warning("Informe o nome e o WhatsApp do setor.");
    return;
  }
  sectorSaving.value = true;
  try {
    if (editingSectorId.value) {
      const updated = await api.fetch<any>(`/assistant/transfer-sectors/${editingSectorId.value}`, {
        method: "PUT",
        body: JSON.stringify(sectorForm),
      });
      const idx = sectors.value.findIndex(s => s.id === editingSectorId.value);
      if (idx !== -1) sectors.value[idx] = updated;
    } else {
      const created = await api.fetch<any>("/assistant/transfer-sectors", {
        method: "POST",
        body: JSON.stringify(sectorForm),
      });
      sectors.value = [...sectors.value, created];
    }
    toast.success("Setor salvo.");
    closeSectorForm();
  } catch (err: any) {
    toast.error(err?.data?.error || "Erro ao salvar setor.");
  } finally {
    sectorSaving.value = false;
  }
}

async function deleteSector(id: string) {
  if (!confirm("Excluir este setor de transferência?")) return;
  try {
    await api.fetch(`/assistant/transfer-sectors/${id}`, { method: "DELETE" });
    sectors.value = sectors.value.filter(s => s.id !== id);
    toast.success("Setor excluído.");
  } catch {
    toast.error("Erro ao excluir setor.");
  }
}

async function saveAssistant() {
  saving.value = true;
  try {
    const res = await api.fetch<any>("/assistant", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    assistant.value = res.assistant;
    Object.assign(form, {
      name: assistant.value?.name || "Assistente Karis",
      instructions: assistant.value?.instructions || "",
      isActive: assistant.value?.isActive ?? true,
      personality: assistant.value?.personality || "",
      transferPhone: assistant.value?.transferPhone || "",
      transferConditions: assistant.value?.transferConditions || "",
    });
    toast.success("Agente atualizado.");
  } catch (err: any) {
    toast.error(err?.data?.message || err?.message || "Não foi possível publicar as mudanças.");
  } finally {
    saving.value = false;
  }
}

async function createKnowledge() {
  if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
    toast.warning("Informe título e conteúdo.");
    return;
  }
  const res = await api.fetch<any>("/knowledge", {
    method: "POST",
    body: JSON.stringify({ title: knowledgeForm.title, content: knowledgeForm.content }),
  });
  knowledge.value = [res.knowledge, ...knowledge.value];
  knowledgeForm.title = "";
  knowledgeForm.content = "";
  toast.success("Conhecimento adicionado.");
}

async function runPlayground() {
  if (!playgroundMessage.value.trim()) {
    toast.warning("Digite uma mensagem para testar.");
    return;
  }
  playgroundLoading.value = true;
  playgroundReply.value = "";
  activeTab.value = "playground";
  try {
    const res = await api.fetch<any>("/assistant/playground", {
      method: "POST",
      body: JSON.stringify({ message: playgroundMessage.value }),
    });
    playgroundReply.value = res.reply || "Sem resposta do modelo.";
  } catch (err: any) {
    toast.error(err?.data?.message || "Não foi possível testar o agente. Verifique se o modelo está disponível.");
  } finally {
    playgroundLoading.value = false;
  }
}

onMounted(loadAgent);
</script>
