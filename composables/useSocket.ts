import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket() {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  function connect() {
    if (socket?.connected) return;
    socket = io(config.public.wsUrl as string, {
      query: { companyId: auth.user?.companyId || "" },
      transports: ["websocket", "polling"],
    });
    socket.on("connect", () => console.log("[Socket] Conectado"));
    socket.on("disconnect", () => console.log("[Socket] Desconectado"));
  }

  function joinConversation(conversationId: string) {
    socket?.emit("join-conversation", conversationId);
  }

  function leaveConversation(conversationId: string) {
    socket?.emit("leave-conversation", conversationId);
  }

  function onMessage(handler: (msg: any) => void) {
    socket?.on("message.created", handler);
    return () => socket?.off("message.created", handler);
  }

  function onConversationUpdate(handler: (data: any) => void) {
    socket?.on("conversation.updated", handler);
    return () => socket?.off("conversation.updated", handler);
  }

  function disconnect() {
    socket?.disconnect();
    socket = null;
  }

  return { connect, disconnect, joinConversation, leaveConversation, onMessage, onConversationUpdate, socket };
}
