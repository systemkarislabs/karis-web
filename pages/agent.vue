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

      <section v-if="activeTab === 'config'" class="agent-grid">
        <article class="agent-card agent-editor-card">
          <div class="agent-card-heading">
            <h2>Instruções do agente</h2>
            <p>Como sua IA deve se comportar e responder durante o atendimento.</p>
          </div>
          <textarea
            v-model="form.instructions"
            class="agent-textarea"
            placeholder="Explique tom, regras de negócio, limites e quando transferir para humano."
          />
        </article>

        <aside class="agent-side">
          <article class="agent-card">
            <Input v-model="form.name" label="Nome do agente" />
            <Select v-model="form.personality" class="mt-4" label="Personalidade" :options="personalityOptions" />
          </article>

          <article class="agent-card">
            <h3>Modelo</h3>
            <p>Karis Pro · rápido e preciso</p>
            <div class="agent-select-mock">Karis Pro · produção</div>
          </article>

          <article class="agent-card">
            <h3>Auto-resposta</h3>
            <label class="agent-toggle">
              <span>Responder automaticamente</span>
              <input v-model="form.isActive" type="checkbox" />
            </label>
          </article>

          <article class="agent-card">
            <Input v-model="form.transferPhone" label="Telefone de transferência" placeholder="5541999999999" />
            <label class="mt-4 block">
              <span class="mb-1.5 block text-sm font-semibold text-[--ka-fg]">Condições de transferência</span>
              <textarea v-model="form.transferConditions" class="input-field min-h-28 py-3" placeholder="Quando o cliente pedir humano, reclamações, fechamento..." />
            </label>
          </article>
        </aside>
      </section>

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
import { FileText, Play, Sparkles, Upload } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const toast = useToast();
const activeTab = ref("config");
const loading = ref(true);
const saving = ref(false);
const playgroundLoading = ref(false);
const assistant = ref<any>(null);
const knowledge = ref<any[]>([]);
const form = reactive({ name: "Assistente Karis", instructions: "", isActive: true, personality: "", transferPhone: "", transferConditions: "" });
const knowledgeForm = reactive({ title: "", content: "" });
const playgroundMessage = ref("Como vocês podem me ajudar no atendimento?");
const playgroundReply = ref("");

const tabs = [
  { key: "config", label: "Configuração" },
  { key: "knowledge", label: "Conhecimento" },
  { key: "training", label: "Treinamento" },
  { key: "playground", label: "Playground" },
];

const personalityOptions = [
  { value: "", label: "Padrão Karis" },
  { value: "prestativo", label: "Prestativo" },
  { value: "direto", label: "Direto" },
  { value: "formal", label: "Formal" },
  { value: "descontraido", label: "Descontraído" },
];

const assistantStatus = computed(() => assistant.value?.isActive ? "Ativa · pronta para responder conversas reais." : "Inativa · publique mudanças para retomar o atendimento.");

watch(activeTab, (value) => {
  if (value === "training") activeTab.value = "knowledge";
});

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
    toast.error(err?.data?.message || err?.message || "Nao foi possivel publicar as mudancas.");
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
  playgroundLoading.value = true;
  playgroundReply.value = "";
  try {
    const res = await api.fetch<any>("/assistant/playground", {
      method: "POST",
      body: JSON.stringify({ message: playgroundMessage.value }),
    });
    playgroundReply.value = res.reply || "";
    activeTab.value = "playground";
  } finally {
    playgroundLoading.value = false;
  }
}

onMounted(loadAgent);
</script>
