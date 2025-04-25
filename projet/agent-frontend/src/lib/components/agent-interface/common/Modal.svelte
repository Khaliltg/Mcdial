<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  export let show: boolean = false;
  export let title: string = '';
  export let width: string = 'max-w-lg'; // Tailwind width class
  export let canClose: boolean = true;

  function close() {
    if (canClose) {
      dispatch('close');
    }
  }

  function onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" role="presentation" on:click={onOverlayClick}>
    <div class={`bg-white rounded-lg shadow-xl w-full ${width} mx-4 relative`} style="max-height: 90vh; overflow-y: auto;" role="dialog" aria-modal="true" tabindex="0" on:keydown={(e) => { if (e.key === 'Escape') close(); }}>
      <div class="flex justify-between items-center border-b px-6 py-4">
        <h2 class="text-xl font-bold text-gray-800">{title}</h2>
        {#if canClose}
          <button class="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" on:click={close} aria-label="Fermer">
            &times;
          </button>
        {/if}
      </div>
      <div class="p-6">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure modal overlays are always above other content */
  .z-50 { z-index: 1050; }
</style>
