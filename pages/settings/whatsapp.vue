<template>
  <NuxtLayout name="default">
    <section class="ka-page space-y-6">
      <PageHeader eyebrow="Configuracoes" title="WhatsApp" description="Conecte e monitore a instancia Evolution vinculada a empresa.">
        <template #actions>
          <NuxtLink to="/settings" class="btn-ghost inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold">
            <ChevronLeft class="h-4 w-4" />
            Voltar
          </NuxtLink>
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
          </dl>
        </Card>

        <Card padding="lg" class="min-h-72">
          <div v-if="qrCode" class="flex flex-col items-center justify-center gap-4">
            <img :src="qrCode" alt="QR Code do WhatsApp" class="h-64 w-64 rounded-[--ka-radius] border border-[--ka-border] bg-white p-3" />
            <p class="text-center text-sm text-[--ka-fg-muted]">Escaneie o QR Code pelo WhatsApp para concluir a conexao.</p>
          </div>
          <EmptyState
            v-else
            :icon="MessageCircle"
            title="Nenhum QR Code ativo"
            description="Clique em conectar para solicitar um QR Code real da API."
          />
        </Card>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { AlertCircle, ChevronLeft, MessageCircle, QrCode } from "lucide-vue-next";

definePageMeta({ middleware: "auth" });

const api = useApi();
const toast = useToast();
const loading = ref(true);
const connecting = ref(false);
const error = ref("");
const status = ref("DISCONNECTED");
const connection = ref<any>(null);
const qrCode = ref<string | null>(null);

const statusVariant = computed(() => {
  if (status.value === "CONNECTED") return "success";
  if (status.value === "CONNECTING") return "warning";
  if (status.value === "ERROR") return "destructive";
  return "neutral";
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

onMounted(load);
</script>
