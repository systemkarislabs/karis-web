<template>
  <NuxtLayout name="default">
    <div class="ka-page" style="max-width:960px">

      <!-- Header -->
      <div class="page-header">
        <div>
          <p class="page-header-eyebrow">Operação</p>
          <h1>WhatsApp</h1>
          <p class="page-header-description">Conecte e monitore a instância Evolution vinculada à empresa.</p>
        </div>
        <div class="page-header-actions">
          <Button variant="secondary" size="sm" :disabled="loading" @click="load">
            <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            Atualizar
          </Button>
          <Button v-if="status !== 'DISCONNECTED'" variant="outline" size="sm" :disabled="disconnecting" @click="disconnect">
            <Unplug class="h-4 w-4" />
            Desconectar
          </Button>
          <Button size="sm" :disabled="connecting" @click="connect">
            <QrCode class="h-4 w-4" />
            {{ connecting ? "Conectando…" : "Conectar" }}
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="display:grid;grid-template-columns:340px 1fr;gap:16px;margin-bottom:16px">
        <Skeleton height="260px" style="border-radius:var(--ka-r-lg)" />
        <Skeleton height="260px" style="border-radius:var(--ka-r-lg)" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="dashboard-panel" style="padding:48px 32px;text-align:center">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--ka-danger-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <AlertCircle class="h-6 w-6" style="color:var(--ka-danger)" />
        </div>
        <h2 style="font-size:16px;font-weight:600;color:var(--ka-fg);margin-bottom:6px">WhatsApp indisponível</h2>
        <p style="font-size:14px;color:var(--ka-fg-muted)">{{ error }}</p>
      </div>

      <!-- Main content -->
      <div v-else style="display:grid;grid-template-columns:340px 1fr;gap:16px;margin-bottom:16px">

        <!-- Status card -->
        <div class="dashboard-panel" style="padding:24px;display:flex;flex-direction:column;gap:20px">
          <!-- Status badge -->
          <div style="display:flex;align-items:center;justify-content:space-between">
            <p style="font-size:13px;font-weight:600;color:var(--ka-fg-muted);text-transform:uppercase;letter-spacing:0.06em">Status</p>
            <span
              style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600"
              :style="statusStyle"
            >
              <span style="width:7px;height:7px;border-radius:50%;display:inline-block" :style="statusDotStyle" />
              {{ statusLabel }}
            </span>
          </div>

          <!-- Connection info -->
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ka-gray-50)">
              <span style="font-size:13px;color:var(--ka-fg-muted);display:flex;align-items:center;gap:8px">
                <Phone class="h-4 w-4" style="color:var(--ka-brand)" />
                Número
              </span>
              <strong style="font-size:14px;color:var(--ka-fg);font-family:monospace">
                {{ connection?.phoneNumber || "--" }}
              </strong>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ka-gray-50)">
              <span style="font-size:13px;color:var(--ka-fg-muted);display:flex;align-items:center;gap:8px">
                <Server class="h-4 w-4" style="color:var(--ka-brand)" />
                Instância
              </span>
              <strong style="font-size:13px;color:var(--ka-fg);font-family:monospace;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                {{ connection?.evolutionInstanceName || "--" }}
              </strong>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ka-gray-50)">
              <span style="font-size:13px;color:var(--ka-fg-muted);display:flex;align-items:center;gap:8px">
                <Clock class="h-4 w-4" style="color:var(--ka-brand)" />
                Atualizado
              </span>
              <strong style="font-size:13px;color:var(--ka-fg)">
                {{ connection?.updatedAt ? formatDateTime(connection.updatedAt) : "--" }}
              </strong>
            </div>
          </div>

          <!-- Last error -->
          <div v-if="connection?.lastError" style="padding:12px;border-radius:10px;background:var(--ka-danger-bg);color:var(--ka-danger);font-size:13px;line-height:1.5">
            <AlertCircle class="h-4 w-4" style="display:inline;margin-right:6px;vertical-align:middle" />
            {{ connection.lastError }}
          </div>

          <!-- Connected indicator -->
          <div v-if="status === 'CONNECTED'" style="padding:12px;border-radius:10px;background:var(--ka-success-bg,#f0fdf4);color:var(--ka-success);font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px">
            <CheckCircle class="h-4 w-4" />
            WhatsApp conectado e operacional
          </div>
        </div>

        <!-- QR code panel -->
        <div class="dashboard-panel" style="padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px;gap:16px">
          <!-- QR image -->
          <template v-if="qrImageSource">
            <img :src="qrImageSource" alt="QR Code WhatsApp" style="width:220px;height:220px;border-radius:12px;border:1px solid var(--ka-border);background:white;padding:12px" />
            <div style="text-align:center">
              <p style="font-size:14px;font-weight:600;color:var(--ka-fg);margin-bottom:4px">Escaneie pelo WhatsApp</p>
              <p style="font-size:13px;color:var(--ka-fg-muted)">Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo</p>
            </div>
          </template>

          <!-- QR text code -->
          <template v-else-if="qrCode">
            <div style="max-width:100%;padding:16px;border-radius:10px;border:1px solid var(--ka-border);background:var(--ka-gray-50);font-family:monospace;font-size:11px;color:var(--ka-fg-2);overflow-x:auto;word-break:break-all">
              {{ qrCode }}
            </div>
            <p style="font-size:13px;color:var(--ka-fg-muted);text-align:center">Código de pareamento retornado pela API (não é imagem).</p>
          </template>

          <!-- Connected state -->
          <template v-else-if="status === 'CONNECTED'">
            <div style="width:72px;height:72px;border-radius:50%;background:var(--ka-success-bg,#f0fdf4);display:flex;align-items:center;justify-content:center">
              <MessageCircle class="h-8 w-8" style="color:var(--ka-success)" />
            </div>
            <div style="text-align:center">
              <p style="font-size:16px;font-weight:600;color:var(--ka-fg);margin-bottom:6px">Conectado</p>
              <p style="font-size:13px;color:var(--ka-fg-muted)">O WhatsApp está ativo e recebendo mensagens.</p>
            </div>
          </template>

          <!-- Idle state -->
          <template v-else>
            <div style="width:72px;height:72px;border-radius:50%;background:var(--ka-gray-100);display:flex;align-items:center;justify-content:center">
              <QrCode class="h-8 w-8" style="color:var(--ka-fg-muted)" />
            </div>
            <div style="text-align:center">
              <p style="font-size:16px;font-weight:600;color:var(--ka-fg);margin-bottom:6px">Nenhum QR Code ativo</p>
              <p style="font-size:13px;color:var(--ka-fg-muted)">Clique em <strong>Conectar</strong> para gerar o QR Code.</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Diagnostics panel -->
      <div v-if="!loading && !error" class="dashboard-panel" style="padding:24px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px">
          <div>
            <h2 style="font-size:16px;font-weight:700;color:var(--ka-fg);margin-bottom:4px">Diagnóstico da conexão</h2>
            <p style="font-size:13px;color:var(--ka-fg-muted)">Dados da API para confirmar configuração, webhook e estado da Evolution.</p>
          </div>
          <Button variant="secondary" size="sm" :disabled="loadingDiagnostics" @click="loadDiagnostics">
            <Activity class="h-4 w-4" :class="loadingDiagnostics ? 'animate-spin' : ''" />
            Diagnosticar
          </Button>
        </div>

        <div v-if="loadingDiagnostics" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          <Skeleton v-for="i in 3" :key="i" height="72px" style="border-radius:10px" />
        </div>

        <div v-else-if="diagnostics" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          <div
            v-for="item in diagnosticItems"
            :key="item.label"
            style="padding:14px 16px;border-radius:10px;background:var(--ka-gray-50);border:1px solid var(--ka-border)"
          >
            <p style="font-size:12px;color:var(--ka-fg-muted);margin-bottom:6px">{{ item.label }}</p>
            <div style="display:flex;align-items:center;gap:8px">
              <span
                style="width:8px;height:8px;border-radius:50%;flex-shrink:0"
                :style="item.ok ? 'background:var(--ka-success)' : 'background:var(--ka-danger)'"
              />
              <strong style="font-size:15px;color:var(--ka-fg)">{{ item.ok ? "Sim" : "Não" }}</strong>
            </div>
          </div>
        </div>

        <div v-else style="text-align:center;padding:24px;color:var(--ka-fg-muted);font-size:13px">
          Clique em <strong>Diagnosticar</strong> para verificar o estado da conexão.
        </div>
      </div>

    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Activity, AlertCircle, CheckCircle, Clock, MessageCircle, Phone, QrCode, RefreshCw, Server, Unplug } from "lucide-vue-next";

