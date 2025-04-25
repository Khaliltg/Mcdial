<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Propriété pour la compatibilité avec les composants externes
  export const isOpen = false;
  
  // Dispatcher pour les événements
  const dispatch = createEventDispatcher();
  
  // Définition des types pour les éléments de menu
  interface MenuItem {
    name: string;
    href: string | null;
    icon: string;
    description?: string;
    children?: MenuItem[];
  }
  
  // État pour le mode compact
  let compactMode = false;
  let mobileMenuVisible = false;
  let userName = 'Agent';
  
  // Récupérer la préférence de mode depuis localStorage
  onMount(() => {
    const savedMode = localStorage.getItem('agentSidebarCompactMode');
    if (savedMode !== null) {
      compactMode = savedMode === 'true';
      // Notifier le parent du mode initial
      dispatch('modeChange', { compact: compactMode });
    }
    
    // Récupérer le nom d'utilisateur depuis localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj && userObj.name) {
          userName = userObj.name;
        }
      } catch (e) {
        console.error('Erreur lors de la récupération du nom d\'utilisateur:', e);
      }
    }
    
    // Ajouter un écouteur pour le redimensionnement
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
  
  // Gérer le redimensionnement de la fenêtre
  function handleResize() {
    if (window.innerWidth >= 992) {
      mobileMenuVisible = false;
    } else if (window.innerWidth < 768) {
      // Forcer le mode compact sur les très petits écrans
      if (!compactMode) {
        compactMode = true;
        localStorage.setItem('agentSidebarCompactMode', 'true');
        dispatch('modeChange', { compact: true });
      }
    }
  }
  
  // Fonction pour basculer le mode compact
  function toggleCompactMode() {
    compactMode = !compactMode;
    localStorage.setItem('agentSidebarCompactMode', compactMode.toString());

    // Notifier le parent du changement de mode
    dispatch('modeChange', { compact: compactMode });

    // En mode mobile, basculer aussi la visibilité
    if (window.innerWidth < 992) {
      mobileMenuVisible = !mobileMenuVisible;
    }
  }

  // Fonction pour fermer le menu mobile
  function closeMobileMenu() {
    mobileMenuVisible = false;
  }
  
  // Fonction pour basculer l'état d'expansion d'un élément
  function toggleItemExpansion(item: MenuItem) {
    if (expandedItems.has(item.name)) {
      expandedItems.delete(item.name);
    } else {
      expandedItems.add(item.name);
    }
    expandedItems = expandedItems; // Trigger reactivity
  }
  
  // Fonction pour naviguer vers un lien
  function navigateTo(href: string | null) {
    if (href) {
      goto(href);
    }
  }
  
  // Vérifier si un élément est actif
  function isItemActive(href: string | null) {
    return href === $page.url.pathname;
  }
  
  // Pour stocker les éléments développés
  let expandedItems = new Set<string>();
  
  // Menu spécifique aux agents
  const menuItems: MenuItem[] = [
    {
      name: 'Tableau de bord',
      href: '/agent/dashboard', 
      icon: 'speedometer2',
      description: 'Vue d\'ensemble de vos performances',
    },
    { 
      name: 'Appels', 
      href: null, 
      icon: 'telephone-fill',
      description: 'Gestion des appels',
      children: [
        { 
          name: 'Nouvel appel', 
          href: '/agent/calls/new', 
          icon: 'telephone-plus-fill',
          description: 'Démarrer un nouvel appel'
        },
        { 
          name: 'Historique des appels', 
          href: '/agent/calls/history', 
          icon: 'clock-history',
          description: 'Voir l\'historique de vos appels'
        }
      ]
    },
    {
      name: 'Contacts',
      href: null,
      icon: 'person-lines-fill',
      description: 'Gestion des contacts',
      children: [
        {
          name: 'Liste des contacts',
          href: '/agent/contacts/list', 
          icon: 'list-ul',
          description: 'Voir tous vos contacts'
        },
        {
          name: 'Ajouter un contact',
          href: '/agent/contacts/add', 
          icon: 'person-plus-fill',
          description: 'Créer un nouveau contact'
        }
      ]
    },
    {
      name: 'Campagnes',
      href: '/agent/campaigns', 
      icon: 'bullseye',
      description: 'Voir les campagnes actives',
    },
    {
      name: 'Scripts',
      href: '/agent/scripts', 
      icon: 'file-text-fill',
      description: 'Scripts d\'appel disponibles',
    },
    {
      name: 'Statistiques',
      href: '/agent/stats', 
      icon: 'graph-up',
      description: 'Vos statistiques personnelles',
    },
    {
      name: 'Paramètres',
      href: '/agent/settings', 
      icon: 'gear-fill',
      description: 'Configurer votre compte',
    }
  ];
</script>

<!-- Overlay pour mobile -->
{#if mobileMenuVisible}
  <button 
    type="button"
    class="sidebar-overlay" 
    class:visible={mobileMenuVisible}
    on:click={closeMobileMenu}
    on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()}
    aria-label="Fermer le menu"
  >
  </button>
{/if}

