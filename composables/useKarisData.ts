type AnyRecord = Record<string, any>;

export function unwrapList<T = AnyRecord>(payload: any, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

export function formatDate(value?: string | Date | null, fallback = "--") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatDateTime(value?: string | Date | null, fallback = "--") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function relativeTime(value?: string | Date | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "agora";
}

export function formatMoney(cents?: number | null, fallback = "R$ 0,00") {
  if (typeof cents !== "number") return fallback;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function statusLabel(value?: string | null) {
  const map: Record<string, string> = {
    OPEN: "Aberta",
    CLOSED: "Fechada",
    SNOOZED: "Adiada",
    WON: "Ganha",
    LOST: "Perdida",
    DRAFT: "Rascunho",
    SCHEDULED: "Agendada",
    RUNNING: "Rodando",
    PAUSED: "Pausada",
    COMPLETED: "Concluída",
    FAILED: "Falhou",
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    CONNECTED: "Conectado",
    DISCONNECTED: "Desconectado",
    CONNECTING: "Conectando",
    ERROR: "Erro",
  };
  return map[String(value || "")] || String(value || "--");
}

export function useKarisLoaders() {
  const api = useApi();

  async function safeFetch<T = any>(path: string, fallback: T): Promise<T> {
    try {
      return await api.fetch<T>(path);
    } catch {
      return fallback;
    }
  }

  return { safeFetch };
}
