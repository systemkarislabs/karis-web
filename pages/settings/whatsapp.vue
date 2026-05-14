<script setup lang="ts">
definePageMeta({ middleware: "auth" });

await navigateTo("/whatsapp", { replace: true });
</script>
