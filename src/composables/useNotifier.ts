import { useEventBus } from '@vueuse/core';

export type ToastVariant = 'default' | 'success' | 'danger';

export interface ToastPayload {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const toastBus = useEventBus<ToastPayload>('mb:toast');

export function emitToast(payload: ToastPayload) {
  toastBus.emit({ ...payload, id: payload.id ?? crypto.randomUUID?.() ?? Date.now().toString(36) });
}

export function useToastBus() {
  return toastBus;
}
