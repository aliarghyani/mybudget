<script setup lang="ts">
import SettingsForm from '@/components/SettingsForm.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="grid gap-6">
    <header>
      <h1 class="m-0 text-2xl font-bold">{{ t('settings.pageTitle') }}</h1>
      <p class="mt-1 text-slate-500 dark:text-slate-400">{{ t('settings.pageDescription') }}</p>
    </header>
    <SettingsForm />
  </div>
</template>
