<template>
  <ConfigProvider>
    <AppShell>
      <RouterView />
    </AppShell>
  </ConfigProvider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ConfigProvider } from 'reka-ui';
import AppShell from '@/components/AppShell.vue';
import { useRtl } from '@/composables/useRtl';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import './styles.css';

useRtl();
useKeyboardShortcuts();
</script>
