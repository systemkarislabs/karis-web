<template>
  <div class="overflow-hidden rounded-[--ka-r-lg] border border-[--ka-border] bg-[--ka-surface] shadow-[--ka-shadow-sm]">
    <div v-if="loading" class="space-y-2 p-4">
      <Skeleton v-for="i in 6" :key="i" height="2.75rem" />
    </div>

    <div v-else-if="!rows.length" class="p-4">
      <EmptyState :title="emptyTitle" :description="emptyDescription" />
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-[--ka-border] bg-[--ka-gray-50]">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[--ka-fg-muted]"
              :class="{ 'cursor-pointer select-none': col.sortable }"
              @click="col.sortable && toggleSort(col.key)"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.label }}
                <ArrowUpDown v-if="col.sortable" class="h-3 w-3" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in sortedRows" :key="i" class="border-b border-[--ka-divider] last:border-0">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 align-middle text-[--ka-fg]">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpDown } from "lucide-vue-next";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

const props = withDefaults(
  defineProps<{
    columns: Column[];
    rows: Record<string, any>[];
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  {
    columns: () => [],
    rows: () => [],
    loading: false,
    emptyTitle: "Nenhum dado encontrado.",
    emptyDescription: "Quando houver registros, eles aparecem aqui.",
  },
);

const sortKey = ref<string | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortDir.value = "asc";
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows;
  const dir = sortDir.value === "asc" ? 1 : -1;
  return [...props.rows].sort((a, b) => String(a[sortKey.value!] ?? "").localeCompare(String(b[sortKey.value!] ?? "")) * dir);
});
</script>
