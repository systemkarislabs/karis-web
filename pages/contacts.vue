<template>
  <NuxtLayout name="default">
    <div class="contacts-page">
      <section class="contacts-header">
        <div>
          <p>Contatos</p>
          <h1>Base de clientes</h1>
          <span>{{ contacts.length }} contatos reais carregados da API.</span>
        </div>
        <div class="contacts-actions">
          <input v-model="search" class="input-field" placeholder="Buscar por nome, telefone ou email" />
          <Button variant="secondary" size="sm" @click="loadContacts">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </section>

      <section class="contacts-stats">
        <article>
          <strong>{{ contacts.length }}</strong>
          <span>Total de contatos</span>
        </article>
        <article>
          <strong>{{ optedInCount }}</strong>
          <span>Com opt-in WhatsApp</span>
        </article>
        <article>
          <strong>{{ withEmailCount }}</strong>
          <span>Com email cadastrado</span>
        </article>
      </section>

      <section class="contacts-shell">
        <aside class="contacts-list">
          <div v-if="loading" class="space-y-2 p-3">
            <Skeleton v-for="i in 8" :key="i" height="4rem" />
          </div>
          <button
            v-for="contact in filteredContacts"
            v-else
            :key="contact.id"
            class="contact-row"
            :class="selectedContact?.id === contact.id ? 'is-active' : ''"
            type="button"
            @click="selectedContact = contact"
          >
            <Avatar :name="contact.name || contact.phone" size="sm" />
            <span>
              <strong>{{ contact.name || "Sem nome" }}</strong>
              <small>{{ contact.phone || "Sem telefone" }}</small>
            </span>
            <Badge :variant="contact.optedInWhatsapp ? 'success' : 'neutral'" size="sm" dot>
              {{ contact.optedInWhatsapp ? "opt-in" : "opt-out" }}
            </Badge>
          </button>
          <EmptyState v-if="!loading && !filteredContacts.length" title="Nenhum contato encontrado" description="A busca não encontrou registros nesta conta." />
        </aside>

        <article class="contact-detail">
          <template v-if="selectedContact">
            <div class="contact-profile">
              <Avatar :name="selectedContact.name || selectedContact.phone" size="lg" />
              <div>
                <h2>{{ selectedContact.name || "Sem nome" }}</h2>
                <p>{{ selectedContact.phone || "Sem telefone" }}</p>
              </div>
            </div>

            <dl class="contact-fields">
              <div>
                <dt>Email</dt>
                <dd>{{ selectedContact.email || "Não informado" }}</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>{{ selectedContact.optedInWhatsapp ? "Autorizado" : "Sem opt-in" }}</dd>
              </div>
              <div>
                <dt>Criado em</dt>
                <dd>{{ formatDate(selectedContact.createdAt) }}</dd>
              </div>
              <div>
                <dt>Atualizado em</dt>
                <dd>{{ formatDateTime(selectedContact.updatedAt) }}</dd>
              </div>
            </dl>

            <div class="contact-card-note">
              <MessageSquare class="h-5 w-5" />
              <span>Abra a aba Inbox para ver o histórico de conversas e mensagens deste contato.</span>
            </div>
          </template>
          <EmptyState v-else title="Selecione um contato" description="Escolha um registro da lista para ver detalhes." />
        </article>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { MessageSquare, RefreshCw } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const contacts = ref<any[]>([]);
const selectedContact = ref<any | null>(null);
const search = ref("");

const filteredContacts = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return contacts.value;
  return contacts.value.filter((contact) => `${contact.name || ""} ${contact.phone || ""} ${contact.email || ""}`.toLowerCase().includes(q));
});

const optedInCount = computed(() => contacts.value.filter((contact) => contact.optedInWhatsapp).length);
const withEmailCount = computed(() => contacts.value.filter((contact) => contact.email).length);

async function loadContacts() {
  loading.value = true;
  try {
    contacts.value = unwrapList(await api.fetch<any>("/contacts?limit=200"));
    selectedContact.value = contacts.value[0] || null;
  } finally {
    loading.value = false;
  }
}

onMounted(loadContacts);
</script>