<!-- Bouton de basculement flottant pour mobile -->
<button 
  type="button" 
  class="floating-toggle d-lg-none" 
  on:click={toggleCompactMode} 
  aria-label="Basculer le menu"
>
  <i class="bi bi-list"></i>
</button>

<!-- Sidebar Container -->
<div class="sidebar-container {compactMode ? 'compact' : ''} {mobileMenuVisible ? 'visible' : ''}">
  <div class="d-flex flex-column h-100">
    <!-- Bouton de basculement du mode compact -->
    <div class="p-3 d-flex justify-content-end">
      <button 
        type="button" 
        class="compact-toggle-btn" 
        on:click={toggleCompactMode} 
        aria-label="Basculer le mode sidebar"
      >
        <i class="bi {compactMode ? 'bi-chevron-right' : 'bi-chevron-left'}"></i>
      </button>
    </div>
    
    <!-- Espace entre le bouton de bascule et le menu -->
    <div class="py-2"></div>
    
    <!-- Menu principal -->
    <div class="sidebar-menu">
      <div class="p-2">
        {#each menuItems as item, i (item.name)}
          <div class="menu-category mb-2" in:fade={{delay: i * 50, duration: 200}}>
            <!-- Élément parent -->
            {#if item.children && item.children.length > 0}
              <div 
                class="list-group-item-action d-flex justify-content-between align-items-center hover-effect"
                class:active={item.children.some(child => isItemActive(child.href))}
                on:click={() => toggleItemExpansion(item)}
                on:keydown={(e) => e.key === 'Enter' && toggleItemExpansion(item)}
                tabindex="0"
                role="button"
                aria-expanded={expandedItems.has(item.name)}
              >
                <div class="d-flex align-items-center">
                  <div class="menu-icon-container">
                    <i class="bi bi-{item.icon}"></i>
                  </div>
                  {#if !compactMode}
                    <span>{item.name}</span>
                  {/if}
                </div>
                {#if !compactMode}
                  <i class="bi bi-chevron-{expandedItems.has(item.name) ? 'down' : 'right'} small-icon"></i>
                {/if}
              </div>
              
              <!-- Sous-menu -->
              {#if expandedItems.has(item.name) && !compactMode}
                <div class="submenu ps-4 submenu-animation">
                  {#each item.children as child, j}
                    <div 
                      class="list-group-item-action d-flex align-items-center hover-effect mt-1"
                      class:active={isItemActive(child.href)}
                      on:click={() => navigateTo(child.href)}
                      on:keydown={(e) => e.key === 'Enter' && navigateTo(child.href)}
                      tabindex="0"
                      role="button"
                      in:fade={{delay: j * 50, duration: 200}}
                    >
                      <div class="menu-icon-container-sm">
                        <i class="bi bi-{child.icon}"></i>
                      </div>
                      <span>{child.name}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            {:else}
              <!-- Élément simple sans enfants -->
              <div 
                class="list-group-item-action d-flex align-items-center hover-effect"
                class:active={isItemActive(item.href)}
                on:click={() => navigateTo(item.href)}
                on:keydown={(e) => e.key === 'Enter' && navigateTo(item.href)}
                tabindex="0"
                role="button"
              >
                <div class="menu-icon-container">
                  <i class="bi bi-{item.icon}"></i>
                </div>
                {#if !compactMode}
                  <span>{item.name}</span>
                {/if}
              </div>
            {/if}
            
            <!-- Infobulle de description pour le mode compact -->
            {#if compactMode && item.description}
              <div class="compact-tooltip">
                <div class="tooltip-content">
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  {#if item.children && item.children.length > 0}
                    <div class="compact-submenu">
                      {#each item.children as child}
                        <div 
                          class="compact-submenu-item"
                          on:click={() => navigateTo(child.href)}
                          on:keydown={(e) => e.key === 'Enter' && navigateTo(child.href)}
                          tabindex="0"
                          role="button"
                        >
                          <i class="bi bi-{child.icon} me-2"></i>
                          {child.name}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Espace flexible pour pousser le pied de page vers le bas -->
    <div class="flex-grow-1"></div>
    
    <!-- Pied de page de la sidebar - Style Flowbite -->
    <div class="sidebar-footer p-3 mt-auto">
      <div class="user-profile-card">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <div class="avatar-circle">
              <span>{userName.charAt(0).toUpperCase()}</span>
            </div>
            {#if !compactMode}
              <div class="ms-2 user-info">
                <div class="user-name">{userName}</div>
                <div class="user-status">
                  <span class="status-dot"></span>
                  <small class="text-gray-500">En ligne</small>
                </div>
              </div>
            {/if}
          </div>
          
          {#if !compactMode}
            <div>
              <button class="flowbite-btn" title="Déconnexion">
                <i class="bi bi-box-arrow-right"></i>
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Styles de base */
  .sidebar-container {
    width: 280px;
    height: 100%;
    background-color: #ffffff;
    border-right: 1px solid #e5e7eb;
    transition: width 0.3s ease;
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1030;
  }
  
  .compact {
    width: 80px;
  }
  
  /* Bouton de basculement du mode compact - Style Flowbite */
  .compact-toggle-btn {
    background-color: transparent;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  
  .compact-toggle-btn:hover {
    background-color: #f3f4f6;
    color: #3b82f6;
    border-color: #d1d5db;
  }
  
  .compact-toggle-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
  
  @media (max-width: 991.98px) {
    .sidebar-container {
      position: fixed;
      top: 0;
      left: -280px;
      height: 100vh;
      z-index: 1050;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    }
    
    .sidebar-container.visible {
      left: 0;
    }
    
    .compact {
      left: -80px;
    }
    
    .compact.visible {
      left: 0;
    }
  }
  
  /* Éléments de menu - Style Flowbite */
  .list-group-item-action {
    border-radius: 8px;
    margin: 0 8px 4px 8px;
    transition: all 0.2s ease;
    border: none;
    padding: 10px 12px;
    color: #6b7280;
    background-color: transparent;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
  }
  
  .list-group-item-action:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  
  .list-group-item-action.active {
    background-color: #f3f4f6;
    color: #1f2937;
    font-weight: 600;
  }

  .list-group-item-action.active i {
    color: #3b82f6;
  }
  
  .menu-icon-container {
    width: 24px;
    height: 24px;
    font-size: 1.25rem;
    transition: all 0.2s ease;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }
  
  .menu-icon-container:hover {
    color: #1f2937;
  }
  
  .active .menu-icon-container {
    color: #3b82f6;
  }
  
  .menu-icon-container-sm {
    width: 20px;
    height: 20px;
    font-size: 1rem;
    transition: all 0.2s ease;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
  }
  
  .menu-icon-container-sm:hover {
    color: #1f2937;
  }
  
  .active .menu-icon-container-sm {
    color: #3b82f6;
  }

  .hover-effect {
    transition: all 0.2s ease;
    border-radius: 10px;
    margin-bottom: 5px;
  }

  .hover-effect:hover {
    background-color: rgba(13, 110, 253, 0.05);
  }
  
  .hover-effect:hover .menu-icon-container,
  .hover-effect:hover .menu-icon-container-sm {
    background-color: rgba(13, 110, 253, 0.1);
  }
  
  .compact .hover-effect:hover {
    transform: translateX(3px);
  }

  .description-tooltip {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .hover-effect:hover .description-tooltip {
    opacity: 1;
    max-height: 50px;
  }

  .submenu-animation {
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Avatar utilisateur - Style Flowbite */
  .avatar-circle {
    width: 36px;
    height: 36px;
    border-radius: 9999px;
    background-color: #e5e7eb;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .avatar-circle:hover {
    background-color: #d1d5db;
  }
  
  /* Pied de page et profil - Style Flowbite */
  .sidebar-footer {
    border-top: 1px solid #e5e7eb;
  }
  
  .user-profile-card {
    background-color: transparent;
    border-radius: 8px;
    padding: 10px;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 14px;
    color: #1f2937;
  }
  
  .user-status {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #6b7280;
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    margin-right: 5px;
  }
  
  .flowbite-btn {
    background-color: transparent;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  
  .flowbite-btn:hover {
    background-color: #f3f4f6;
    color: #3b82f6;
    border-color: #d1d5db;
  }
  
  /* Overlay pour mobile */
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1029;
    opacity: 1;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(2px);
  }
  
  /* Bouton de basculement flottant */
  .floating-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1030;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    font-size: 1.25rem;
  }
  
  .floating-toggle:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  .floating-toggle:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  /* Sous-menu pour mode compact */
  .compact-tooltip {
    position: absolute;
    left: 80px;
    top: 0;
    display: none;
    z-index: 1040;
  }
  
  .compact .menu-category:hover .compact-tooltip {
    display: block;
  }
  
  .tooltip-content {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    padding: 12px;
    width: 220px;
    border: 1px solid #e5e7eb;
  }
  
  .tooltip-content strong {
    display: block;
    margin-bottom: 5px;
    color: #1f2937;
  }
  
  .tooltip-content p {
    margin-bottom: 8px;
    font-size: 12px;
    color: #6b7280;
  }
  
  .compact-submenu {
    border-top: 1px solid #e5e7eb;
    margin-top: 8px;
    padding-top: 8px;
  }
  
  .compact-submenu-item {
    padding: 8px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #4b5563;
  }
  
  .compact-submenu-item:hover {
    background-color: #f3f4f6;
    color: #3b82f6;
  }
  
  /* Responsive Adjustments */
  @media (max-width: 767.98px) {
    .sidebar-container {
      width: 100%;
      max-width: 300px;
    }
    
    .compact {
      width: 80px;
    }
  }
</style>
