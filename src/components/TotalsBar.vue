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
  <section class="totals" aria-live="polite">
    <div class="totals__group">
      <header class="totals__header">{{ t('totals.overview') }}</header>
      <div class="totals__grid">
        <div class="totals__item totals__item--planned">
          <span class="totals__label">{{ t('totals.planned') }}</span>
          <strong class="totals__value">{{ formatTotal(totals.plannedIRT) }}</strong>
        </div>
        <div class="totals__item totals__item--paid">
          <span class="totals__label">{{ t('totals.paid') }}</span>
          <strong class="totals__value">{{ formatTotal(totals.paidIRT) }}</strong>
        </div>
        <div class="totals__item totals__item--pending">
          <span class="totals__label">{{ t('totals.pending') }}</span>
          <strong class="totals__value">{{ formatTotal(totals.pendingIRT) }}</strong>
        </div>
      </div>
    </div>
    <div class="totals__group">
      <header class="totals__header">{{ t('totals.breakdown') }}</header>
      <div class="totals__grid totals__grid--secondary">
        <div class="totals__item totals__item--income">
          <span class="totals__label">{{ t('totals.income') }}</span>
          <strong class="totals__value">{{ formatTotal(incomeTotals.plannedIRT) }}</strong>
        </div>
        <div class="totals__item totals__item--expenses">
          <span class="totals__label">{{ t('totals.expenses') }}</span>
          <strong class="totals__value">{{ formatTotal(expenseTotals.plannedIRT) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.totals {
  display: grid;
  gap: 1.25rem;
  inline-size: 100%;
}

.totals__group {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(217, 70, 239, 0.08));
  border-radius: 1.25rem;
  padding: clamp(1rem, 2vw, 1.5rem);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
}

.totals__group:nth-of-type(2) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(59, 130, 246, 0.08));
}

.totals__header {
  font-weight: 600;
  margin-block-end: 0.75rem;
  color: var(--rk-color-foreground, #0f172a);
}

.totals__grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.totals__grid--secondary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.totals__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.totals__item--planned {
  border-inline-start: 4px solid #22d3ee;
}

.totals__item--paid {
  border-inline-start: 4px solid #10b981;
}

.totals__item--pending {
  border-inline-start: 4px solid #f59e0b;
}

.totals__item--income {
  border-inline-start: 4px solid #14b8a6;
}

.totals__item--expenses {
  border-inline-start: 4px solid #ef4444;
}

.totals__label {
  font-size: 0.85rem;
  color: var(--rk-color-muted-foreground, #475569);
}

.totals__value {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

@media (max-width: 768px) {
  .totals__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .totals__grid--secondary {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
