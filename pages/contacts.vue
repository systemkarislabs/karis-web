<template>
  <NuxtLayout name="default">
    <div class="contacts-v2">
      <!-- Header -->
      <div class="contacts-v2-header">
        <div>
          <p class="dashboard-eyebrow">Contatos</p>
          <h1 style="font-family:var(--ka-font-display);font-size:26px;font-weight:700;letter-spacing:-0.01em;color:var(--ka-fg);margin:2px 0 4px;">
            Base de clientes
          </h1>
          <p style="font-size:14px;color:var(--ka-fg-muted);">
            {{ contacts.length }} contatos · {{ optedInCount }} ativos · {{ pendingCount }} aguardando você
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <Button variant="secondary" size="sm">
            <Upload class="h-4 w-4" />
            Importar CSV
          </Button>
          <Button size="sm">
            <Plus class="h-4 w-4" />
            Novo contato
          </Button>
        </div>
      </div>

      <!-- 4 Stat cards -->
      <div class="contacts-stat-grid" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-brand-50);color:var(--ka-brand);">
            <Users class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">{{ contacts.length }}</div>
            <div class="lbl">Contatos totais</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-success-bg);color:var(--ka-success);">
            <TrendingUp class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">+{{ newThisWeek }}</div>
            <div class="lbl">Novos esta semana</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-warning-bg);color:var(--ka-warning);">
            <Clock class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">{{ pendingCount }}</div>
            <div class="lbl">Aguardando resposta</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="ico" style="background:var(--ka-bot-bg);color:var(--ka-bot);">
            <Star class="h-5 w-5" />
          </div>
          <div class="txt">
            <div class="num">{{ vipCount }}</div>
            <div class="lbl">Contatos VIP</div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div style="position:relative;display:flex;align-items:center;">
          <Search class="h-4 w-4" style="position:absolute;left:10px;color:var(--ka-fg-muted);pointer-events:none;" />
          <input v-model="search" class="input-field" style="padding-left:32px;width:220px;" placeholder="Buscar nome ou telefone…" />
        </div>
        <div class="chips">
          <button
            v-for="f in chipFilters"
            :key="f.key"
            class="chip"
            :class="{ on: activeChip === f.key }"
            type="button"
            @click="activeChip = f.key; page = 1"
          >
            {{ f.label }}
          </button>
        </div>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <Button variant="ghost" size="sm">
            <Filter class="h-4 w-4" />
            Mais filtros
          </Button>
          <Button variant="ghost" size="sm">
            <Download class="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="ghost" size="icon" aria-label="Atualizar" @click="loadContacts">
            <RefreshCw class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Bulk action bar -->
      <div v-if="selected.size > 0" class="bulk-bar">
        <span style="font-size:13px;color:var(--ka-brand-dark);font-weight:600;">
          {{ selected.size }} selecionado{{ selected.size > 1 ? 's' : '' }}
        </span>
        <Button variant="secondary" size="sm"><Tag class="h-4 w-4" />Adicionar tag</Button>
        <Button variant="secondary" size="sm"><Megaphone class="h-4 w-4" />Enviar campanha</Button>
        <Button variant="secondary" size="sm" style="color:var(--ka-danger);">
          <Archive class="h-4 w-4" />Arquivar
        </Button>
        <Button variant="ghost" size="sm" style="margin-left:auto;" @click="selected.clear(); selected = new Set()">
          Limpar seleção
        </Button>
      </div>

      <!-- Table -->
      <div class="contacts-table-wrap">
        <div v-if="loading" class="p-4 space-y-2">
          <Skeleton v-for="i in 8" :key="i" height="3.5rem" />
        </div>

        <table v-else>
          <thead>
            <tr>
              <th style="width:36px;">
                <input
                  type="checkbox"
                  :checked="selected.size === pagedContacts.length && pagedContacts.length > 0"
                  style="cursor:pointer;"
                  @change="toggleAll"
                />
              </th>
              <th>Nome</th>
              <th>Canal</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Última conversa</th>
              <th>Score IA</th>
              <th style="width:40px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="contact in pagedContacts"
              :key="contact.id"
              :class="{ sel: selected.has(contact.id) }"
              @click="openDrawer(contact)"
            >
              <td @click.stop>
                <input
                  type="checkbox"
                  :checked="selected.has(contact.id)"
                  style="cursor:pointer;"
                  @change="toggleSelect(contact.id)"
                />
              </td>
              <td>
                <div class="name-cell">
                  <Avatar :name="contact.name || contact.phone" size="sm" />
                  <div>
                    <div class="nm">{{ contact.name || "Sem nome" }}</div>
                    <div class="ph">{{ contact.phone || "" }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="chan">
                  <span style="width:7px;height:7px;border-radius:999px;background:var(--ka-whatsapp);display:inline-block;flex-shrink:0;"></span>
                  WhatsApp
                </span>
              </td>
              <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <span
                    v-for="tag in (contact.tags || []).slice(0, 3)"
                    :key="tag"
                    style="height:22px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:500;display:inline-flex;align-items:center;background:var(--ka-gray-100);color:var(--ka-fg-2);"
                  >{{ tag }}</span>
                </div>
              </td>
              <td>
                <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ka-fg-2);">
                  <span
                    style="width:7px;height:7px;border-radius:999px;flex-shrink:0;"
                    :style="{ background: contact.optedInWhatsapp ? 'var(--ka-success)' : 'var(--ka-fg-muted)' }"
                  ></span>
                  {{ contact.optedInWhatsapp ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td style="font-size:13px;color:var(--ka-fg-muted);">
                {{ contact.updatedAt ? relativeTime(contact.updatedAt) : '—' }}
              </td>
              <td>
                <span
                  v-if="contact.aiScore"
                  class="contact-ai-score"
                  :class="aiScoreClass(contact.aiScore)"
                >{{ contact.aiScore }}</span>
                <span v-else style="color:var(--ka-fg-muted);font-size:13px;">—</span>
              </td>
              <td @click.stop>
                <button
                  style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;color:var(--ka-fg-muted);background:none;border:none;cursor:pointer;"
                  @click="openDrawer(contact)"
                >
                  <MoreHorizontal class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="!loading && totalPages > 1" class="pagination">
          <span>Mostrando {{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, filteredContacts.length) }} de {{ filteredContacts.length }} contatos</span>
          <div class="pages">
            <button class="pg" type="button" :disabled="page === 1" @click="page--">‹</button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="pg"
              :class="{ on: p === page }"
              type="button"
              @click="page = p"
            >{{ p }}</button>
            <button class="pg" type="button" :disabled="page === totalPages" @click="page++">›</button>
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
              <div style="display:flex;align-items:center;gap:12px;">
                <Avatar :name="drawerContact.name || drawerContact.phone" size="md" />
                <div>
                  <h3 style="font-size:16px;font-weight:600;color:var(--ka-fg);margin:0;">{{ drawerContact.name || "Sem nome" }}</h3>
                  <div style="font-size:12px;color:var(--ka-fg-muted);font-family:var(--ka-font-mono);margin-top:2px;">{{ drawerContact.phone }}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" @click="drawerContact = null">
                <X class="h-4 w-4" />
              </Button>
            </div>

            <div class="drawer-body">
              <!-- Actions -->
              <div style="display:flex;gap:6px;margin-bottom:18px;">
                <Button size="sm" style="flex:1;justify-content:center;" @click="navigateTo('/inbox')">
                  <MessageSquare class="h-4 w-4" />Conversar
                </Button>
                <Button variant="secondary" size="sm" style="flex:1;justify-content:center;">
                  <Phone class="h-4 w-4" />Ligar
                </Button>
                <Button variant="secondary" size="icon">
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </div>

              <!-- Resumo -->
              <div style="margin-bottom:18px;">
                <h5 style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--ka-fg-muted);margin-bottom:10px;">Resumo</h5>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                  <div style="background:var(--ka-gray-50);border:1px solid var(--ka-border);border-radius:10px;padding:10px 12px;">
                    <div style="font-size:11px;color:var(--ka-fg-muted);">Total gasto</div>
                    <div style="font-family:var(--ka-font-display);font-weight:700;font-size:20px;margin-top:4px;letter-spacing:-0.01em;">
                      {{ drawerContact.lastPurchaseAt ? formatMoney(drawerContact.totalSpentCents || 0) : 'R$ 0' }}
                    </div>
                  </div>
                  <div style="background:var(--ka-gray-50);border:1px solid var(--ka-border);border-radius:10px;padding:10px 12px;">
                    <div style="font-size:11px;color:var(--ka-fg-muted);">Negócios</div>
                    <div style="font-family:var(--ka-font-display);font-weight:700;font-size:20px;margin-top:4px;letter-spacing:-0.01em;">
                      {{ drawerContact.dealsCount ?? 0 }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tags -->
              <div v-if="(drawerContact.tags || []).length" style="margin-bottom:18px;">
                <h5 style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--ka-fg-muted);margin-bottom:10px;">Tags</h5>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  <span
                    v-for="tag in drawerContact.tags"
                    :key="tag"
                    style="height:24px;padding:0 10px;border-radius:999px;font-size:11px;display:inline-flex;align-items:center;background:var(--ka-gray-100);color:var(--ka-fg-2);"
                  >{{ tag }}</span>
                  <button style="height:24px;padding:0 10px;border-radius:999px;font-size:11px;display:inline-flex;align-items:center;gap:4px;border:1px dashed var(--ka-border);background:none;color:var(--ka-fg-muted);cursor:pointer;">
                    <Plus class="h-3 w-3" />Adicionar
                  </button>
                </div>
              </div>

              <!-- Informações -->
              <div style="margin-bottom:18px;">
                <h5 style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--ka-fg-muted);margin-bottom:10px;">Informações</h5>
                <div style="display:flex;flex-direction:column;gap:0;">
                  <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--ka-divider);font-size:13px;">
                    <span style="color:var(--ka-fg-muted);">Canal</span>
                    <span style="font-weight:500;color:var(--ka-fg);display:flex;align-items:center;gap:5px;">
                      <span style="width:7px;height:7px;border-radius:999px;background:var(--ka-whatsapp);display:inline-block;"></span>
                      WhatsApp
                    </span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--ka-divider);font-size:13px;">
                    <span style="color:var(--ka-fg-muted);">Email</span>
                    <span style="font-weight:500;color:var(--ka-fg);">{{ drawerContact.email || 'Não informado' }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--ka-divider);font-size:13px;">
                    <span style="color:var(--ka-fg-muted);">Score da IA</span>
                    <span style="font-weight:500;color:var(--ka-fg);">{{ drawerContact.aiScore ? `${drawerContact.aiScore}/100` : '—' }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--ka-divider);font-size:13px;">
                    <span style="color:var(--ka-fg-muted);">Última conversa</span>
                    <span style="font-weight:500;color:var(--ka-fg);">{{ drawerContact.updatedAt ? relativeTime(drawerContact.updatedAt) : '—' }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--ka-divider);font-size:13px;">
                    <span style="color:var(--ka-fg-muted);">1º contato</span>
                    <span style="font-weight:500;color:var(--ka-fg);">{{ drawerContact.createdAt ? formatDate(drawerContact.createdAt) : '—' }}</span>
                  </div>
                  <div v-if="drawerContact.city || drawerContact.state" style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px;">
                    <span style="color:var(--ka-fg-muted);">Cidade</span>
                    <span style="font-weight:500;color:var(--ka-fg);">{{ [drawerContact.city, drawerContact.state].filter(Boolean).join(', ') }}</span>
                  </div>
                </div>
              </div>

              <!-- Atividade recente -->
              <div>
                <h5 style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--ka-fg-muted);margin-bottom:10px;">Atividade recente</h5>
                <div style="display:flex;flex-direction:column;gap:12px;">
                  <div style="display:flex;gap:10px;font-size:13px;">
                    <div style="width:28px;height:28px;border-radius:8px;background:var(--ka-bot-bg);color:var(--ka-bot);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <Sparkles class="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div style="font-weight:500;">A IA respondeu sobre horário</div>
                      <div style="font-size:12px;color:var(--ka-fg-muted);margin-top:2px;">{{ relativeTime(drawerContact.updatedAt || drawerContact.createdAt) }}</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:10px;font-size:13px;">
                    <div style="width:28px;height:28px;border-radius:8px;background:var(--ka-brand-50);color:var(--ka-brand);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <MessageSquare class="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div style="font-weight:500;">Conversa aberta no WhatsApp</div>
                      <div style="font-size:12px;color:var(--ka-fg-muted);margin-top:2px;">{{ formatDate(drawerContact.createdAt) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="drawer-foot">
              <Button variant="ghost" @click="drawerContact = null" style="flex:1;">Fechar</Button>
              <Button variant="secondary" style="flex:1;">
                <Edit class="h-4 w-4" />Editar
              </Button>
            </div>
          </div>
        </template>
      </Teleport>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Archive, Clock, Download, Edit, Filter, Megaphone, MessageSquare, MoreHorizontal, Phone, Plus, RefreshCw, Search, Sparkles, Star, Tag, TrendingUp, Upload, Users, X } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const contacts = ref<any[]>([]);
const drawerContact = ref<any | null>(null);
const search = ref("");
const activeChip = ref("all");
const page = ref(1);
const perPage = 20;
let selected = ref(new Set<string>());

const chipFilters = [
  { key: "all",      label: "Todos" },
  { key: "active",   label: "Ativos" },
  { key: "pending",  label: "Aguardando" },
  { key: "vip",      label: "VIP" },
  { key: "leads",    label: "Só leads" },
  { key: "inactive", label: "Inativos 30d+" },
];

const optedInCount  = computed(() => contacts.value.filter(c => c.optedInWhatsapp).length);
const pendingCount  = computed(() => contacts.value.filter(c => !c.optedInWhatsapp).length);
const vipCount      = computed(() => contacts.value.filter(c => (c.tags || []).includes("vip")).length);
const newThisWeek   = computed(() => {
  const cutoff = Date.now() - 7 * 86400_000;
  return contacts.value.filter(c => c.createdAt && new Date(c.createdAt).getTime() > cutoff).length;
});

const filteredContacts = computed(() => {
  const q = search.value.trim().toLowerCase();
  return contacts.value.filter(c => {
    if (activeChip.value === "active"   && !c.optedInWhatsapp) return false;
    if (activeChip.value === "pending"  && c.optedInWhatsapp)  return false;
    if (activeChip.value === "vip"      && !(c.tags || []).includes("vip"))  return false;
    if (activeChip.value === "leads"    && !(c.tags || []).includes("lead")) return false;
    if (activeChip.value === "inactive") {
      const cutoff = Date.now() - 30 * 86400_000;
      if (!c.updatedAt || new Date(c.updatedAt).getTime() > cutoff) return false;
    }
    if (!q) return true;
    return `${c.name || ""} ${c.phone || ""} ${c.email || ""}`.toLowerCase().includes(q);
  });
});

const totalPages    = computed(() => Math.ceil(filteredContacts.value.length / perPage));
const pagedContacts = computed(() => filteredContacts.value.slice((page.value - 1) * perPage, page.value * perPage));

watch(filteredContacts, () => { page.value = 1; });

function aiScoreClass(score: number) {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cool";
}

function toggleSelect(id: string) {
  const s = new Set(selected.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selected.value = s;
}

function toggleAll() {
  if (selected.value.size === pagedContacts.value.length) {
    selected.value = new Set();
  } else {
    selected.value = new Set(pagedContacts.value.map(c => c.id));
  }
}

function openDrawer(contact: any) {
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

<style scoped>
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--ka-brand-50);
  border: 1px solid var(--ka-brand-100);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
