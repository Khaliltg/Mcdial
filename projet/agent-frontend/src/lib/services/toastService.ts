import { writable } from 'svelte/store';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  showProgressBar: boolean;
}

// Store pour gérer les toasts
export const toasts = writable<Toast[]>([]);

// Fonction pour ajouter un toast
export function addToast(
  message: string, 
  type: ToastType = 'info',
  duration: number = 5000,
  showProgressBar: boolean = true
): string {
  const id = Date.now().toString();
  
  toasts.update(all => [
    ...all,
    { id, type, message, duration, showProgressBar }
  ]);
  
  return id;
}

// Fonction pour supprimer un toast par son ID
export function removeToast(id: string): void {
  toasts.update(all => all.filter(t => t.id !== id));
}

// Raccourcis pour les différents types de toasts
export function success(message: string, duration: number = 5000): string {
  return addToast(message, 'success', duration);
}

export function error(message: string, duration: number = 8000): string {
  return addToast(message, 'error', duration);
}

export function warning(message: string, duration: number = 6000): string {
  return addToast(message, 'warning', duration);
}

export function info(message: string, duration: number = 5000): string {
  return addToast(message, 'info', duration);
}
