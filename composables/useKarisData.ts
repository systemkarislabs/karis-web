type AnyRecord = Record<string, any>;

export function unwrapList<T = AnyRecord>(payload: any, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

const TZ = "America/Recife";

export function formatDate(value?: string | Date | null, fallback = "--") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(date);
}

export function formatDateTime(value?: string | Date | null, fallback = "--") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(date);
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

// ─── Formatadores de arquivo e telefone ──────────────────────────────────────

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function formatPhone(phone?: string | null): string {
  const p = String(phone || '').replace(/\D/g, '');
  if (p.length === 13) return `+${p.slice(0, 2)} (${p.slice(2, 4)}) ${p.slice(4, 9)}-${p.slice(9)}`;
  if (p.length === 12) return `+${p.slice(0, 2)} (${p.slice(2, 4)}) ${p.slice(4, 8)}-${p.slice(8)}`;
  return phone || '';
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTE = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#6366f1'];

/**
 * Gera cor determinística de avatar a partir do nome/telefone.
 * Mesmo input → sempre a mesma cor (hash simples).
 */
export function avatarColor(name?: string | null): string {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

/** Extrai 1-2 letras iniciais do nome para exibir no avatar. */
export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────

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