definePageMeta({ middleware: "auth" });

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

// ── Computed ──────────────────────────────────────────────────────────────────

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    CONNECTED: "Conectado",
    CONNECTING: "Conectando",
    DISCONNECTED: "Desconectado",
    ERROR: "Erro",
  };
  return map[status.value] ?? status.value;
});

const statusStyle = computed(() => {
  if (status.value === "CONNECTED")   return "background:var(--ka-success-bg,#f0fdf4);color:var(--ka-success)";
  if (status.value === "CONNECTING")  return "background:#fef3c7;color:#92400e";
  if (status.value === "ERROR")       return "background:var(--ka-danger-bg);color:var(--ka-danger)";
  return "background:var(--ka-gray-100);color:var(--ka-fg-muted)";
});

const statusDotStyle = computed(() => {
  if (status.value === "CONNECTED")   return "background:var(--ka-success)";
  if (status.value === "CONNECTING")  return "background:#f59e0b";
  if (status.value === "ERROR")       return "background:var(--ka-danger)";
  return "background:var(--ka-fg-muted)";
});

const qrImageSource = computed(() => {
  if (!qrCode.value) return null;
  const v = String(qrCode.value);
  if (v.startsWith("data:image/")) return v;
  if (/^[A-Za-z0-9+/=]+$/.test(v) && v.length > 100) return `data:image/png;base64,${v}`;
  return null;
});

