// src/stores/userStore.js
import { writable } from 'svelte/store';

// Create a writable store to hold the userId
export const userIdStore = writable(null);
