import { writable } from 'svelte/store';

// Store pour accéder aux fonctions du PredictiveDialer depuis d'autres composants
const dialerStore = writable({
  stopPredictiveMode: null as (() => void) | null
});

export default dialerStore;
