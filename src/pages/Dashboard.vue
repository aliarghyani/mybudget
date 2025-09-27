<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useBreakpoints } from '@vueuse/core';
import MonthPicker from '@/components/MonthPicker.vue';
import TotalsBar from '@/components/TotalsBar.vue';
import BudgetTable from '@/components/BudgetTable.vue';
import BudgetCardList from '@/components/BudgetCardList.vue';
import { useLedgerStore } from '@/stores/ledger';
import { useSettingsStore } from '@/stores/settings';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';

const ledgerStore = useLedgerStore();
const settingsStore = useSettingsStore();
const { month } = storeToRefs(ledgerStore);
const { settings } = storeToRefs(settingsStore);
const { t } = useI18n();

const breakpoints = useBreakpoints({ md: 768 });
const isDesktop = breakpoints.greater('md');

const currentMonth = computed({
  get: () => month.value,
  set: (value: string) => ledgerStore.setMonth(value)
});

useKeyboardShortcuts();

watch(
  () => settings.value.defaultMonth,
  (value) => {
    if (!month.value) {
      ledgerStore.setMonth(value);
    }
  },
  { immediate: true }
);

function addRow() {
  ledgerStore.addRow({ month: currentMonth.value });
}
</script>

<template>
  <div class="dashboard">
    <section class="dashboard__header">
      <div class="dashboard__meta">
        <MonthPicker v-model="currentMonth" />
        <button type="button" class="dashboard__add" @click="addRow">
          {{ t('dashboard.addRow') }}
        </button>
      </div>
      <TotalsBar />
    </section>

    <section class="dashboard__content">
      <BudgetTable v-if="isDesktop" />
      <BudgetCardList v-else />
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 1.5rem;
}

.dashboard__header {
  display: grid;
  gap: 1.5rem;
}

.dashboard__meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.dashboard__add {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  background: rgba(34, 211, 238, 0.24);
  color: var(--rk-color-foreground, #0f172a);
  font-weight: 600;
  cursor: pointer;
}

.dashboard__content {
  display: grid;
}
</style>

