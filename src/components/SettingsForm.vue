<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import { emitToast } from '@/composables/useNotifier';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

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

function onDensitySelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value as 'comfortable' | 'compact';
  onDensityChange(value);
}

function onTotalsSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value as 'IRT' | 'IRM';
  onTotalsDisplayChange(value);
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
  <form class="settings-form" @submit.prevent>
    <section class="settings-form__section">
      <header>
        <h2>{{ t('settings.languageTitle') }}</h2>
        <p>{{ t('settings.languageHint') }}</p>
      </header>
      <div class="settings-form__controls">
        <button
          type="button"
          class="settings-form__chip"
          :class="{ 'settings-form__chip--active': settings.language === 'en' }"
          @click="onLanguageChange('en')"
        >
          English
        </button>
        <button
          type="button"
          class="settings-form__chip"
          :class="{ 'settings-form__chip--active': settings.language === 'fa' }"
          @click="onLanguageChange('fa')"
        >
          فارسی
        </button>
      </div>
    </section>

    <section class="settings-form__section">
      <header>
        <h2>{{ t('settings.themeTitle') }}</h2>
        <p>{{ t('settings.themeHint') }}</p>
      </header>
      <div class="settings-form__controls settings-form__controls--row">
        <label class="settings-form__radio">
          <input
            type="radio"
            name="theme"
            value="system"
            :checked="settings.theme === 'system'"
            @change="onThemeChange('system')"
          />
          <span>{{ t('settings.themeSystem') }}</span>
        </label>
        <label class="settings-form__radio">
          <input
            type="radio"
            name="theme"
            value="light"
            :checked="settings.theme === 'light'"
            @change="onThemeChange('light')"
          />
          <span>{{ t('settings.themeLight') }}</span>
        </label>
        <label class="settings-form__radio">
          <input
            type="radio"
            name="theme"
            value="dark"
            :checked="settings.theme === 'dark'"
            @change="onThemeChange('dark')"
          />
          <span>{{ t('settings.themeDark') }}</span>
        </label>
      </div>
    </section>

    <section class="settings-form__section">
      <header>
        <h2>{{ t('settings.moneyTitle') }}</h2>
        <p>{{ t('settings.moneyHint') }}</p>
      </header>
      <div class="settings-form__grid">
        <label class="settings-form__field">
          <span>{{ t('settings.usdRate') }}</span>
          <input
            type="number"
            min="1"
            step="1"
            :value="settings.usdToIrt"
            @blur="onUsdRateBlur"
          />
        </label>
        <label class="settings-form__field">
          <span>{{ t('settings.defaultMonth') }}</span>
          <input type="month" :value="settings.defaultMonth" @change="onDefaultMonthChange" />
        </label>
        <label class="settings-form__field">
          <span>{{ t('settings.density') }}</span>
          <select :value="settings.density" @change="onDensitySelect">
            <option value="comfortable">{{ t('settings.densityComfortable') }}</option>
            <option value="compact">{{ t('settings.densityCompact') }}</option>
          </select>
        </label>
        <label class="settings-form__field">
          <span>{{ t('settings.totalsUnit') }}</span>
          <select :value="settings.totalsDisplayUnit" @change="onTotalsSelect">
            <option value="IRT">{{ t('units.irt') }}</option>
            <option value="IRM">{{ t('units.irm') }}</option>
          </select>
        </label>
      </div>
    </section>

    <section class="settings-form__section">
      <header>
        <h2>{{ t('settings.dataTitle') }}</h2>
        <p>{{ t('settings.dataHint') }}</p>
      </header>
      <div class="settings-form__actions">
        <button type="button" class="settings-form__action" @click="handleExport">
          {{ t('settings.export') }}
        </button>
        <button type="button" class="settings-form__action" @click="triggerImport">
          {{ t('settings.import') }}
        </button>
        <button type="button" class="settings-form__action settings-form__action--danger" @click="confirmResetAll">
          {{ t('settings.resetAll') }}
        </button>
      </div>
      <input ref="fileInput" type="file" accept="application/json" class="settings-form__file" @change="handleImport" />
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

<style scoped>
.settings-form {
  display: grid;
  gap: 1.5rem;
}

.settings-form__section {
  padding: clamp(1rem, 3vw, 1.5rem);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.1);
  display: grid;
  gap: 1rem;
}

.settings-form__section header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.settings-form__section header p {
  margin: 0.3rem 0 0;
  color: var(--rk-color-muted-foreground, #64748b);
  font-size: 0.9rem;
}

.settings-form__controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.settings-form__controls--row {
  flex-wrap: wrap;
}

.settings-form__chip {
  border: none;
  border-radius: 999px;
  padding: 0.45rem 1.2rem;
  background: rgba(148, 163, 184, 0.18);
  cursor: pointer;
  font-weight: 600;
}

.settings-form__chip--active {
  background: rgba(34, 211, 238, 0.3);
  color: var(--rk-color-foreground, #0f172a);
}

.settings-form__radio {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
}

.settings-form__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.settings-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--rk-color-muted-foreground, #64748b);
}

.settings-form__field input,
.settings-form__field select {
  border-radius: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 0.55rem 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
}

.settings-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.settings-form__action {
  border: none;
  border-radius: 0.85rem;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  font-weight: 600;
  background: rgba(34, 211, 238, 0.2);
}

.settings-form__action--danger {
  background: rgba(239, 68, 68, 0.18);
  color: #b91c1c;
}

.settings-form__file {
  display: none;
}
</style>
