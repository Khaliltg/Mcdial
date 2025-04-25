<script lang="ts">
  import AgentSidebar from '$lib/components/AgentSidebar.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let isSidebarOpen = false;
  let sidebarCompact = false;

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  // Observer les changements de mode de la sidebar
  function handleSidebarModeChange(event: { detail: { compact: boolean } }) {
    sidebarCompact = event.detail.compact;
  }
  
  // Vérifier si on est sur la page de login
  $: isLoginPage = $page.url.pathname === '/agent/login';

  onMount(() => {
    // Récupérer la préférence de mode depuis localStorage
    const savedMode = localStorage.getItem('agentSidebarCompactMode');
    if (savedMode !== null) {
      sidebarCompact = savedMode === 'true';
    }
  });
</script>

{#if !isLoginPage}
  <div class="sidebar {sidebarCompact ? 'compact' : ''} {isSidebarOpen ? 'visible' : ''}">
    <AgentSidebar isOpen={false} on:modeChange={handleSidebarModeChange} />
  </div>
  
  <div class="content">
    <slot />
  </div>
{:else}
  <div class="login-only">
    <slot />
  </div>
{/if}

<style>
  .sidebar {
    width: 280px;
    transition: width 0.3s ease;
    background-color: white;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }
  
  .sidebar.compact {
    width: 80px;
  }
  
  .content {
    flex: 1;
    padding: 20px;
    min-height: calc(100vh - 56px);
  }
  
  @media (max-width: 991.98px) {
    .sidebar {
      display: none;
    }
    
    .sidebar.visible {
      display: block;
      position: fixed;
      top: 56px;
      left: 0;
      height: calc(100vh - 56px);
      z-index: 1030;
    }
    
    .content {
      width: 100%;
    }
  }
</style>
