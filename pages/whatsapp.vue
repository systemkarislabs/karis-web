<template>
  <NuxtLayout name="default">
    <section class="ka-page space-y-6">
      <PageHeader eyebrow="Operacao" title="WhatsApp" description="Conecte e monitore a instancia Evolution vinculada a empresa.">
        <template #actions>
          <Button variant="secondary" :loading="loading" @click="load">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
          <Button v-if="status !== 'DISCONNECTED'" variant="outline" :loading="disconnecting" @click="disconnect">
            <Unplug class="h-4 w-4" />
            Desconectar
          </Button>
          <Button :loading="connecting" @click="connect">
            <QrCode class="h-4 w-4" />
            Conectar
          </Button>
        </template>
      </PageHeader>

      <div v-if="loading" class="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Skeleton class="h-64" />
        <Skeleton class="h-64" />
      </div>

      <EmptyState v-else-if="error" :icon="AlertCircle" title="WhatsApp indisponivel" :description="error" />

      <div v-else class="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card padding="lg" class="space-y-5">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-[--ka-fg]">Status</p>
            <Badge :variant="statusVariant" dot>{{ statusLabel(status) }}</Badge>
          </div>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-[--ka-fg-muted]">Numero</dt>
              <dd class="font-mono text-[--ka-fg]">{{ connection?.phoneNumber || "--" }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[--ka-fg-muted]">Instancia</dt>
              <dd class="max-w-44 truncate font-mono text-[--ka-fg]">{{ connection?.evolutionInstanceName || "--" }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[--ka-fg-muted]">Atualizado</dt>
              <dd class="text-[--ka-fg]">{{ connection?.updatedAt ? formatDateTime(connection.updatedAt) : "--" }}</dd>
            </div>
            <div v-if="connection?.lastError" class="rounded-[--ka-r-md] bg-[--ka-danger-bg] p-3 text-[--ka-danger]">
              {{ connection.lastError }}
            </div>
          </dl>
        </Card>

        <Card padding="lg" class="min-h-72">
          <div v-if="qrImageSource" class="flex flex-col items-center justify-center gap-4">
            <img :src="qrImageSource" alt="QR Code do WhatsApp" class="h-64 w-64 rounded-[--ka-radius] border border-[--ka-border] bg-white p-3" />
            <p class="text-center text-sm text-[--ka-fg-muted]">Escaneie o QR Code pelo WhatsApp para concluir a conexao.</p>
          </div>
          <div v-else-if="qrCode" class="flex flex-col items-center justify-center gap-4">
            <div class="max-w-full rounded-[--ka-r-md] border border-[--ka-border] bg-[--ka-gray-50] p-4 font-mono text-xs text-[--ka-fg-2]">
              {{ qrCode }}
            </div>
            <p class="text-center text-sm text-[--ka-fg-muted]">A API retornou um codigo de pareamento em vez de imagem.</p>
          </div>
          <EmptyState
            v-else
            :icon="MessageCircle"
            title="Nenhum QR Code ativo"
            description="Clique em conectar para solicitar um QR Code real da API."
          />
        </Card>

        <Card padding="lg" class="space-y-4 lg:col-span-2">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-display text-lg font-semibold text-[--ka-fg]">Diagnostico da conexao</h2>
              <p class="text-sm text-[--ka-fg-muted]">Dados carregados da API para confirmar configuracao, webhook e estado da Evolution.</p>
            </div>
            <Button variant="secondary" :loading="loadingDiagnostics" @click="loadDiagnostics">
              <Activity class="h-4 w-4" />
              Diagnosticar
            </Button>
          </div>

          <div v-if="diagnostics" class="grid gap-3 text-sm md:grid-cols-3">
            <div class="rounded-[--ka-r-md] border border-[--ka-border] p-3">
              <span class="text-[--ka-fg-muted]">WhatsApp habilitado</span>
              <strong class="mt-1 block text-[--ka-fg]">{{ diagnostics.enabled ? "Sim" : "Nao" }}</strong>
            </div>
            <div class="rounded-[--ka-r-md] border border-[--ka-border] p-3">
              <span class="text-[--ka-fg-muted]">Evolution configurada</span>
              <strong class="mt-1 block text-[--ka-fg]">{{ diagnostics.hasEvolutionConfig ? "Sim" : "Nao" }}</strong>
            </div>
            <div class="rounded-[--ka-r-md] border border-[--ka-border] p-3">
              <span class="text-[--ka-fg-muted]">Evolution acessivel</span>
              <strong class="mt-1 block text-[--ka-fg]">{{ diagnostics.evolutionReachable ? "Sim" : "Nao" }}</strong>
            </div>
          </div>
        </Card>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Activity, AlertCircle, MessageCircle, QrCode, RefreshCw, Unplug } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const toast = useToast();
const loading = ref(true);
const connecting = ref(false);
const disconnecting = ref(false);
const loadingDiagnostics = ref(false);
const error = ref("");
const status = ref("DISCONNECTED");
const connection = ref<any>(null);
const qrCode = ref<string | null>(null);
const diagnostics = ref<any>(null);

const statusVariant = computed(() => {
  if (status.value === "CONNECTED") return "success";
  if (status.value === "CONNECTING") return "warning";
  if (status.value === "ERROR") return "destructive";
  return "neutral";
});

const qrImageSource = computed(() => {
  if (!qrCode.value) return null;
  const value = String(qrCode.value);
  if (value.startsWith("data:image/")) return value;
  if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length > 100) return `data:image/png;base64,${value}`;
  return null;
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.fetch<any>("/whatsapp/status");
    status.value = data.status || "DISCONNECTED";
    connection.value = data.connection;
    qrCode.value = data.connection?.qrCode || null;
  } catch (err: any) {
    error.value = err?.data?.message || "Nao foi possivel carregar o WhatsApp.";
  } finally {
    loading.value = false;
  }
}

async function connect() {
  connecting.value = true;
  try {
    const data = await api.fetch<any>("/whatsapp/connect", { method: "POST", body: JSON.stringify({}) });
    status.value = data.status || "CONNECTING";
    qrCode.value = data.qrCode || null;
    toast.success(data.qrCode ? "QR Code gerado." : "Solicitacao enviada para o WhatsApp.");
    await load();
  } catch (err: any) {
    toast.error(err?.data?.message || "Nao foi possivel conectar o WhatsApp.");
  } finally {
    connecting.value = false;
  }
}

async function disconnect() {
  disconnecting.value = true;
  try {
    await api.fetch("/whatsapp/disconnect", { method: "DELETE" });
    toast.success("WhatsApp desconectado.");
    await load();
  } catch (err: any) {
    toast.error(err?.data?.message || "Nao foi possivel desconectar o WhatsApp.");
  } finally {
    disconnecting.value = false;
  }
}

async function loadDiagnostics() {
  loadingDiagnostics.value = true;
  try {
    diagnostics.value = await api.fetch("/whatsapp/diagnostics");
  } catch (err: any) {
    toast.error(err?.data?.message || "Nao foi possivel carregar o diagnostico.");
  } finally {
    loadingDiagnostics.value = false;
  }
}

onMounted(async () => {
  await load();
  await loadDiagnostics();
});
</script>
