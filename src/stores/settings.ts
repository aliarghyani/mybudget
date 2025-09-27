import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export type Language = 'en' | 'fa';
export type ThemeOption = 'system' | 'light' | 'dark';
export type DensityOption = 'comfortable' | 'compact';
export type TotalsDisplayUnit = 'IRT' | 'IRM';

export interface Settings {
  language: Language;
  theme: ThemeOption;
  usdToIrt: number;
  defaultMonth: string;
  density: DensityOption;
  totalsDisplayUnit: TotalsDisplayUnit;
}

const STORAGE_KEY = 'mb:settings';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function createDefaults(): Settings {
  return {
    language: 'fa',
    theme: 'system',
    usdToIrt: 107_000,
    defaultMonth: currentMonth(),
    density: 'comfortable',
    totalsDisplayUnit: 'IRM'
  };
}

function sanitizeMonth(value: string): string {
  return /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) {
    return createDefaults().usdToIrt;
  }
  return Math.round(rate);
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = useStorage<Settings>(STORAGE_KEY, createDefaults(), undefined, {
    mergeDefaults: true
  });

  const settings = stored;

  const locale = computed(() => settings.value.language);

  function setLanguage(language: Language) {
    settings.value.language = language;
  }

  function toggleLanguage() {
    setLanguage(settings.value.language === 'fa' ? 'en' : 'fa');
  }

  function setTheme(theme: ThemeOption) {
    settings.value.theme = theme;
  }

  function setUsdToIrt(rate: number) {
    settings.value.usdToIrt = clampRate(rate);
  }

  function setDefaultMonth(month: string) {
    settings.value.defaultMonth = sanitizeMonth(month);
  }

  function setDensity(density: DensityOption) {
    settings.value.density = density;
  }

  function setTotalsDisplayUnit(unit: TotalsDisplayUnit) {
    settings.value.totalsDisplayUnit = unit;
  }

  function resetAll() {
    settings.value = createDefaults();
  }

  return {
    settings,
    locale,
    setLanguage,
    toggleLanguage,
    setTheme,
    setUsdToIrt,
    setDefaultMonth,
    setDensity,
    setTotalsDisplayUnit,
    resetAll
  };
});
