<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Fila de Atendimento</h1>
        <p class="page-subtitle">
          <span v-if="stats">
            <strong>{{ stats.waiting }}</strong> aguardando ·
            espera máxima <strong>{{ formatWait(stats.longestWaitSeconds) }}</strong>
          </span>
          <span v-else>Carregando...</span>
        </p>
      </div>
      <Button @click="refresh" :disabled="loading" variant="secondary">
        <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': loading }" />
        Atualizar
      </Button>
    </div>

    <!-- Fila vazia -->
    <EmptyState
      v-if="!loading && queue.length === 0"
      title="Fila vazia"
      description="Nenhuma conversa aguardando atendimento no momento."
    />

    <!-- Lista da fila -->
    <div v-else class="queue-list">
      <div
        v-for="item in queue"
        :key="item.id"
        class="queue-card"
        :class="{ 'queue-card--urgent': item.waitSeconds > 300 }"
      >
        <div class="queue-card__avatar">
          <Avatar :name="item.contact.name || item.contact.phone" size="md" />
        </div>

        <div class="queue-card__info">
          <p class="queue-card__name">{{ item.contact.name || item.contact.phone }}</p>
          <p class="queue-card__phone text-xs text-[--ka-fg-muted]">{{ item.contact.phone }}</p>
          <p v-if="item.lastMessage" class="queue-card__preview">
            {{ item.lastMessage.content?.slice(0, 80) }}{{ item.lastMessage.content?.length > 80 ? '…' : '' }}
          </p>
        </div>

        <div class="queue-card__meta">
          <Badge :variant="item.waitSeconds > 300 ? 'destructive' : item.waitSeconds > 120 ? 'warning' : 'secondary'">
            <Clock class="h-3 w-3 mr-1" />
            {{ formatWait(item.waitSeconds) }}
          </Badge>
          <p v-if="item.assignedUser" class="text-xs text-[--ka-fg-muted] mt-1">
            Atribuído: {{ item.assignedUser.name }}
          </p>
        </div>

        <div class="queue-card__actions">
          <Button
            size="sm"
            @click="pickup(item.id)"
            :disabled="pickingUp === item.id"
          >
            <UserCheck class="h-4 w-4 mr-1" />
            {{ pickingUp === item.id ? 'Atribuindo...' : 'Atender' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, RefreshCw, UserCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { $api } = useNuxtApp()
const toast = useToast()

const queue = ref<any[]>([])
const stats = ref<{ waiting: number; longestWaitSeconds: number } | null>(null)
const loading = ref(false)
const pickingUp = ref<string | null>(null)

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`
}

async function refresh() {
  loading.value = true
  try {
    const [queueRes, statsRes] = await Promise.all([
      useApi('/queue'),
      useApi('/queue/stats'),
    ])
    queue.value = queueRes.queue ?? []
    stats.value = statsRes
  } catch {
    toast.error('Erro ao carregar fila.')
  } finally {
    loading.value = false
  }
}

async function pickup(conversationId: string) {
  pickingUp.value = conversationId
  try {
    await useApi(`/queue/${conversationId}/pickup`, { method: 'POST' })
    toast.success('Conversa atribuída a você!')
    await refresh()
    navigateTo(`/inbox`)
  } catch (err: any) {
    toast.error(err?.data?.message || 'Erro ao atribuir conversa.')
  } finally {
    pickingUp.value = null
  }
}

// Auto-refresh a cada 30s
let interval: ReturnType<typeof setInterval>
onMounted(() => {
  refresh()
  interval = setInterval(refresh, 30_000)
})
onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.page-container { @apply p-6 max-w-4xl mx-auto; }
.page-header    { @apply flex items-start justify-between mb-6; }
.page-title     { @apply text-2xl font-bold text-[--ka-fg]; }
.page-subtitle  { @apply text-sm text-[--ka-fg-muted] mt-1; }

.queue-list { @apply flex flex-col gap-3; }

.queue-card {
  @apply flex items-center gap-4 p-4 rounded-[--ka-r-lg]
         border border-[--ka-border] bg-[--ka-surface]
         transition-colors;
}
.queue-card--urgent {
  @apply border-red-300 bg-red-50 dark:bg-red-950/20;
}
.queue-card__info    { @apply flex-1 min-w-0; }
.queue-card__name    { @apply font-semibold text-[--ka-fg] truncate; }
.queue-card__preview {
  @apply text-xs text-[--ka-fg-muted] mt-1 truncate;
}
.queue-card__meta    { @apply flex flex-col items-end gap-1 shrink-0; }
.queue-card__actions { @apply shrink-0; }
</style>