const diagnosticItems = computed(() => {
  if (!diagnostics.value) return [];
  return [
    { label: "WhatsApp habilitado",   ok: !!diagnostics.value.enabled },
    { label: "Evolution configurada", ok: !!diagnostics.value.hasEvolutionConfig },
    { label: "Evolution acessível",   ok: !!diagnostics.value.evolutionReachable },
  ];
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.fetch<any>("/whatsapp/status");
    status.value = data.status || "DISCONNECTED";
    connection.value = data.connection;
    qrCode.value = data.connection?.qrCode || null;
  } catch (err: any) {
    error.value = err?.data?.message || "Não foi possível carregar o WhatsApp.";
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
    toast.success(data.qrCode ? "QR Code gerado — escaneie pelo WhatsApp." : "Solicitação enviada ao WhatsApp.");
    await load();
  } catch (err: any) {
    toast.error(err?.data?.message || "Não foi possível conectar o WhatsApp.");
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
    toast.error(err?.data?.message || "Não foi possível desconectar o WhatsApp.");
  } finally {
    disconnecting.value = false;
  }
}

async function loadDiagnostics() {
  loadingDiagnostics.value = true;
  try {
    diagnostics.value = await api.fetch("/whatsapp/diagnostics");
  } catch (err: any) {
    toast.error(err?.data?.message || "Não foi possível carregar o diagnóstico.");
  } finally {
    loadingDiagnostics.value = false;
  }
}

onMounted(async () => {
  await load();
  await loadDiagnostics();
});
</script>
