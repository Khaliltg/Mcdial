/// <reference types="svelte" />

/**
 * Custom type declarations for Svelte components
 */

declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    // Allow any string attributes
    [key: string]: any;
  }
}

// Fix for the "File '/Users/macbook/Documents/PFE/Mcdial/projet/agent-interface/node_modules/svelte/types/index.d.ts' is not a module" error
declare module 'svelte/types' {
  export * from 'svelte';
}

declare module 'svelte/internal' {
  export function onMount(callback: () => void | (() => void)): void;
  export function onDestroy(callback: () => void): void;
}

declare module 'svelte' {
  export function onMount(callback: () => void | (() => void)): void;
  export function onDestroy(callback: () => void): void;
  // Add any additional Svelte type declarations here
}
