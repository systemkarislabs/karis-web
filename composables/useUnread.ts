/**
 * Singleton que mantém o total de mensagens não lidas visível na sidebar.
 * O layout lê `totalUnread`; a inbox chama `setUnread()` e `markRead()`.
 */

const totalUnread = ref(0)

export function useUnread() {
  /** Substitui o total calculando a soma de todas as conversas */
  function setFromConversations(conversations: { unreadCount?: number }[]) {
    totalUnread.value = conversations.reduce(
      (sum, c) => sum + Number(c.unreadCount || 0),
      0,
    )
  }

  /** Desconta `count` do total quando uma conversa é lida */
  function markRead(count: number) {
    totalUnread.value = Math.max(0, totalUnread.value - count)
  }

  return { totalUnread, setFromConversations, markRead }
}
