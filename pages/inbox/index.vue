<template>
  <NuxtLayout name="default">
    <div class="inbox-page">
      <aside class="inbox-filter-panel">
        <p class="inbox-section-label">Caixa</p>
        <button v-for="filter in filters" :key="filter.key" class="inbox-filter" :class="{ 'is-active': activeFilter === filter.key }" type="button" @click="activeFilter = filter.key">
          <span>{{ filter.label }}</span>
          <b>{{ filter.count }}</b>
        </button>

        <p class="inbox-section-label">Status</p>
        <button v-for="status in statusFilters" :key="status.key" class="inbox-filter" :class="{ 'is-active': activeFilter === status.key }" type="button" @click="activeFilter = status.key">
          <span>{{ status.label }}</span>
          <b>{{ status.count }}</b>
        </button>
      </aside>

      <section class="inbox-list-panel">
        <header class="inbox-panel-header">
          <div>
            <h1>Conversas</h1>
            <p>{{ filteredConversations.length }} de {{ conversations.length }} atendimentos</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Atualizar conversas" @click="loadConversations">
            <RefreshCw class="h-4 w-4" />
          </Button>
        </header>
        <input v-model="search" class="input-field inbox-search" placeholder="Buscar contato ou mensagem" />

        <div class="inbox-list-scroll scrollbar-thin">
          <div v-if="loadingConversations" class="space-y-2 p-2">
            <Skeleton v-for="i in 8" :key="i" height="4.75rem" />
          </div>
          <button
            v-for="conv in filteredConversations"
            v-else
            :key="conv.id"
            class="inbox-thread"
            :class="{ 'is-active': selectedId === conv.id }"
            type="button"
            @click="selectConversation(conv.id)"
          >
            <Avatar :name="conv.contact?.name || conv.contact?.phone" size="sm" />
            <span class="inbox-thread-body">
              <strong>{{ conv.contact?.name || conv.contact?.phone || "Contato" }}</strong>
              <small>{{ conv.lastMessage?.content || "Sem mensagens ainda" }}</small>
              <em>{{ statusLabel(conv.status) }} · {{ relativeTime(conv.updatedAt) }}</em>
            </span>
            <b v-if="conv.unreadCount" class="inbox-unread">{{ conv.unreadCount }}</b>
          </button>
          <EmptyState v-if="!loadingConversations && !filteredConversations.length" :icon="MessageSquare" title="Sem conversas" description="Nenhum atendimento real encontrado para este filtro." />
        </div>
      </section>

      <section class="inbox-chat-panel">
        <template v-if="selectedConversation">
          <header class="inbox-chat-header">
            <Avatar :name="selectedContact?.name || selectedContact?.phone" size="md" />
            <div>
              <h2>{{ selectedContact?.name || selectedContact?.phone || "Contato" }}</h2>
              <p>{{ selectedContact?.phone || "Telefone não informado" }} · {{ statusLabel(selectedConversation.status) }}</p>
            </div>
            <div class="inbox-chat-actions">
              <Button variant="secondary" size="sm" @click="markRead">
                <Check class="h-4 w-4" />
                Marcar lida
              </Button>
              <Button variant="ghost" size="icon" aria-label="Mais ações">
                <MoreHorizontal class="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div class="inbox-messages scrollbar-thin">
            <div v-if="loadingMessages" class="space-y-3">
              <Skeleton v-for="i in 7" :key="i" height="3.2rem" />
            </div>
            <template v-else>
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="inbox-message"
                :class="msg.direction === 'INBOUND' ? 'is-inbound' : msg.senderType === 'AI' ? 'is-ai' : 'is-outbound'"
              >
                <p v-if="msg.senderType === 'AI'" class="inbox-message-agent">
                  <Sparkles class="h-3.5 w-3.5" />
                  IA Karis
                </p>
                <p>{{ msg.content }}</p>
                <time>{{ formatDateTime(msg.createdAt) }}</time>
              </div>

              <article v-if="lastAiMessage" class="inbox-ai-suggestion">
                <p><Sparkles class="h-4 w-4" /> Sugestão da IA</p>
                <strong>{{ lastAiMessage.content }}</strong>
                <div>
                  <Button size="sm" @click="draft = lastAiMessage.content">Editar antes</Button>
                  <Button variant="secondary" size="sm" @click="draft = lastAiMessage.content; sendMessage()">Aceitar e enviar</Button>
                </div>
              </article>

              <EmptyState v-if="!messages.length" :icon="MessageSquare" title="Conversa sem mensagens" description="As mensagens reais deste atendimento aparecerão aqui." />
            </template>
          </div>

          <form class="inbox-composer" @submit.prevent="sendMessage">
            <textarea v-model="draft" class="input-field" rows="1" placeholder="Digite uma mensagem para o cliente" />
            <Button type="submit" size="icon" :loading="sending" :disabled="!draft.trim() || sending" aria-label="Enviar mensagem">
              <Send class="h-4 w-4" />
            </Button>
          </form>
        </template>

        <EmptyState v-else class="m-auto" :icon="MessageSquare" title="Selecione uma conversa" description="Escolha um atendimento real para ver mensagens e dados do contato." />
      </section>

      <aside v-if="selectedConversation" class="inbox-detail-panel">
        <Avatar :name="selectedContact?.name || selectedContact?.phone" size="lg" />
        <h2>{{ selectedContact?.name || "Contato" }}</h2>
        <p>{{ selectedContact?.phone || "Sem telefone" }}</p>

        <div class="inbox-detail-actions">
          <Button variant="secondary" size="sm">
            <Phone class="h-4 w-4" />
            Ligar
          </Button>
          <Button variant="secondary" size="sm">
            <UserRound class="h-4 w-4" />
            Perfil
          </Button>
        </div>

        <dl class="inbox-contact-fields">
          <div>
            <dt>Email</dt>
            <dd>{{ selectedContact?.email || "Não informado" }}</dd>
          </div>
          <div>
            <dt>Origem</dt>
            <dd>{{ selectedConversation.channel || "WhatsApp" }}</dd>
          </div>
          <div>
            <dt>Última compra</dt>
            <dd>{{ selectedContact?.lastPurchaseAt ? formatDate(selectedContact.lastPurchaseAt) : "Sem registro" }}</dd>
          </div>
          <div>
            <dt>Atualizado</dt>
            <dd>{{ formatDateTime(selectedConversation.updatedAt) }}</dd>
          </div>
        </dl>

        <div class="inbox-tags">
          <span v-for="tag in selectedTags" :key="tag">{{ tag }}</span>
          <span v-if="!selectedTags.length">Sem tags</span>
        </div>
      </aside>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Check, MessageSquare, MoreHorizontal, Phone, RefreshCw, Send, Sparkles, UserRound } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const route = useRoute();
