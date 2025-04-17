<script>
    import { onMount } from 'svelte';
    import { fade, slide, fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { writable } from 'svelte/store';
  
    // Stores for state management
    const groupData = writable(null);
    const isLoading = writable(true);
    const error = writable(null);
    
    // Store for users data
    const usersData = writable([]);
    const isLoadingUsers = writable(false);
    const usersError = writable(null);
    
    // Store for call times data
    const callTimesData = writable([]);
    const isLoadingCallTimes = writable(false);
    const callTimesError = writable(null);
    
    // Store for campaigns data
    const campaignsData = writable([]);
    const isLoadingCampaigns = writable(false);
    const campaignsError = writable(null);
    
    // Active tab tracking
    let activeTab = 'general';
    
    // Fetch group details from API using the specific endpoint
    async function fetchGroupDetails(id) {
      try {
        isLoading.set(true);
        
        // Vérifier si l'ID est valide
        if (!id) {
          throw new Error("ID de groupe non spécifié");
        }
        
        const response = await fetch(`http://localhost:8000/api/admin/usergroup/getUserGroupById/${id}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données brutes de l'API:", data);
        
        // Vérifier si les données sont un tableau
        if (Array.isArray(data) && data.length > 0) {
          // Si c'est un tableau, prendre le premier élément
          groupData.set(data[0]);
          console.log("Données traitées (tableau):", data[0]);
          
          // Fetch users for this group
          fetchGroupUsers(data[0].user_group);
        } else if (data && typeof data === 'object') {
          // Si c'est un objet, l'utiliser directement
          groupData.set(data);
          console.log("Données traitées (objet):", data);
          
          // Fetch users for this group
          fetchGroupUsers(data.user_group);
        } else {
          throw new Error(`Aucune donnée trouvée pour le groupe avec ID "${id}"`);
        }
        
        // Fetch call times and campaigns
        fetchCallTimes();
        fetchCampaigns();
      } catch (err) {
        console.error('Erreur lors de la récupération des détails du groupe:', err);
        error.set(err.message);
      } finally {
        isLoading.set(false);
      }
    }
    
    // Fetch users for this group
    async function fetchGroupUsers(groupId) {
      try {
        isLoadingUsers.set(true);
        usersError.set(null);
        
        console.log(`Récupération des utilisateurs pour le groupe: ${groupId}`);
        
        const response = await fetch(`http://localhost:8000/api/admin/usergroup/getUsersByUserGroup/${groupId}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données des utilisateurs:", data);
        
        if (Array.isArray(data)) {
          usersData.set(data);
        } else if (data && typeof data === 'object') {
          // Si c'est un objet unique, le mettre dans un tableau
          usersData.set([data]);
        } else {
          usersData.set([]);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        usersError.set(err.message);
      } finally {
        isLoadingUsers.set(false);
      }
    }
    
    // Fetch call times
    async function fetchCallTimes() {
      try {
        isLoadingCallTimes.set(true);
        callTimesError.set(null);
        
        console.log("Récupération des horaires d'appel");
        
        const response = await fetch(`http://localhost:8000/api/admin/usergroup/getCallTimes`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données des horaires d'appel:", data);
        
        if (Array.isArray(data)) {
          callTimesData.set(data);
        } else if (data && typeof data === 'object') {
          // Si c'est un objet unique, le mettre dans un tableau
          callTimesData.set([data]);
        } else {
          callTimesData.set([]);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des horaires d\'appel:', err);
        callTimesError.set(err.message);
      } finally {
        isLoadingCallTimes.set(false);
      }
    }
    
    // Fetch campaigns
    async function fetchCampaigns() {
      try {
        isLoadingCampaigns.set(true);
        campaignsError.set(null);
        
        console.log("Récupération des campagnes");
        
        const response = await fetch(`http://localhost:8000/api/admin/compagnies/recuperer`, { credentials: 'include' });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données des campagnes:", data);
        
        if (Array.isArray(data)) {
          campaignsData.set(data);
        } else if (data && typeof data === 'object') {
          // Si c'est un objet unique, le mettre dans un tableau
          campaignsData.set([data]);
        } else {
          campaignsData.set([]);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des campagnes:', err);
        campaignsError.set(err.message);
      } finally {
        isLoadingCampaigns.set(false);
      }
    }
  
    // Get URL parameters
    function getUrlParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id') || '';
      console.log("ID récupéré de l'URL:", id);
      
      if (!id) {
        error.set("ID de groupe non spécifié");
        isLoading.set(false);
      } else {
        fetchGroupDetails(id);
      }
    }
  
    // Format text fields that might be NULL or empty
    function formatField(value) {
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      return value;
    }
  
    // Format boolean fields (Y/N)
    function formatBoolean(value) {
      if (value === 'Y') {
        return { value: 'Oui', class: 'badge-success' };
      } else if (value === 'N') {
        return { value: 'Non', class: 'badge-danger' };
      } else if (value === 'ADMIN_EXEMPT') {
        return { value: 'Admin Exempt', class: 'badge-warning' };
      } else {
        return { value: '-', class: 'badge-secondary' };
      }
    }
    
    // Format active status
    function formatActiveStatus(value) {
      if (value === 'Y') {
        return { value: 'Actif', class: 'badge-success' };
      } else if (value === 'N') {
        return { value: 'Inactif', class: 'badge-danger' };
      } else {
        return { value: formatField(value), class: 'badge-secondary' };
      }
    }
    
    // Change active tab
    function setActiveTab(tab) {
      activeTab = tab;
    }
  
    // Initialize component
    onMount(() => {
      getUrlParams();
    });
    
    // Reactive variables
    let groupDataValue;
    $: groupDataValue = $groupData;
    let isLoadingValue;
    $: isLoadingValue = $isLoading;
    let errorValue;
    $: errorValue = $error;
    let users;
    $: users = $usersData;
    let isLoadingUsersValue;
    $: isLoadingUsersValue = $isLoadingUsers;
    let usersErrorValue;
    $: usersErrorValue = $usersError;
    let callTimes;
    $: callTimes = $callTimesData;
    let isLoadingCallTimesValue;
    $: isLoadingCallTimesValue = $isLoadingCallTimes;
    let callTimesErrorValue;
    $: callTimesErrorValue = $callTimesError;
    let campaigns;
    $: campaigns = $campaignsData;
    let isLoadingCampaignsValue;
    $: isLoadingCampaignsValue = $isLoadingCampaigns;
    let campaignsErrorValue;
    $: campaignsErrorValue = $campaignsError;
</script>

<div class="page-container">
    <header class="header">
        <div class="header-content">
            <h1 class="header-title">
                <i class="fas fa-users-cog"></i> Détails du Groupe d'Utilisateurs
            </h1>
            <div class="header-actions">
                <button class="btn btn-secondary" on:click={() => goto('/userGroupe/afficher')}>
                    <i class="fas fa-arrow-left"></i> Retour à la liste
                </button>
            </div>
        </div>
    </header>

    {#if $error}
        <div class="alert alert-danger" role="alert" transition:slide={{ duration: 300 }}>
            <div class="alert-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="alert-content">
                {$error}
            </div>
            <button type="button" class="alert-close" on:click={() => error.set(null)}>
                <i class="fas fa-times"></i>
            </button>
        </div>
    {/if}

    <main class="main-content">
        {#if $isLoading}
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Chargement des détails du groupe...</p>
            </div>
        {:else if !$groupData}
            <div class="empty-state">
                <i class="fas fa-users-slash empty-icon"></i>
                <h3>Groupe non trouvé</h3>
                <p>Le groupe d'utilisateurs demandé n'existe pas ou n'a pas pu être chargé.</p>
                <button class="btn btn-primary" on:click={() => goto('/userGroupe/afficher')}>
                    <i class="fas fa-arrow-left"></i> Retour à la liste des groupes
                </button>
            </div>
        {:else}
            <div class="details-container" transition:fade={{ duration: 200 }}>
                <!-- Group Header -->
                <div class="details-header">
                    <div class="details-title-section">
                        <h2 class="details-title">{groupDataValue.group_name}</h2>
                        <span class="details-id">ID: {groupDataValue.user_group}</span>
                    </div>
                    <div class="details-actions">
                        <button class="btn btn-outline">
                            <i class="fas fa-pencil-alt"></i> Modifier
                        </button>
                        <button class="btn btn-primary">
                            <i class="fas fa-save"></i> Enregistrer
                        </button>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <div class="tabs-container">
                    <div class="tabs-nav">
                        <button 
                            class="tab-btn {activeTab === 'general' ? 'active' : ''}" 
                            on:click={() => setActiveTab('general')}
                        >
                            <i class="fas fa-info-circle"></i> Général
                        </button>
                        <button 
                            class="tab-btn {activeTab === 'users' ? 'active' : ''}" 
                            on:click={() => setActiveTab('users')}
                        >
                            <i class="fas fa-users"></i> Utilisateurs
                            {#if users.length > 0}
                                <span class="tab-badge">{users.length}</span>
                            {/if}
                        </button>
                        <button 
                            class="tab-btn {activeTab === 'permissions' ? 'active' : ''}" 
                            on:click={() => setActiveTab('permissions')}
                        >
                            <i class="fas fa-lock"></i> Permissions
                        </button>
                        <button 
                            class="tab-btn {activeTab === 'capabilities' ? 'active' : ''}" 
                            on:click={() => setActiveTab('capabilities')}
                        >
                            <i class="fas fa-headset"></i> Capacités
                        </button>
                        <button 
                            class="tab-btn {activeTab === 'resources' ? 'active' : ''}" 
                            on:click={() => setActiveTab('resources')}
                        >
                            <i class="fas fa-cogs"></i> Ressources
                        </button>
                    </div>

                    <!-- Tab Content -->
                    <div class="tab-content">
                        <!-- General Tab -->
                        {#if activeTab === 'general'}
                            <div class="tab-pane" transition:fade={{ duration: 150 }}>
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class="card-title"><i class="fas fa-info-circle"></i> Informations Générales</h3>
                                    </div>
                                    <div class="card-body">
                                        <div class="info-grid">
                                            <div class="info-item">
                                                <span class="info-label">ID du Groupe</span>
                                                <span class="info-value highlight">{groupDataValue.user_group}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Nom du Groupe</span>
                                                <span class="info-value">{groupDataValue.group_name}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Connexion Forcée</span>
                                                <span class="info-value">
                                                    {#if groupDataValue.forced_timeclock_login}
                                                        {@const status = formatBoolean(groupDataValue.forced_timeclock_login)}
                                                        <span class="badge {status.class}">{status.value}</span>
                                                    {:else}
                                                        <span class="badge badge-secondary">-</span>
                                                    {/if}
                                                </span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Application des Shifts</span>
                                                <span class="info-value">{formatField(groupDataValue.shift_enforcement)}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Plein Écran Agent</span>
                                                <span class="info-value">
                                                    {#if groupDataValue.agent_fullscreen}
                                                        {@const status = formatBoolean(groupDataValue.agent_fullscreen)}
                                                        <span class="badge {status.class}">{status.value}</span>
                                                    {:else}
                                                        <span class="badge badge-secondary">-</span>
                                                    {/if}
                                                </span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Voir Statut Agent</span>
                                                <span class="info-value">
                                                    {#if groupDataValue.agent_status_view_time}
                                                        {@const status = formatBoolean(groupDataValue.agent_status_view_time)}
                                                        <span class="badge {status.class}">{status.value}</span>
                                                    {:else}
                                                        <span class="badge badge-secondary">-</span>
                                                    {/if}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="card mt-4">
                                    <div class="card-header">
                                        <h3 class="card-title"><i class="fas fa-network-wired"></i> Restrictions IP</h3>
                                    </div>
                                    <div class="card-body">
                                        <div class="info-grid">
                                            <div class="info-item">
                                                <span class="info-label">Liste IP Admin</span>
                                                <span class="info-value code-block">{formatField(groupDataValue.admin_ip_list)}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Liste IP Agent</span>
                                                <span class="info-value code-block">{formatField(groupDataValue.agent_ip_list)}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Liste IP API</span>
                                                <span class="info-value code-block">{formatField(groupDataValue.api_ip_list)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="card mt-4">
                                    <div class="card-header">
                                        <h3 class="card-title"><i class="fas fa-cog"></i> Autres Paramètres</h3>
                                    </div>
                                    <div class="card-body">
                                        <div class="info-grid">
                                            <div class="info-item">
                                                <span class="info-label">URL Admin Home</span>
                                                <span class="info-value">{formatField(groupDataValue.admin_home_url)}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">ID Script</span>
                                                <span class="info-value">{formatField(groupDataValue.script_i)}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">En-tête Rapports</span>
                                                <span class="info-value">{formatField(groupDataValue.reports_header_override)}</span>
                                            </div>
                                            <div class="info-item">
                                                <span class="info-label">Dernière Modification</span>
                                                <span class="info-value">
                                                    {groupDataValue.modify_stamp ? new Date(groupDataValue.modify_stamp).toLocaleString() : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Users Tab -->
                        {#if activeTab === 'users'}
                            <div class="tab-pane" transition:fade={{ duration: 150 }}>
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class="card-title"><i class="fas fa-users"></i> Utilisateurs du Groupe</h3>
                                        <div class="card-actions">
                                            <div class="search-container">
                                                <i class="fas fa-search search-icon"></i>
                                                <input type="text" class="search-input" placeholder="Rechercher un utilisateur...">
                                            </div>
                                            <button class="btn btn-sm btn-primary">
                                                <i class="fas fa-user-plus"></i> Ajouter
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        {#if $isLoadingUsers}
                                            <div class="loading-container-small">
                                                <div class="spinner-small"></div>
                                                <p>Chargement des utilisateurs...</p>
                                            </div>
                                        {:else if $usersError}
                                            <div class="alert alert-danger alert-sm">
                                                <div class="alert-icon">
                                                    <i class="fas fa-exclamation-circle"></i>
                                                </div>
                                                <div class="alert-content">
                                                    {$usersError}
                                                </div>
                                            </div>
                                        {:else if users.length === 0}
                                            <div class="empty-state-small">
                                                <i class="fas fa-user-slash"></i>
                                                <p>Aucun utilisateur trouvé dans ce groupe.</p>
                                                <button class="btn btn-sm btn-primary">
                                                    <i class="fas fa-user-plus"></i> Ajouter un utilisateur
                                                </button>
                                            </div>
                                        {:else}
                                            <div class="table-responsive">
                                                <table class="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Utilisateur</th>
                                                            <th>Nom Complet</th>
                                                            <th>Niveau</th>
                                                            <th>Statut</th>
                                                            <th class="text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {#each users as user}
                                                            <tr>
                                                                <td class="user-id">{formatField(user.user)}</td>
                                                                <td>{formatField(user.full_name)}</td>
                                                                <td>
                                                                    <span class="level-badge">
                                                                        {formatField(user.user_level)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {#if user.active}
                                                                        {@const status = formatActiveStatus(user.active)}
                                                                        <span class="badge {status.class}">{status.value}</span>
                                                                    {:else}
                                                                        <span class="badge badge-secondary">-</span>
                                                                    {/if}
                                                                </td>
                                                                <td class="text-right">
                                                                    <div class="action-buttons">
                                                                        <button class="btn-icon" title="Voir les détails">
                                                                            <i class="fas fa-eye"></i>
                                                                        </button>
                                                                        <button class="btn-icon" title="Modifier">
                                                                            <i class="fas fa-pencil-alt"></i>
                                                                        </button>
                                                                        <button class="btn-icon btn-icon-danger" title="Supprimer">
                                                                            <i class="fas fa-trash-alt"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        {/each}
                                                    </tbody>
                                                </table>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Permissions Tab -->
                        {#if activeTab === 'permissions'}
                            <div class="tab-pane" transition:fade={{ duration: 150 }}>
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class="card-title"><i class="fas fa-lock"></i> Permissions</h3>
                                    </div>
                                    <div class="card-body">
                                        <div class="permissions-grid">
                                            <div class="permission-section">
                                                <h4 class="section-title">Campagnes</h4>
                                                <div class="permission-item">
                                                    <span class="permission-label">Campagnes Autorisées</span>
                                                    <div class="permission-value code-block">{formatField(groupDataValue.allowed_campaigns)}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="permission-section">
                                                <h4 class="section-title">Rapports</h4>
                                                <div class="permission-item">
                                                    <span class="permission-label">Rapports Autorisés</span>
                                                    <div class="permission-value code-block">{formatField(groupDataValue.allowed_reports)}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="permission-section">
                                                <h4 class="section-title">Visibilité des Groupes</h4>
                                                <div class="permission-item">
                                                    <span class="permission-label">Groupes Visibles Admin</span>
                                                    <div class="permission-value code-block">{formatField(groupDataValue.admin_viewable_groups)}</div>
                                                </div>
                                                <div class="permission-item">
                                                    <span class="permission-label">Groupes Statut Agent Visibles</span>
                                                    <div class="permission-value code-block">{formatField(groupDataValue.agent_status_viewable_groups)}</div>
                                                </div>
                                            </div>
                                            
                                            <div class="permission-section">
                                                <h4 class="section-title">Chat et Files d'Attente</h4>
                                                <div class="permission-item">
                                                    <span class="permission-label">Groupes de Chat Autorisés</span>
                                                    <div class="permission-value code-block">{formatField(groupDataValue.agent_allowed_chat_groups)}</div>
                                                </div>
                                                <div class="permission-item">
                                                    <span class="permission-label">Groupes de File d'Attente Autorisés</span>
                                                    <div class="permission-value code-block">{formatField(groupDataValue.allowed_queue_groups)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Capabilities Tab -->
                        {#if activeTab === 'capabilities'}
                            <div class="tab-pane" transition:fade={{ duration: 150 }}>
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class="card-title"><i class="fas fa-headset"></i> Capacités de l'Agent</h3>
                                    </div>
                                    <div class="card-body">
                                        <div class="capabilities-grid">
                                            <div class="capability-item">
                                                <div class="capability-header">
                                                    <span class="capability-label">Transfert Consultatif</span>
                                                    <span class="capability-value">
                                                        {#if groupDataValue.agent_xfer_consultative}
                                                            {@const status = formatBoolean(groupDataValue.agent_xfer_consultative)}
                                                            <span class="toggle-switch {status.class === 'badge-success' ? 'active' : ''}">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {:else}
                                                            <span class="toggle-switch">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <p class="capability-description">
                                                    Permet à l'agent de consulter un autre agent avant de transférer un appel.
                                                </p>
                                            </div>
                                            
                                            <div class="capability-item">
                                                <div class="capability-header">
                                                    <span class="capability-label">Transfert Aveugle</span>
                                                    <span class="capability-value">
                                                        {#if groupDataValue.agent_xfer_blind_transfer}
                                                            {@const status = formatBoolean(groupDataValue.agent_xfer_blind_transfer)}
                                                            <span class="toggle-switch {status.class === 'badge-success' ? 'active' : ''}">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {:else}
                                                            <span class="toggle-switch">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <p class="capability-description">
                                                    Permet à l'agent de transférer un appel sans consultation préalable.
                                                </p>
                                            </div>
                                            
                                            <div class="capability-item">
                                                <div class="capability-header">
                                                    <span class="capability-label">Transfert VM</span>
                                                    <span class="capability-value">
                                                        {#if groupDataValue.agent_xfer_vm_transfer}
                                                            {@const status = formatBoolean(groupDataValue.agent_xfer_vm_transfer)}
                                                            <span class="toggle-switch {status.class === 'badge-success' ? 'active' : ''}">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {:else}
                                                            <span class="toggle-switch">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <p class="capability-description">
                                                    Permet à l'agent de transférer un appel vers une messagerie vocale.
                                                </p>
                                            </div>
                                            
                                            <div class="capability-item">
                                                <div class="capability-header">
                                                    <span class="capability-label">Composer avec Client</span>
                                                    <span class="capability-value">
                                                        {#if groupDataValue.agent_xfer_dial_with_customer}
                                                            {@const status = formatBoolean(groupDataValue.agent_xfer_dial_with_customer)}
                                                            <span class="toggle-switch {status.class === 'badge-success' ? 'active' : ''}">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {:else}
                                                            <span class="toggle-switch">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <p class="capability-description">
                                                    Permet à l'agent de composer un numéro avec le client en ligne.
                                                </p>
                                            </div>
                                            
                                            <div class="capability-item">
                                                <div class="capability-header">
                                                    <span class="capability-label">Mise en Attente Client</span>
                                                    <span class="capability-value">
                                                        {#if groupDataValue.agent_xfer_park_customer_dial}
                                                            {@const status = formatBoolean(groupDataValue.agent_xfer_park_customer_dial)}
                                                            <span class="toggle-switch {status.class === 'badge-success' ? 'active' : ''}">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {:else}
                                                            <span class="toggle-switch">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <p class="capability-description">
                                                    Permet à l'agent de mettre un client en attente pendant qu'il compose un numéro.
                                                </p>
                                            </div>
                                            
                                            <div class="capability-item">
                                                <div class="capability-header">
                                                    <span class="capability-label">Conférence à 3</span>
                                                    <span class="capability-value">
                                                        {#if groupDataValue.agent_xfer_park_3way}
                                                            {@const status = formatBoolean(groupDataValue.agent_xfer_park_3way)}
                                                            <span class="toggle-switch {status.class === 'badge-success' ? 'active' : ''}">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {:else}
                                                            <span class="toggle-switch">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <p class="capability-description">
                                                    Permet à l'agent de créer une conférence à trois.
                                                </p>
                                            </div>
                                            
                                            <div class="capability-item">
                                                <div class="capability-header">
                                                    <span class="capability-label">Journal d'Appels</span>
                                                    <span class="capability-value">
                                                        {#if groupDataValue.agent_call_log_view}
                                                            {@const status = formatBoolean(groupDataValue.agent_call_log_view)}
                                                            <span class="toggle-switch {status.class === 'badge-success' ? 'active' : ''}">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {:else}
                                                            <span class="toggle-switch">
                                                                <span class="toggle-slider"></span>
                                                            </span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <p class="capability-description">
                                                    Permet à l'agent de consulter son journal d'appels.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Resources Tab -->
                        {#if activeTab === 'resources'}
                            <div class="tab-pane" transition:fade={{ duration: 150 }}>
                                <div class="resources-grid">
                                    <!-- Call Times -->
                                    <div class="card">
                                        <div class="card-header">
                                            <h3 class="card-title"><i class="fas fa-clock"></i> Horaires d'Appel</h3>
                                            <div class="card-actions">
                                                <button class="btn btn-sm btn-outline">
                                                    <i class="fas fa-sync-alt"></i> Actualiser
                                                </button>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            {#if $isLoadingCallTimes}
                                                <div class="loading-container-small">
                                                    <div class="spinner-small"></div>
                                                    <p>Chargement des horaires...</p>
                                                </div>
                                            {:else if $callTimesError}
                                                <div class="alert alert-danger alert-sm">
                                                    <div class="alert-icon">
                                                        <i class="fas fa-exclamation-circle"></i>
                                                    </div>
                                                    <div class="alert-content">
                                                        {$callTimesError}
                                                    </div>
                                                </div>
                                            {:else if callTimes.length === 0}
                                                <div class="empty-state-small">
                                                    <i class="fas fa-clock"></i>
                                                    <p>Aucun horaire d'appel trouvé.</p>
                                                </div>
                                            {:else}
                                                <div class="resource-list">
                                                    {#each callTimes as callTime}
                                                        <div class="resource-item">
                                                            <label class="resource-label">
                                                                <input type="checkbox" class="resource-checkbox" value={callTime.call_time_id} />
                                                                <div class="resource-content">
                                                                    <span class="resource-id">{callTime.call_time_id}</span>
                                                                    <span class="resource-name">{callTime.call_time_name}</span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <!-- Campaigns -->
                                    <div class="card">
                                        <div class="card-header">
                                            <h3 class="card-title"><i class="fas fa-bullhorn"></i> Campagnes</h3>
                                            <div class="card-actions">
                                                <div class="search-container">
                                                    <i class="fas fa-search search-icon"></i>
                                                    <input type="text" class="search-input" placeholder="Rechercher...">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            {#if isLoadingCampaignsValue}
                                                <div class="loading-container-small">
                                                    <div class="spinner-small"></div>
                                                    <p>Chargement des campagnes...</p>
                                                </div>
                                            {:else if campaignsErrorValue}
                                                <div class="alert alert-danger alert-sm">
                                                    <div class="alert-icon">
                                                        <i class="fas fa-exclamation-circle"></i>
                                                    </div>
                                                    <div class="alert-content">
                                                        {campaignsErrorValue}
                                                    </div>
                                                </div>
                                            {:else if campaigns.length === 0}
                                                <div class="empty-state-small">
                                                    <i class="fas fa-bullhorn"></i>
                                                    <p>Aucune campagne trouvée.</p>
                                                </div>
                                            {:else}
                                                <div class="resource-list">
                                                    {#each campaigns as campaign}
                                                        <div class="resource-item">
                                                            <label class="resource-label">
                                                                <input type="checkbox" class="resource-checkbox" value={campaign.campaign_id} />
                                                                <div class="resource-content">
                                                                    <span class="resource-id">{campaign.campaign_id}</span>
                                                                    <span class="resource-name">{campaign.campaign_name}</span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <!-- Webphone Configuration -->
                                    <div class="card">
                                        <div class="card-header">
                                            <h3 class="card-title"><i class="fas fa-phone-alt"></i> Configuration Webphone</h3>
                                        </div>
                                        <div class="card-body">
                                            <div class="info-grid">
                                                <div class="info-item">
                                                    <span class="info-label">URL Webphone</span>
                                                    <span class="info-value">{formatField(groupDataValue.webphone_url_override)}</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="info-label">Clé Système</span>
                                                    <span class="info-value">{formatField(groupDataValue.webphone_systemkey_override)}</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="info-label">Pavé Numérique</span>
                                                    <span class="info-value">{formatField(groupDataValue.webphone_dialpad_override)}</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="info-label">Layout Webphone</span>
                                                    <span class="info-value">{formatField(groupDataValue.webphone_layout)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    /* Base styles */
    :global(body) {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        background-color: #f9fafb;
        color: #1f2937;
        line-height: 1.6;
        margin: 0;
        padding: 0;
    }
    
    /* Import Inter font */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Import Font Awesome */
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

    .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 1.5rem;
    }

    /* Header styles */
    .header {
        margin-bottom: 1.5rem;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .header-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
    }

    /* Button styles */
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        font-size: 0.875rem;
        white-space: nowrap;
    }

    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
    }

    .btn-primary {
        background-color: #4f46e5;
        color: white;
    }

    .btn-primary:hover {
        background-color: #4338ca;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }

    .btn-secondary:hover {
        background-color: #4b5563;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .btn-outline {
        background-color: transparent;
        border: 1px solid #d1d5db;
        color: #4b5563;
    }

    .btn-outline:hover {
        background-color: #f9fafb;
        border-color: #9ca3af;
        color: #111827;
    }

    /* Alert styles */
    .alert {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        position: relative;
    }

    .alert-sm {
        padding: 0.75rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }

    .alert-danger {
        background-color: #fee2e2;
        color: #b91c1c;
        border-left: 4px solid #ef4444;
    }

    .alert-icon {
        flex-shrink: 0;
        font-size: 1.125rem;
    }

    .alert-content {
        flex: 1;
    }

    .alert-close {
        position: absolute;
        right: 1rem;
        top: 1rem;
        background: none;
        border: none;
        color: currentColor;
        cursor: pointer;
        opacity: 0.7;
        padding: 0;
        font-size: 1rem;
    }

    .alert-close:hover {
        opacity: 1;
    }

    /* Loading styles */
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1.5rem;
        text-align: center;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(79, 70, 229, 0.2);
        border-top-color: #4f46e5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    .loading-container-small {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
    }

    .spinner-small {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(79, 70, 229, 0.2);
        border-top-color: #4f46e5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 0.75rem;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Empty state */
    .empty-state {
        text-align: center;
        padding: 3rem 1.5rem;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .empty-icon {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
    }

    .empty-state h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.5rem;
    }

    .empty-state p {
        color: #6b7280;
        margin-bottom: 1.5rem;
    }

    .empty-state-small {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .empty-state-small i {
        font-size: 2rem;
        margin-bottom: 0.75rem;
        color: #d1d5db;
    }

    /* Details container */
    .details-container {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .details-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background-color: #f9fafb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .details-title-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .details-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
    }

    .details-id {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        color: #6b7280;
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        background-color: #f3f4f6;
        border-radius: 0.25rem;
        display: inline-block;
    }

    .details-actions {
        display: flex;
        gap: 0.75rem;
    }

    /* Tabs styles */
    .tabs-container {
        display: flex;
        flex-direction: column;
    }

    .tabs-nav {
        display: flex;
        overflow-x: auto;
        border-bottom: 1px solid #e5e7eb;
        padding: 0 1rem;
        background-color: #f9fafb;
        scrollbar-width: none; /* Firefox */
    }

    .tabs-nav::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Edge */
    }

    .tab-btn {
        padding: 1rem 1.25rem;
        border: none;
        background: transparent;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .tab-btn:hover {
        color: #4f46e5;
    }

    .tab-btn.active {
        color: #4f46e5;
        border-bottom-color: #4f46e5;
    }

    .tab-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.375rem;
        border-radius: 9999px;
        background-color: #e0e7ff;
        color: #4f46e5;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .tab-content {
        padding: 1.5rem;
    }

    .tab-pane {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    /* Card styles */
    .card {
        border-radius: 0.5rem;
        overflow: hidden;
        background-color: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        border: 1px solid #e5e7eb;
    }

    .mt-4 {
        margin-top: 1rem;
    }

    .card-header {
        padding: 1rem 1.25rem;
        background-color: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .card-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #111827;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .card-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .card-body {
        padding: 1.25rem;
    }

    /* Info grid styles */
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.25rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .info-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .info-value {
        color: #111827;
        font-size: 0.875rem;
    }

    .info-value.highlight {
        font-weight: 600;
        color: #4f46e5;
    }

    .code-block {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        background-color: #f3f4f6;
        padding: 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        color: #374151;
        border: 1px solid #e5e7eb;
    }

    /* Badge styles */
    .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
    }

    .badge-success {
        background-color: #d1fae5;
        color: #065f46;
    }

    .badge-danger {
        background-color: #fee2e2;
        color: #b91c1c;
    }

    .badge-warning {
        background-color: #fef3c7;
        color: #92400e;
    }

    .badge-secondary {
        background-color: #f3f4f6;
        color: #4b5563;
    }

    /* Table styles */
    .table-responsive {
        overflow-x: auto;
        margin: 0 -1.25rem;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }

    .data-table th,
    .data-table td {
        padding: 0.75rem 1.25rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
        background-color: #f9fafb;
        font-weight: 600;
        color: #4b5563;
        white-space: nowrap;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .data-table tr:hover {
        background-color: #f9fafb;
    }

    .data-table tr:last-child td {
        border-bottom: none;
    }

    .user-id {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-weight: 600;
        color: #4f46e5;
    }

    .level-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background-color: #f3f4f6;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #4b5563;
    }

    .text-right {
        text-align: right;
    }

    .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.375rem;
        background-color: #f3f4f6;
        border: none;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-icon:hover {
        background-color: #e5e7eb;
        color: #111827;
    }

    .btn-icon-danger:hover {
        background-color: #fee2e2;
        color: #b91c1c;
    }

    /* Search styles */
    .search-container {
        position: relative;
        width: 250px;
    }

    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 0.875rem;
    }

    .search-input {
        width: 100%;
        padding: 0.5rem 0.75rem 0.5rem 2rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background-color: white;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    /* Permissions styles */
    .permissions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .permission-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .permission-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .permission-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
    }

    .permission-value {
        max-height: 100px;
        overflow-y: auto;
    }

    /* Capabilities styles */
    .capabilities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .capability-item {
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        background-color: #f9fafb;
        transition: all 0.2s;
    }

    .capability-item:hover {
        border-color: #d1d5db;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .capability-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .capability-label {
        font-weight: 600;
        color: #111827;
    }

    .capability-description {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
    }

    /* Toggle switch */
    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
        background-color: #e5e7eb;
        border-radius: 10px;
        transition: all 0.3s;
        cursor: pointer;
    }

    .toggle-switch.active {
        background-color: #4f46e5;
    }

    .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background-color: white;
        border-radius: 50%;
        transition: all 0.3s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .toggle-switch.active .toggle-slider {
        left: calc(100% - 18px);
    }

    /* Resources styles */
    .resources-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .resource-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
    }

    .resource-item {
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
    }

    .resource-item:hover {
        background-color: #f3f4f6;
    }

    .resource-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        width: 100%;
    }

    .resource-checkbox {
        width: 1.125rem;
        height: 1.125rem;
        border-radius: 0.25rem;
        border: 1.5px solid #d1d5db;
        cursor: pointer;
        accent-color: #4f46e5;
    }

    .resource-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }

    .resource-id {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-weight: 600;
        color: #4b5563;
        font-size: 0.75rem;
        background-color: #f3f4f6;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        min-width: 2.5rem;
        text-align: center;
    }

    .resource-name {
        font-weight: 500;
        color: #111827;
        font-size: 0.875rem;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .page-container {
            padding: 1rem;
        }

        .header-content {
            flex-direction: column;
            align-items: flex-start;
        }

        .details-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .info-grid, 
        .permissions-grid, 
        .capabilities-grid, 
        .resources-grid {
            grid-template-columns: 1fr;
        }

        .search-container {
            width: 100%;
        }

        .tabs-nav {
            padding: 0;
        }

        .tab-btn {
            padding: 0.75rem 1rem;
        }
    }
</style>