<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';

  // Props
  export let isOpen = false;

  // Dispatcher for events
  const dispatch = createEventDispatcher();

  // Menu item type definition
  interface MenuItem {
    name: string;
    href: string | null;
    icon: string;
    description?: string;
    children?: MenuItem[];
  }

  // State variables
  let compactMode = false;
  let searchQuery = '';
  let filteredItems: MenuItem[] = [];
  let expandedItems = new Set<string>();
  let mobileMenuVisible = false;
  let userName = 'Utilisateur';

  // Menu items
  const menuItems: MenuItem[] = [
    {
      name: 'Rapport',
      href: null,
      icon: 'file-text-fill',
      description: 'Générer un rapport',
    },
    {
      name: 'Utilisateurs',
      href: null,
      icon: 'people-fill',
      description: 'Outils de gestion des utilisateurs',
      children: [
        { name: 'Afficher les utilisateurs', href: '/users/list', icon: 'list-ul' },
        { name: 'Ajouter un nouvel utilisateur', href: '/users/add', icon: 'person-plus-fill' },
        { name: 'Copier l utilisateur', href: '/users/copy', icon: 'person' },
        { name: 'Rechercher un utilisateur', href: '/users/search', icon: 'search' },
      ],
    },
    {
      name: 'Statistiques des utilisateurs',
      href: null,
      icon: 'clipboard',
      description: 'Afficher les statistiques des utilisateurs',
      children: [
        { name: 'Statut des utilisateurs', href: '/users/stats', icon: 'stop-circle' },
      ],
    },
    {
      name: 'Campagnes',
      href: null,
      icon: 'bullseye',
      description: 'Gestion des campagnes',
      children: [
        { name: 'Campagnes principales', href: '/compagnes/show', icon: 'list-ul' },
        { name: 'Statuts', href: '/compagnes/statues', icon: 'stop-circle' },
        { name: 'Cadran automatique', href: '/compagnes/auto_dial', icon: 'telephone' },
        { name: 'Pause codes', href: '/compagnes/pause_code', icon: 'pause' },
      ],
    },
    {
      name: 'Groupes d utilisateurs',
      href: null,
      icon: 'people',
      description: 'Manage user groups',
      children: [
        { name: 'Afficher les groupes d utilisateurs', href: '/userGroupe/afficher', icon: 'people' },
        { name: 'Rapport horaire de groupe', href: '/user-groups/group-hourly-report', icon: 'clock' },
        { name: 'Changement de groupe groupé', href: '/userGroupe/bulk_userGroupe', icon: 'arrow-down-up' },
      ],
    },
    // Add more menu items as needed...
  ];

  // Lifecycle method
  onMount(() => {
    const savedMode = localStorage.getItem('sidebarCompactMode');
    compactMode = savedMode === 'true';
    dispatch('modeChange', { compact: compactMode });

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      userName = userObj?.name || userName;
    }

    filteredItems = menuItems;
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Handle window resizing
  function handleResize() {
    if (window.innerWidth < 768 && !compactMode) {
      compactMode = true;
      localStorage.setItem('sidebarCompactMode', 'true');
      dispatch('modeChange', { compact: true });
    }
  }

  // Toggle compact mode
  function toggleCompactMode() {
    compactMode = !compactMode;
    localStorage.setItem('sidebarCompactMode', compactMode.toString());
    dispatch('modeChange', { compact: compactMode });
    if (window.innerWidth < 992) {
      mobileMenuVisible = !mobileMenuVisible;
    }
  }

  // Close mobile menu
  function closeMobileMenu() {
    mobileMenuVisible = false;
  }

  // Navigate to a link
  function navigateTo(href: string | null) {
    if (href) {
      goto(href);
    }
  }

  // Handle item click
  function handleItemClick(item: MenuItem) {
    if (item.children) {
      expandedItems.has(item.name) ? expandedItems.delete(item.name) : expandedItems.add(item.name);
    } else if (item.href) {
      navigateTo(item.href);
    }
  }
</script>

<!-- Sidebar Structure -->
<div class="sidebar-container {compactMode ? 'compact' : ''} {mobileMenuVisible ? 'visible' : ''}">
  <div class="d-flex flex-column h-100">
    <div class="p-3 d-flex justify-content-end">
      <button type="button" class="compact-toggle-btn" on:click={toggleCompactMode}>
        <i class="bi {compactMode ? 'bi-chevron-right' : 'bi-chevron-left'}"></i>
      </button>
    </div>
    <div class="sidebar-menu">
      <div class="p-2">
        {#each filteredItems as item}
          <div>
            <button 
              type="button"
              class="list-group-item-action d-flex justify-content-between align-items-center"
              on:click={() => handleItemClick(item)}
            >
              <div class="d-flex align-items-center">
                <i class="bi bi-{item.icon} me-3"></i>
                <span>{item.name}</span>
              </div>
              {#if item.children}
                <i class="bi bi-chevron-{expandedItems.has(item.name) ? 'down' : 'right'}"></i>
              {/if}
            </button>
            {#if item.children && expandedItems.has(item.name)}
              <div class="submenu">
                {#each item.children as child}
                  <button 
                    type="button"
                    class="list-group-item-action"
                    on:click={() => navigateTo(child.href)}
                  >
                    <i class="bi bi-{child.icon}"></i>
                    <span>{child.name}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  /* Add your styling here */
  .sidebar-container {
    width: 250px;
    background-color: #fff;
  }
  .compact {
    width: 80px;
  }
  .list-group-item-action {
    padding: 10px;
    transition: background-color 0.2s;
  }
  .list-group-item-action:hover {
    background-color: #f0f0f0;
  }
</style>