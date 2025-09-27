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
  <div class="month-picker" role="group" :aria-label="t('dashboard.monthGroupLabel')">
    <button
      type="button"
      class="month-picker__button"
      :aria-label="t('dashboard.prevMonth')"
      @click="shiftMonth(-1)"
    >
      <
    </button>
    <label class="month-picker__label">
      <span class="sr-only">{{ t('dashboard.monthInputLabel') }}</span>
      <input
        v-model="monthValue"
        type="month"
        inputmode="numeric"
        class="month-picker__input"
      />
    </label>
    <button
      type="button"
      class="month-picker__button"
      :aria-label="t('dashboard.nextMonth')"
      @click="shiftMonth(1)"
    >
      >
    </button>
  </div>
</template>

<style scoped>
.month-picker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--rk-color-surface, rgba(255, 255, 255, 0.85));
  border-radius: 999px;
  padding-inline: 0.75rem;
  padding-block: 0.35rem;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.month-picker__button {
  border: none;
  background: transparent;
  font-size: 1.35rem;
  cursor: pointer;
  color: var(--rk-color-foreground, #0f172a);
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
}

.month-picker__button:hover,
.month-picker__button:focus-visible {
  background: rgba(148, 163, 184, 0.18);
}

.month-picker__label {
  position: relative;
}

.month-picker__input {
  border: none;
  background: transparent;
  font-size: 1rem;
  font-weight: 600;
  color: inherit;
  min-inline-size: 7.5rem;
}

.month-picker__input:focus-visible {
  outline: none;
}

.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
