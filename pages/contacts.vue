<template>
  <NuxtLayout name="default">
    <div class="contacts-v2">
      <!-- Header -->
      <div class="contacts-v2-header">
        <div>
          <p class="dashboard-eyebrow">Contatos</p>
          <h1 style="font-family: var(--ka-font-display); font-size: 26px; font-weight: 700; letter-spacing: -0.01em; color: var(--ka-fg); margin: 2px 0 4px;">
            Base de clientes
          </h1>
          <p style="font-size: 14px; color: var(--ka-fg-muted);">{{ contacts.length }} contatos carregados.</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <input v-model="search" class="input-field" style="width: 240px;" placeholder="Buscar nome, telefone ou email" />
          <Button variant="secondary" size="sm" @click="loadContacts">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm">
            <Plus class="h-4 w-4" />
            Novo contato
          </Button>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="contacts-stat-grid">
        <div class="stat-card">
          <div class="ico" style="background: #eff6ff;">
            <Users class="h-5 w-5" style="color: #2563eb;" />
          </div>
          <div class="txt">
            <div class="num">{{ contacts.length }}</div>
            <div class="lbl">Total de contatos</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background: #f0fdf4;">
            <CheckCircle class="h-5 w-5" style="color: #16a34a;" />
          </div>
          <div class="txt">
            <div class="num">{{ optedInCount }}</div>
            <div class="lbl">Com opt-in WhatsApp</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background: #fdf4ff;">
            <Mail class="h-5 w-5" style="color: #9333ea;" />
          </div>
          <div class="txt">
            <div class="num">{{ withEmailCount }}</div>
            <div class="lbl">Com email cadastrado</div>
          </div>
        </div>
      </div>

      <!-- Toolbar + filter chips -->
      <div class="toolbar">
        <div class="chips">
          <button
            v-for="f in chipFilters"
            :key="f.key"
            class="chip"
            :class="{ on: activeChip === f.key }"
            type="button"
            @click="activeChip = f.key"
          >
            {{ f.label }}
          </button>
        </div>
        <div style="margin-left: auto; display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 12px; color: var(--ka-fg-muted);">{{ filteredContacts.length }} contatos</span>
        </div>
      </div>

      <!-- Table -->
      <div class="contacts-table-wrap">
        <div v-if="loading" class="p-4 space-y-2">
          <Skeleton v-for="i in 8" :key="i" height="3.5rem" />
        </div>

        <table v-else>
          <thead>
            <tr>
              <th style="width: 36px;"><input type="checkbox" style="cursor: pointer;" /></th>
              <th>Contato</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Score IA</th>
              <th>1º contato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="contact in pagedContacts"
              :key="contact.id"
              :class="{ sel: selectedContact?.id === contact.id }"
              @click="openDrawer(contact)"
            >
              <td @click.stop><input type="checkbox" style="cursor: pointer;" /></td>
              <td>
                <div class="name-cell">
                  <Avatar :name="contact.name || contact.phone" size="sm" />
                  <div>
                    <div class="nm">{{ contact.name || "Sem nome" }}</div>
                    <div class="ph">{{ contact.phone || "" }}</div>
                  </div>
                </div>
              </td>
              <td style="font-family: var(--ka-font-mono); font-size: 13px; color: var(--ka-fg-muted);">
                {{ contact.phone || "—" }}
              </td>
              <td style="font-size: 13px; color: var(--ka-fg-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ contact.email || "—" }}
              </td>
              <td>
                <Badge :variant="contact.optedInWhatsapp ? 'success' : 'neutral'" size="sm" dot>
                  {{ contact.optedInWhatsapp ? "Ativo" : "Sem opt-in" }}
                </Badge>
              </td>
              <td>
                <span v-if="contact.aiScore" class="contact-ai-score" :class="aiScoreClass(contact.aiScore)">
                  {{ contact.aiScore }}
                </span>
                <span v-else style="color: var(--ka-fg-muted); font-size: 13px;">—</span>
              </td>
              <td style="font-size: 13px; color: var(--ka-fg-muted); white-space: nowrap;">
                {{ contact.createdAt ? relativeTime(contact.createdAt) : "—" }}
              </td>
              <td @click.stop>
                <button
                  class="table-action"
                  title="Ver detalhes"
                  @click="openDrawer(contact)"
                  style="display: inline-flex; align-items: center; justify-content: center; padding: 5px; border-radius: 6px; color: var(--ka-fg-muted); background: none; border: none; cursor: pointer;"
                >
                  <ChevronRight class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="!loading && totalPages > 1" class="pagination">
          <span>{{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, filteredContacts.length) }} de {{ filteredContacts.length }}</span>
          <div class="pages">
            <button
              v-for="p in totalPages"
              :key="p"
              class="pg"
              :class="{ on: p === page }"
              type="button"
              @click="page = p"
            >{{ p }}</button>
          </div>
        </div>

        <EmptyState v-if="!loading && !filteredContacts.length" :icon="Users" title="Nenhum contato encontrado" description="A busca não encontrou registros nesta conta." />
      </div>

      <!-- Drawer -->
      <Teleport to="body">
        <template v-if="drawerContact">
          <div class="drawer-backdrop" @click="drawerContact = null" />
          <div class="drawer">
            <div class="drawer-head">
              <h3>{{ drawerContact.name || "Contato" }}</h3>
              <Button variant="ghost" size="icon" aria-label="Fechar" @click="drawerContact = null">
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div class="drawer-body">
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                <Avatar :name="drawerContact.name || drawerContact.phone" size="lg" />
                <div>
                  <div style="font-weight: 700; font-size: 17px; color: var(--ka-fg);">{{ drawerContact.name || "Sem nome" }}</div>
                  <div style="font-size: 13px; color: var(--ka-fg-muted); margin-top: 3px;">{{ drawerContact.phone }}</div>
                </div>
              </div>

              <dl style="display: flex; flex-direction: column; gap: 0;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--ka-divider); font-size: 14px;">
                  <dt style="color: var(--ka-fg-muted);">Email</dt>
                  <dd style="font-weight: 500; color: var(--ka-fg);">{{ drawerContact.email || "Não informado" }}</dd>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--ka-divider); font-size: 14px;">
                  <dt style="color: var(--ka-fg-muted);">WhatsApp</dt>
                  <dd style="font-weight: 500; color: var(--ka-fg);">{{ drawerContact.optedInWhatsapp ? "Autorizado" : "Sem opt-in" }}</dd>
                </div>
                <div v-if="drawerContact.city || drawerContact.state" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--ka-divider); font-size: 14px;">
                  <dt style="color: var(--ka-fg-muted);">Cidade</dt>
                  <dd style="font-weight: 500; color: var(--ka-fg);">{{ [drawerContact.city, drawerContact.state].filter(Boolean).join(", ") }}</dd>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--ka-divider); font-size: 14px;">
                  <dt style="color: var(--ka-fg-muted);">1º contato</dt>
                  <dd style="font-weight: 500; color: var(--ka-fg);">{{ drawerContact.createdAt ? formatDate(drawerContact.createdAt) : "—" }}</dd>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--ka-divider); font-size: 14px;">
                  <dt style="color: var(--ka-fg-muted);">Última atualização</dt>
                  <dd style="font-weight: 500; color: var(--ka-fg);">{{ drawerContact.updatedAt ? relativeTime(drawerContact.updatedAt) : "—" }}</dd>
                </div>
                <div v-if="drawerContact.lastPurchaseAt" style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px;">
                  <dt style="color: var(--ka-fg-muted);">Última compra</dt>
                  <dd style="font-weight: 500; color: var(--ka-fg);">{{ formatDate(drawerContact.lastPurchaseAt) }}</dd>
                </div>
              </dl>

              <div v-if="drawerContact.tags?.length" style="margin-top: 16px;">
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; color: var(--ka-fg-muted); margin-bottom: 8px;">Tags</p>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  <span
                    v-for="tag in drawerContact.tags"
                    :key="tag"
                    style="padding: 2px 10px; border-radius: 999px; background: var(--ka-gray-100); font-size: 12px; color: var(--ka-fg-2);"
                  >{{ tag }}</span>
                </div>
              </div>
            </div>
            <div class="drawer-foot">
              <Button variant="secondary" style="flex: 1;" @click="navigateTo('/inbox')">
                <MessageSquare class="h-4 w-4" />
                Ver conversas
              </Button>
              <Button style="flex: 1;" @click="drawerContact = null">Fechar</Button>
            </div>
          </div>
        </template>
      </Teleport>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { CheckCircle, ChevronRight, Mail, MessageSquare, Plus, RefreshCw, Users, X } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const contacts = ref<any[]>([]);
