<template>
  <img
    v-if="usesKarisNegociosLogo"
    class="company-identity-logo notranslate"
    src="/karis-negocios-logo.png"
    :alt="displayName"
    translate="no"
  />
  <span v-else class="truncate">{{ displayName }}</span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ name?: string | null }>(), {
  name: null,
});

const displayName = computed(() => props.name?.trim() || "Karis Atende");
const normalizedName = computed(() =>
  displayName.value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
);

const usesKarisNegociosLogo = computed(() => normalizedName.value === "karis negocios" || normalizedName.value === "caris negocios");
</script>