const api = useApi();
const search = ref("");
const activeFilter = ref("all");
const conversations = ref<any[]>([]);
const selectedId = ref<string | null>(typeof route.query.conversation === "string" ? route.query.conversation : null);
const selectedConversation = ref<any | null>(null);
const messages = ref<any[]>([]);
const draft = ref("");
const loadingConversations = ref(true);
const loadingMessages = ref(false);
const sending = ref(false);

const filters = computed(() => [
  { key: "all", label: "Todas", count: conversations.value.length },
  { key: "open", label: "Abertas", count: conversations.value.filter(c => c.status === "OPEN").length },
  { key: "unread", label: "Não lidas", count: unreadTotal.value },
  { key: "human", label: "Com humano", count: conversations.value.filter(c => c.aiEnabled === false).length },
]);

const statusFilters = computed(() => [
  { key: "closed", label: "Fechadas", count: conversations.value.filter(c => c.status === "CLOSED").length },
  { key: "snoozed", label: "Adiada", count: conversations.value.filter(c => c.status === "SNOOZED").length },
]);

const unreadTotal = computed(() => conversations.value.reduce((sum, conv) => sum + Number(conv.unreadCount || 0), 0));
const selectedContact = computed(() => selectedConversation.value?.contact || conversations.value.find(c => c.id === selectedId.value)?.contact || null);
const selectedTags = computed(() => {
  const raw = selectedContact.value?.tags || selectedConversation.value?.tags || [];
  return Array.isArray(raw) ? raw.filter(Boolean).slice(0, 6) : [];
});
const lastAiMessage = computed(() => [...messages.value].reverse().find(msg => msg.senderType === "AI"));

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase();
  return conversations.value.filter(conv => {
    if (activeFilter.value === "open" && conv.status !== "OPEN") return false;
    if (activeFilter.value === "closed" && conv.status !== "CLOSED") return false;
    if (activeFilter.value === "snoozed" && conv.status !== "SNOOZED") return false;
    if (activeFilter.value === "unread" && !conv.unreadCount) return false;
    if (activeFilter.value === "human" && conv.aiEnabled !== false) return false;
    if (!q) return true;
    return `${conv.contact?.name || ""} ${conv.contact?.phone || ""} ${conv.lastMessage?.content || ""}`.toLowerCase().includes(q);
  });
});

async function loadConversations() {
  loadingConversations.value = true;
  try {
    const res = await api.fetch<any>("/conversations?limit=100");
    conversations.value = unwrapList(res, ["conversations"]);
    if (!selectedId.value && conversations.value[0]) selectedId.value = conversations.value[0].id;
    if (selectedId.value) await selectConversation(selectedId.value);
  } finally {
    loadingConversations.value = false;
  }
}

async function selectConversation(id: string) {
  selectedId.value = id;
  loadingMessages.value = true;
  try {
    const [convRes, msgRes] = await Promise.all([
      api.fetch<any>(`/conversations/${id}`),
      api.fetch<any>(`/messages/conversation/${id}`),
    ]);
    selectedConversation.value = convRes.conversation;
    messages.value = unwrapList(msgRes, ["messages"]);
  } finally {
    loadingMessages.value = false;
  }
}

async function markRead() {
  if (!selectedId.value) return;
  await api.fetch(`/conversations/${selectedId.value}/read`, { method: "POST" });
  await loadConversations();
}

async function sendMessage() {
  if (!selectedId.value || !draft.value.trim()) return;
  const content = draft.value.trim();
  sending.value = true;
  try {
    await api.fetch(`/messages/conversation/${selectedId.value}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    draft.value = "";
    await selectConversation(selectedId.value);
  } finally {
    sending.value = false;
  }
}

onMounted(loadConversations);
</script>
