<template>
  <NuxtLayout name="default">
    <div class="ka-page" style="max-width:960px">

      <!-- Header -->
      <div class="page-header">
        <div>
          <p class="page-header-eyebrow">Atendimento</p>
          <h1>Fila de Atendimento</h1>
          <p class="page-header-description">
            <template v-if="stats">
              <strong>{{ stats.waiting }}</strong> aguardando ·
              espera máxima <strong>{{ formatWait(stats.longestWaitSeconds) }}</strong>
            </template>
            <template v-else-if="loading">Carregando...</template>
            <template v-else>Nenhuma conversa na fila.</template>
          </p>
        </div>
        <div class="page-header-actions">
          <Button variant="secondary" size="sm" @click="refresh" :disabled="loading">
            <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            Atualizar
          </Button>
        </div>
      </div>

      <!-- Stats strip -->
      <div v-if="stats" class="dashboard-kpis" style="margin-bottom:20px">
        <div class="dashboard-kpi">
          <p>Aguardando</p>
          <strong>{{ stats.waiting }}</strong>
          <div class="dashboard-kpi-icon"><Users class="h-5 w-5" /></div>
        </div>
        <div class="dashboard-kpi">
          <p>Espera máxima</p>
          <strong>{{ formatWait(stats.longestWaitSeconds) }}</strong>
          <div class="dashboard-kpi-icon"><Clock class="h-5 w-5" /></div>
        </div>
        <div class="dashboard-kpi">
          <p>Urgentes (&gt;5min)</p>
          <strong>{{ queue.filter(i => i.waitSeconds > 300).length }}</strong>
          <div class="dashboard-kpi-icon"><AlertTriangle class="h-5 w-5" /></div>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading && queue.length === 0" style="display:flex;flex-direction:column;gap:12px">
        <div v-for="i in 4" :key="i" class="dashboard-panel" style="padding:20px;display:flex;align-items:center;gap:16px">
          <Skeleton height="44px" width="44px" style="border-radius:50%;flex-shrink:0" />
          <div style="flex:1;display:flex;flex-direction:column;gap:8px">
            <Skeleton height="14px" width="160px" />
            <Skeleton height="12px" width="240px" />
          </div>
          <Skeleton height="28px" width="80px" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && queue.length === 0" class="dashboard-panel" style="padding:56px 32px;text-align:center">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--ka-gray-100);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <CheckCircle class="h-6 w-6" style="color:var(--ka-success)" />
        </div>
        <h2 style="font-size:17px;font-weight:600;color:var(--ka-fg);margin-bottom:6px">Fila vazia</h2>
        <p style="font-size:14px;color:var(--ka-fg-muted);max-width:340px;margin:0 auto">
          Nenhuma conversa aguardando atendimento no momento. Quando clientes solicitarem atendimento humano, aparecerão aqui.
        </p>
      </div>

      <!-- Queue list -->
      <div v-else style="display:flex;flex-direction:column;gap:10px">
        <div
          v-for="(item, idx) in queue"
          :key="item.id"
          class="dashboard-panel"
          style="padding:16px 20px;display:flex;align-items:center;gap:16px;transition:box-shadow 120ms"
          :style="item.waitSeconds > 300 ? 'border-color:var(--ka-danger);background:var(--ka-danger-bg)' : ''"
        >
          <!-- Position badge -->
          <div style="width:28px;height:28px;border-radius:50%;background:var(--ka-gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:700;color:var(--ka-fg-muted)">
            {{ idx + 1 }}
          </div>

          <!-- Avatar -->
          <Avatar :name="item.contact?.name || item.contact?.phone" size="md" />

          <!-- Info -->
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;color:var(--ka-fg);font-size:14px;margin-bottom:2px">
              {{ item.contact?.name || item.contact?.phone || "Desconhecido" }}
            </p>
            <p v-if="item.contact?.name && item.contact?.phone" style="font-size:12px;color:var(--ka-fg-muted);margin-bottom:4px">
              {{ item.contact.phone }}
            </p>
            <p v-if="item.lastMessage?.content" style="font-size:12px;color:var(--ka-fg-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:420px">
              <MessageSquare class="h-3 w-3" style="display:inline;margin-right:4px;vertical-align:middle" />
              {{ item.lastMessage.content.slice(0, 90) }}{{ item.lastMessage.content.length > 90 ? '…' : '' }}
            </p>
          </div>

          <!-- Wait badge -->
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
            <span
              style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600"
              :style="item.waitSeconds > 300
                ? 'background:var(--ka-danger-bg);color:var(--ka-danger)'
                : item.waitSeconds > 120
                  ? 'background:#fef3c7;color:#92400e'
                  : 'background:var(--ka-gray-100);color:var(--ka-fg-muted)'"
            >
              <Clock class="h-3 w-3" />
              {{ formatWait(item.waitSeconds) }}
            </span>
            <span v-if="item.assignedUser" style="font-size:11px;color:var(--ka-fg-muted)">
              → {{ item.assignedUser.name }}
            </span>
          </div>

          <!-- Pickup button -->
          <Button
            size="sm"
            @click="pickup(item.id)"
            :disabled="pickingUp === item.id"
            style="flex-shrink:0"
          >
            <UserCheck class="h-4 w-4" />
            {{ pickingUp === item.id ? 'Atribuindo…' : 'Atender' }}
          </Button>
        </div>
      </div>

    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle, Clock, MessageSquare, RefreshCw, UserCheck, Users } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const toast = useToast();

const queue = ref<any[]>([]);
const stats = ref<{ waiting: number; longestWaitSeconds: number } | null>(null);
const loading = ref(false);
const pickingUp = ref<string | null>(null);

function formatWait(seconds: number) {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
}

async function refresh() {
  loading.value = true;
  try {
    const [queueRes, statsRes] = await Promise.all([
      api.fetch<any>("/queue"),
      api.fetch<any>("/queue/stats"),
    ]);
    queue.value = queueRes.queue ?? [];
    stats.value = statsRes;
  } catch {
    toast.error("Erro ao carregar fila.");
  } finally {
    loading.value = false;
  }
}

async function pickup(conversationId: string) {
  pickingUp.value = conversationId;
  try {
    await api.fetch(`/queue/${conversationId}/pickup`, { method: "POST" });
    toast.success("Conversa atribuída a você!");
    await refresh();
    navigateTo("/inbox");
  } catch (err: any) {
    toast.error(err?.data?.message || "Erro ao atribuir conversa.");
  } finally {
    pickingUp.value = null;
  }
}

let interval: ReturnType<typeof setInterval>;
onMounted(() => {
  refresh();
  interval = setInterval(refresh, 30_000);
});
onUnmounted(() => clearInterval(interval));
</script>
