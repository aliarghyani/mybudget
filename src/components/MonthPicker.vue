<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

function normalize(value: string): string {
  return /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
}

const monthValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', normalize(value))
});

function shiftMonth(delta: number) {
  if (!props.modelValue) {
    emit('update:modelValue', new Date().toISOString().slice(0, 7));
    return;
  }
  const [yearStr, monthStr] = props.modelValue.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  emit('update:modelValue', formatted);
}
</script>

<template>
  <div class="inline-flex items-center gap-2 bg-white/85 dark:bg-slate-900/70 rounded-full px-3 py-1 border border-slate-200/60 dark:border-slate-700/60" role="group" :aria-label="t('dashboard.monthGroupLabel')">
    <button type="button" class="w-8 h-8 grid place-items-center rounded-full text-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60" :aria-label="t('dashboard.prevMonth')" @click="shiftMonth(-1)">
      ‹
    </button>
    <label class="relative">
      <span class="sr-only">{{ t('dashboard.monthInputLabel') }}</span>
      <input v-model="monthValue" type="month" inputmode="numeric" class="bg-transparent font-semibold min-w-[7.5rem] focus:outline-none" />
    </label>
    <button type="button" class="w-8 h-8 grid place-items-center rounded-full text-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60" :aria-label="t('dashboard.nextMonth')" @click="shiftMonth(1)">
      ›
    </button>
  </div>
</template>
