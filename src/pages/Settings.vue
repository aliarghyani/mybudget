<script setup lang="ts">
import SettingsForm from '@/components/SettingsForm.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="settings-page">
    <header class="settings-page__header">
      <h1>{{ t('settings.pageTitle') }}</h1>
      <p>{{ t('settings.pageDescription') }}</p>
    </header>
    <SettingsForm />
  </div>
</template>

<style scoped>
.settings-page {
  display: grid;
  gap: 1.5rem;
}

.settings-page__header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.settings-page__header p {
  margin: 0.35rem 0 0;
  color: var(--rk-color-muted-foreground, #64748b);
}
</style>
