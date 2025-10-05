<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport
} from 'reka-ui';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import { emitToast, useToastBus } from '@/composables/useNotifier';

const { t, locale } = useI18n();
const route = useRoute();
const ledgerStore = useLedgerStore();
const settingsStore = useSettingsStore();
const { lastSavedAt } = storeToRefs(ledgerStore);
const { settings } = storeToRefs(settingsStore);

interface ToastState {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'danger';
  open: boolean;
}

const toasts = reactive<ToastState[]>([]);

const toastBus = useToastBus();
const stopBus = toastBus.on((payload) => {
  const id = payload.id ?? crypto.randomUUID?.() ?? Date.now().toString(36);
  const toast: ToastState = {
    id,
    title: payload.title,
    description: payload.description,
    variant: payload.variant ?? 'default',
    open: true
  };
  toasts.push(toast);
  window.setTimeout(() => closeToast(id), 4200);
});

function closeToast(id: string) {
  const index = toasts.findIndex((item) => item.id === id);
  if (index !== -1) {
    toasts[index].open = false;
    window.setTimeout(() => {
      const removeIndex = toasts.findIndex((item) => item.id === id);
      if (removeIndex !== -1) {
        toasts.splice(removeIndex, 1);
      }
    }, 320);
  }
}

watch(lastSavedAt, (value, oldValue) => {
  if (!value || value === oldValue) return;
  emitToast({ title: t('toasts.autoSaved'), variant: 'success' });
});

let mediaQuery: MediaQueryList | null = null;

function handleSystemThemeChange() {
  if (settings.value.theme === 'system') {
    applyResolvedTheme(mediaQuery?.matches ? 'dark' : 'light');
  }
}

function applyResolvedTheme(value: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  // Keep previous data attributes for compatibility with existing CSS variables
  root.dataset.theme = value;
  body.dataset.theme = value;
  // Toggle Tailwind dark mode class
  if (value === 'dark') {
    root.classList.add('dark');
    body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
  }
}

function applyTheme(theme: 'system' | 'light' | 'dark') {
  if (typeof window === 'undefined') return;

  if (theme === 'system') {
    if (!mediaQuery) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }
    applyResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
  } else {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      mediaQuery = null;
    }
    applyResolvedTheme(theme);
  }
}

watch(
  () => settings.value.theme,
  (theme) => applyTheme(theme),
  { immediate: true }
);

watch(
  () => settings.value.language,
  (language) => {
    locale.value = language;
  },
  { immediate: true }
);

const activePath = computed(() => route.path);

function toggleLanguage() {
  settingsStore.toggleLanguage();
}

onBeforeUnmount(() => {
  stopBus();
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleSystemThemeChange);
    mediaQuery = null;
  }
});
</script>

<template>
  <ToastProvider :duration="4000">
    <div class="min-h-screen flex flex-col bg-gradient-to-b from-slate-900/5 to-sky-500/10 dark:from-slate-50/5 dark:to-sky-400/10">
      <header class="sticky top-0 z-40 flex items-center justify-between gap-3 px-5 py-4 backdrop-blur border-b border-slate-200/50 bg-white/80 dark:bg-slate-900/70">
        <div class="inline-flex items-center gap-3">
          <img src="/icon.svg" alt="" class="w-9 h-9 rounded-xl" />
          <span class="font-bold text-lg">{{ t('app.title') }}</span>
        </div>
        <nav class="inline-flex flex-wrap gap-2" :aria-label="t('nav.label')">
          <RouterLink
            to="/"
            class="px-3 py-2 rounded-full font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            :class="{ 'bg-cyan-200/40 text-slate-900 dark:text-slate-900': activePath === '/' }"
          >
            {{ t('nav.dashboard') }}
          </RouterLink>
          <RouterLink
            to="/settings"
            class="px-3 py-2 rounded-full font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            :class="{ 'bg-cyan-200/40 text-slate-900 dark:text-slate-900': activePath.startsWith('/settings') }"
          >
            {{ t('nav.settings') }}
          </RouterLink>
        </nav>
        <div class="inline-flex gap-2">
          <button
            type="button"
            class="px-3 py-2 rounded-full bg-slate-200/50 hover:bg-slate-300/60 dark:bg-slate-700/50 dark:hover:bg-slate-700 font-semibold"
            @click="toggleLanguage"
          >
            {{ settings.language === 'fa' ? 'FA' : 'EN' }}
          </button>
        </div>
      </header>
      <main class="flex-1 p-4 sm:p-6">
        <slot />
      </main>
    </div>

    <div class="fixed end-6 bottom-6 grid gap-2 z-[1000]" role="status" aria-live="polite">
      <ToastRoot
        v-for="toast in toasts"
        :key="toast.id"
        v-model:open="toast.open"
        class="grid gap-2 rounded-2xl p-4 min-w-[260px] bg-slate-900 text-slate-50 shadow-2xl"
        :class="toast.variant === 'success' ? 'border-l-4 border-green-500' : toast.variant === 'danger' ? 'border-l-4 border-red-500' : 'border-l-4 border-cyan-400'"
        @update:open="(open) => { if (!open) closeToast(toast.id); }"
      >
        <div class="grid gap-1">
          <ToastTitle class="font-semibold">{{ toast.title }}</ToastTitle>
          <ToastDescription v-if="toast.description" class="text-slate-200">{{ toast.description }}</ToastDescription>
        </div>
        <div class="flex items-center justify-between gap-2 text-sm">
          <button type="button" class="px-2 py-1 rounded-full bg-slate-50/10" @click="closeToast(toast.id)">
            {{ t('common.dismiss') }}
          </button>
          <ToastClose class="w-6 h-6 grid place-items-center rounded-full bg-slate-50/10" :aria-label="t('common.dismiss')">
            ×
          </ToastClose>
        </div>
      </ToastRoot>
    </div>
    <ToastViewport class="hidden" />
  </ToastProvider>
</template>

