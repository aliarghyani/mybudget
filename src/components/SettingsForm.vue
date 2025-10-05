<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import { emitToast } from '@/composables/useNotifier';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import {
  RadioGroupRoot,
  RadioGroupItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator
} from 'reka-ui';

const ledgerStore = useLedgerStore();
const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);
const { t } = useI18n();

const fileInput = ref<HTMLInputElement | null>(null);
const confirmReset = ref(false);

function onLanguageChange(language: 'en' | 'fa') {
  settingsStore.setLanguage(language);
  emitToast({ title: t('toasts.languageChanged'), variant: 'success' });
}

function onThemeChange(theme: 'system' | 'light' | 'dark') {
  settingsStore.setTheme(theme);
}

function onDensityChange(density: 'comfortable' | 'compact') {
  settingsStore.setDensity(density);
}

function onTotalsDisplayChange(unit: 'IRT' | 'IRM') {
  settingsStore.setTotalsDisplayUnit(unit);
}

function onUsdRateBlur(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = Number(target.value);
  settingsStore.setUsdToIrt(value);
  target.value = settings.value.usdToIrt.toString();
}

function onDefaultMonthChange(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.setDefaultMonth(target.value);
}

function triggerImport() {
  fileInput.value?.click();
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    ledgerStore.importRows(payload);
    emitToast({ title: t('toasts.importSuccess'), variant: 'success' });
  } catch (error) {
    console.error(error);
    emitToast({ title: t('toasts.importFailed'), variant: 'danger' });
  } finally {
    input.value = '';
  }
}

function handleExport() {
  try {
    const data = ledgerStore.exportRows();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mybudget-ledger-${settings.value.defaultMonth}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    emitToast({ title: t('toasts.exported'), variant: 'success' });
  } catch (error) {
    console.error(error);
    emitToast({ title: t('toasts.exportFailed'), variant: 'danger' });
  }
}

function confirmResetAll() {
  confirmReset.value = true;
}

function onResetConfirmed() {
  settingsStore.resetAll();
  ledgerStore.resetSeed();
  emitToast({ title: t('toasts.resetDone'), variant: 'success' });
}
</script>