const selectedContact = ref<any | null>(null);
const drawerContact = ref<any | null>(null);
const search = ref("");
const activeChip = ref("all");
const page = ref(1);
const perPage = 20;

const chipFilters = [
  { key: "all",     label: "Todos" },
  { key: "optin",   label: "Ativos (opt-in)" },
  { key: "noemail", label: "Sem email" },
  { key: "email",   label: "Com email" },
];

const optedInCount  = computed(() => contacts.value.filter(c => c.optedInWhatsapp).length);
const withEmailCount = computed(() => contacts.value.filter(c => c.email).length);

const filteredContacts = computed(() => {
  const q = search.value.trim().toLowerCase();
  return contacts.value.filter(c => {
    if (activeChip.value === "optin"   && !c.optedInWhatsapp) return false;
    if (activeChip.value === "noemail" && c.email)            return false;
    if (activeChip.value === "email"   && !c.email)           return false;
    if (!q) return true;
    return `${c.name || ""} ${c.phone || ""} ${c.email || ""}`.toLowerCase().includes(q);
  });
});

const totalPages  = computed(() => Math.ceil(filteredContacts.value.length / perPage));
const pagedContacts = computed(() => filteredContacts.value.slice((page.value - 1) * perPage, page.value * perPage));

watch([filteredContacts], () => { page.value = 1; });

function aiScoreClass(score: number) {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cool";
}

function openDrawer(contact: any) {
  selectedContact.value = contact;
  drawerContact.value = contact;
}

async function loadContacts() {
  loading.value = true;
  try {
    contacts.value = unwrapList(await api.fetch<any>("/contacts?limit=200"), ["contacts"]);
  } finally {
    loading.value = false;
  }
}

onMounted(loadContacts);
</script>
