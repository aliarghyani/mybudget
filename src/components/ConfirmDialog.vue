<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle
} from 'reka-ui';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

function handleConfirm() {
  emit('confirm');
  open.value = false;
}

function handleCancel() {
  emit('cancel');
  open.value = false;
}
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <slot name="trigger" />
    <AlertDialogPortal>
      <AlertDialogOverlay class="confirm-dialog__overlay" />
      <AlertDialogContent class="confirm-dialog__content" role="alertdialog">
        <AlertDialogTitle class="confirm-dialog__title">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription
          v-if="description"
          class="confirm-dialog__description"
        >
          {{ description }}
        </AlertDialogDescription>
        <div class="confirm-dialog__actions">
          <AlertDialogCancel
            class="confirm-dialog__button"
            type="button"
            @click="handleCancel"
          >
            {{ cancelLabel }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="confirm-dialog__button"
            :class="{ 'confirm-dialog__button--destructive': destructive }"
            type="button"
            @click="handleConfirm"
          >
            {{ confirmLabel }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style scoped>
.confirm-dialog__overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, #111827 60%, transparent);
}

.confirm-dialog__content {
  position: fixed;
  inset-inline: 50%;
  inset-block: 50%;
  transform: translate(-50%, -50%);
  min-inline-size: min(90vw, 360px);
  background: var(--rk-color-surface, #ffffff);
  color: var(--rk-color-foreground, #111827);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirm-dialog__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.confirm-dialog__description {
  margin: 0;
  line-height: 1.5;
  color: var(--rk-color-muted-foreground, #4b5563);
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.confirm-dialog__button {
  min-inline-size: 96px;
  border-radius: 999px;
  border: none;
  padding-block: 0.5rem;
  padding-inline: 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  background: var(--rk-color-muted, #e5e7eb);
  color: var(--rk-color-foreground, #111827);
  transition: background 0.2s ease, color 0.2s ease;
}

.confirm-dialog__button:hover {
  background: var(--rk-color-muted-foreground, #d1d5db);
}

.confirm-dialog__button--destructive {
  background: var(--rk-color-danger, #ef4444);
  color: #ffffff;
}

.confirm-dialog__button--destructive:hover {
  background: color-mix(in srgb, var(--rk-color-danger, #ef4444) 85%, #000 15%);
}
</style>
