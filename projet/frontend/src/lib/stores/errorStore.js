import { writable } from 'svelte/store';

/**
 * Store for managing error messages across the application
 * Provides a centralized way to display and manage error notifications
 * Can accept string messages for errors/success or null/empty string to clear
 */
export const errorStore = writable('');

/**
 * Helper function to clear the error store
 */
export function clearErrorStore() {
    errorStore.set('');
}