<template>
  <form class="grid gap-6" @submit.prevent>
    <section class="rounded-2xl bg-white/80 dark:bg-slate-900/70 shadow-[0_16px_32px_rgba(15,23,42,.1)] p-4 sm:p-6 grid gap-4">
      <header>
        <h2 class="m-0 text-lg font-semibold">{{ t('settings.languageTitle') }}</h2>
        <p class="mt-1 text-slate-500 dark:text-slate-400">{{ t('settings.languageHint') }}</p>
      </header>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-4 py-2 rounded-full font-semibold bg-slate-200/60 hover:bg-slate-300/60 dark:bg-slate-700/60 dark:hover:bg-slate-700"
          :class="{ 'bg-cyan-200/60 text-slate-900': settings.language === 'en' }"
          @click="onLanguageChange('en')"
        >
          English
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-full font-semibold bg-slate-200/60 hover:bg-slate-300/60 dark:bg-slate-700/60 dark:hover:bg-slate-700"
          :class="{ 'bg-cyan-200/60 text-slate-900': settings.language === 'fa' }"
          @click="onLanguageChange('fa')"
        >
          فارسی
        </button>
      </div>
    </section>

    <section class="rounded-2xl bg-white/80 dark:bg-slate-900/70 shadow-[0_16px_32px_rgba(15,23,42,.1)] p-4 sm:p-6 grid gap-4">
      <header>
        <h2 class="m-0 text-lg font-semibold">{{ t('settings.themeTitle') }}</h2>
        <p class="mt-1 text-slate-500 dark:text-slate-400">{{ t('settings.themeHint') }}</p>
      </header>
      <RadioGroupRoot
        :model-value="settings.theme"
        class="flex flex-wrap gap-2"
        @update:modelValue="onThemeChange as any"
      >
        <RadioGroupItem value="system" as-child>
          <button type="button" class="px-3 py-2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 data-[state=checked]:bg-cyan-200/60 font-medium">
            <span>{{ t('settings.themeSystem') }}</span>
          </button>
        </RadioGroupItem>
        <RadioGroupItem value="light" as-child>
          <button type="button" class="px-3 py-2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 data-[state=checked]:bg-cyan-200/60 font-medium">
            <span>{{ t('settings.themeLight') }}</span>
          </button>
        </RadioGroupItem>
        <RadioGroupItem value="dark" as-child>
          <button type="button" class="px-3 py-2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 data-[state=checked]:bg-cyan-200/60 font-medium">
            <span>{{ t('settings.themeDark') }}</span>
          </button>
        </RadioGroupItem>
      </RadioGroupRoot>
    </section>

    <section class="rounded-2xl bg-white/80 dark:bg-slate-900/70 shadow-[0_16px_32px_rgba(15,23,42,.1)] p-4 sm:p-6 grid gap-4">
      <header>
        <h2 class="m-0 text-lg font-semibold">{{ t('settings.moneyTitle') }}</h2>
        <p class="mt-1 text-slate-500 dark:text-slate-400">{{ t('settings.moneyHint') }}</p>
      </header>
      <div class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <label class="grid gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{{ t('settings.usdRate') }}</span>
          <input
            type="number"
            min="1"
            step="1"
            :value="settings.usdToIrt"
            class="rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            @blur="onUsdRateBlur"
          />
        </label>
        <label class="grid gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{{ t('settings.defaultMonth') }}</span>
          <input
            type="month"
            :value="settings.defaultMonth"
            class="rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            @change="onDefaultMonthChange"
          />
        </label>
        <label class="grid gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{{ t('settings.density') }}</span>
          <SelectRoot :model-value="settings.density" @update:modelValue="onDensityChange as any">
            <SelectTrigger class="w-full rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800 px-3 py-2 text-left">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent class="z-50 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-lg">
                <SelectViewport class="p-1">
                  <SelectItem value="comfortable" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                    <SelectItemIndicator>✓</SelectItemIndicator>
                    <SelectItemText>{{ t('settings.densityComfortable') }}</SelectItemText>
                  </SelectItem>
                  <SelectItem value="compact" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                    <SelectItemIndicator>✓</SelectItemIndicator>
                    <SelectItemText>{{ t('settings.densityCompact') }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </label>
        <label class="grid gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{{ t('settings.totalsUnit') }}</span>
          <SelectRoot :model-value="settings.totalsDisplayUnit" @update:modelValue="onTotalsDisplayChange as any">
            <SelectTrigger class="w-full rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800 px-3 py-2 text-left">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent class="z-50 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-lg">
                <SelectViewport class="p-1">
                  <SelectItem value="IRT" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                    <SelectItemIndicator>✓</SelectItemIndicator>
                    <SelectItemText>{{ t('units.irt') }}</SelectItemText>
                  </SelectItem>
                  <SelectItem value="IRM" class="group flex items-center gap-2 rounded-lg px-2 py-2 data-[state=checked]:bg-cyan-50 dark:data-[state=checked]:bg-slate-700/40">
                    <SelectItemIndicator>✓</SelectItemIndicator>
                    <SelectItemText>{{ t('units.irm') }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </label>
      </div>
    </section>

    <section class="rounded-2xl bg-white/80 dark:bg-slate-900/70 shadow-[0_16px_32px_rgba(15,23,42,.1)] p-4 sm:p-6 grid gap-4">
      <header>
        <h2 class="m-0 text-lg font-semibold">{{ t('settings.dataTitle') }}</h2>
        <p class="mt-1 text-slate-500 dark:text-slate-400">{{ t('settings.dataHint') }}</p>
      </header>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded-xl px-4 py-2 font-semibold bg-cyan-200/40 hover:bg-cyan-200/60" @click="handleExport">
          {{ t('settings.export') }}
        </button>
        <button type="button" class="rounded-xl px-4 py-2 font-semibold bg-cyan-200/40 hover:bg-cyan-200/60" @click="triggerImport">
          {{ t('settings.import') }}
        </button>
        <button type="button" class="rounded-xl px-4 py-2 font-semibold bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25" @click="confirmResetAll">
          {{ t('settings.resetAll') }}
        </button>
      </div>
      <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="handleImport" />
    </section>

    <ConfirmDialog
      v-model="confirmReset"
      :title="t('settings.resetTitle')"
      :description="t('settings.resetDescription')"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('common.confirm')"
      destructive
      @confirm="onResetConfirmed"
    />
  </form>
</template>

