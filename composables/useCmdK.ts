import { useMagicKeys, whenever } from "@vueuse/core";

interface Command {
  key: string;
  label: string;
  action: () => void;
}

const commands = ref<Command[]>([]);

export function useCmdK() {
  const isOpen = ref(false);
  const query = ref("");
  const register = (cmd: Command) => { commands.value.push(cmd); };

  const filtered = computed(() =>
    query.value
      ? commands.value.filter(c => c.label.toLowerCase().includes(query.value.toLowerCase()) || c.key.toLowerCase().includes(query.value.toLowerCase()))
      : commands.value.slice(0, 10)
  );

  const { Ctrl_K, Escape } = useMagicKeys();
  whenever(Ctrl_K, (v) => { if (v) { isOpen.value = !isOpen.value; query.value = ""; } });
  whenever(Escape, () => { isOpen.value = false; query.value = ""; });

  function execute(cmd: Command) { cmd.action(); isOpen.value = false; query.value = ""; }

  return { isOpen, query, filtered, register, execute };
}
