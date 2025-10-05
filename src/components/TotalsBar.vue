<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import { formatIRT, formatIRM } from '@/composables/useMoney';

const ledgerStore = useLedgerStore();
const settingsStore = useSettingsStore();
const { totals, incomeTotals, expenseTotals } = storeToRefs(ledgerStore);
const { settings } = storeToRefs(settingsStore);
const { t, locale } = useI18n();

const totalsUnitLabel = computed(() => settings.value.totalsDisplayUnit);

function formatTotal(irt: number): string {
  return totalsUnitLabel.value === 'IRM'
    ? formatIRM(irt, locale.value)
    : formatIRT(irt, locale.value);
}
</script>

<template>
  <section class="grid gap-5 w-full" aria-live="polite">
    <div class="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/10 border border-slate-200/60 dark:border-slate-700/60">
      <header class="font-semibold mb-3 text-slate-900 dark:text-slate-100">{{ t('totals.overview') }}</header>
      <div class="grid gap-3 grid-cols-3">
        <div class="rounded-xl bg-white/65 dark:bg-slate-900/70 backdrop-blur shadow-sm p-3 border-l-4 border-cyan-400">
          <span class="text-[0.85rem] text-slate-600 dark:text-slate-400">{{ t('totals.planned') }}</span>
          <strong class="block text-lg">{{ formatTotal(totals.plannedIRT) }}</strong>
        </div>
        <div class="rounded-xl bg-white/65 dark:bg-slate-900/70 backdrop-blur shadow-sm p-3 border-l-4 border-emerald-500">
          <span class="text-[0.85rem] text-slate-600 dark:text-slate-400">{{ t('totals.paid') }}</span>
          <strong class="block text-lg">{{ formatTotal(totals.paidIRT) }}</strong>
        </div>
        <div class="rounded-xl bg-white/65 dark:bg-slate-900/70 backdrop-blur shadow-sm p-3 border-l-4 border-amber-500">
          <span class="text-[0.85rem] text-slate-600 dark:text-slate-400">{{ t('totals.pending') }}</span>
          <strong class="block text-lg">{{ formatTotal(totals.pendingIRT) }}</strong>
        </div>
      </div>
    </div>
    <div class="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-emerald-500/15 to-sky-500/10 border border-slate-200/60 dark:border-slate-700/60">
      <header class="font-semibold mb-3 text-slate-900 dark:text-slate-100">{{ t('totals.breakdown') }}</header>
      <div class="grid gap-3 grid-cols-2">
        <div class="rounded-xl bg-white/65 dark:bg-slate-900/70 backdrop-blur shadow-sm p-3 border-l-4 border-teal-500">
          <span class="text-[0.85rem] text-slate-600 dark:text-slate-400">{{ t('totals.income') }}</span>
          <strong class="block text-lg">{{ formatTotal(incomeTotals.plannedIRT) }}</strong>
        </div>
        <div class="rounded-xl bg-white/65 dark:bg-slate-900/70 backdrop-blur shadow-sm p-3 border-l-4 border-red-500">
          <span class="text-[0.85rem] text-slate-600 dark:text-slate-400">{{ t('totals.expenses') }}</span>
          <strong class="block text-lg">{{ formatTotal(expenseTotals.plannedIRT) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

