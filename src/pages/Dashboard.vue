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
  <div class="grid gap-6">
    <section class="grid gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <MonthPicker v-model="currentMonth" />
        <button type="button" class="rounded-full px-4 py-2 font-semibold bg-cyan-200/40 text-slate-900 hover:bg-cyan-200/60" @click="addRow">
          {{ t('dashboard.addRow') }}
        </button>
      </div>
      <TotalsBar />
    </section>

    <section class="grid">
      <BudgetTable v-if="isDesktop" />
      <BudgetCardList v-else />
    </section>
  </div>
</template>


