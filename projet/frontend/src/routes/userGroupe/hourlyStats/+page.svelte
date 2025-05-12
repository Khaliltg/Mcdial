<script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    
    // Variables d'état
    let groups = [];
    let statuses = [];
    let selectedGroup = '';
    let status = 'XFER'; // Valeur par défaut
    let dateWithHour = '';
    let loading = false;
    let error = '';
    let success = false;
    let statsData = {
        users: [],
        totals: {
            hourCalls: 0,
            totalCalls: 0,
            dayCalls: 0
        }
    };
    
    // Formater la date actuelle au format YYYY-MM-DD HH
    function getCurrentDateWithHour() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}`;
    }
    
    // Initialiser les valeurs par défaut et précharger les données courantes
    onMount(() => {
        dateWithHour = getCurrentDateWithHour();
        // Récupérer les groupes et les statuts en parallèle
        Promise.all([
            fetchUserGroups(),
            fetchStatusList()
        ]).then(() => {
            // Précharger les statistiques pour le statut XFER par défaut
            if (groups.length > 0) {
                // Précharger en arrière-plan sans bloquer l'interface
                setTimeout(() => {
                    selectedGroup = groups[0].user_group;
                    preloadCommonStats();
                }, 500);
            }
        });
    });
    
    // Précharger les statistiques les plus courantes
    async function preloadCommonStats() {
        // Ne pas afficher l'indicateur de chargement pour le préchargement
        const commonStatuses = ['XFER', 'SALE', 'DNC'];
        
        // Précharger les statistiques pour l'heure en cours
        for (const preloadStatus of commonStatuses) {
            if (selectedGroup) {
                try {
                    const response = await fetchWithAuth(`http://localhost:8000/api/admin/usergroup/getHourlyStats`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            group: selectedGroup,
                            status: preloadStatus,
                            dateWithHour: dateWithHour
                        }),
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // Stocker dans le cache
                        const cacheKey = `${selectedGroup}_${preloadStatus}_${dateWithHour}`;
                        statsCache.set(cacheKey, data);
                        console.log(`Préchargement réussi pour ${cacheKey}`);
                    }
                } catch (err) {
                    // Ignorer les erreurs de préchargement
                    console.log(`Erreur de préchargement pour ${preloadStatus}:`, err);
                }
            }
        }
    }
    
    // Récupérer la liste des groupes d'utilisateurs
    async function fetchUserGroups() {
        try {
            loading = true;
            const response = await fetchWithAuth('http://localhost:8000/api/admin/usergroup/getUsersGroups');
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            groups = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('Erreur lors de la récupération des groupes:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }
    
    // Récupérer la liste des statuts depuis la base de données
    async function fetchStatusList() {
        try {
            const response = await fetchWithAuth('http://localhost:8000/api/admin/usergroup/getStatusList');
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && Array.isArray(data.statuses)) {
                statuses = data.statuses;
                // Si un statut par défaut est déjà sélectionné, vérifier qu'il existe dans la liste
                if (status && !statuses.some(s => s.status === status)) {
                    // Si le statut par défaut n'existe pas, prendre le premier de la liste
                    status = statuses.length > 0 ? statuses[0].status : 'XFER';
                }
            } else {
                statuses = [];
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des statuts:', err);
            // Ne pas afficher d'erreur à l'utilisateur, utiliser simplement le statut par défaut
            statuses = [];
        }
    }
    
    // Cache pour les résultats des requêtes
    const statsCache = new Map();
    
    // Récupérer les statistiques horaires
    async function fetchHourlyStats() {
        if (!selectedGroup) {
            error = 'Veuillez sélectionner un groupe';
            return;
        }
        
        if (!status) {
            error = 'Veuillez entrer un statut';
            return;
        }
        
        if (!dateWithHour) {
            error = 'Veuillez entrer une date avec heure';
            return;
        }
        
        error = '';
        
        // Afficher immédiatement un état de chargement et le tableau vide
        // pour donner l'impression que l'interface est réactive
        loading = true;
        success = true;
        statsData = {
            users: [],
            totals: {
                hourCalls: 0,
                totalCalls: 0,
                dayCalls: 0
            }
        };
        
        // Générer une clé de cache unique pour cette requête
        const cacheKey = `${selectedGroup}_${status}_${dateWithHour}`;
        
        // Vérifier si les résultats sont déjà en cache côté client
        if (statsCache.has(cacheKey)) {
            console.log('Résultats trouvés en cache local');
            statsData = statsCache.get(cacheKey);
            loading = false;
            return;
        }
        
        try {
            // Vérifier si le token est disponible
            const token = localStorage.getItem('token');
            
            // Utiliser AbortController pour pouvoir annuler la requête si nécessaire
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout après 30 secondes
            
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/usergroup/getHourlyStats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    group: selectedGroup,
                    status: status,
                    dateWithHour: dateWithHour
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors de la récupération des statistiques: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            // Stocker les résultats dans le cache local
            statsCache.set(cacheKey, data);
            
            // Limiter la taille du cache à 10 entrées
            if (statsCache.size > 10) {
                const firstKey = statsCache.keys().next().value;
                statsCache.delete(firstKey);
            }
            
            statsData = data;
            success = true;
        } catch (err) {
            console.error('Erreur complète:', err);
            error = err.message;
            success = false;
        } finally {
            loading = false;
        }
    }
    
    // Formater la date pour l'affichage
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit'
        });
    }
    
    // Gérer le changement de groupe
    function handleGroupChange(event) {
        selectedGroup = event.target.value;
    }
    
    // Gérer la soumission du formulaire
    function handleSubmit(event) {
        event.preventDefault();
        fetchHourlyStats();
    }
</script>

<svelte:head>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</svelte:head>

<style>
    /* Styles spécifiques à l'application qui ne sont pas couverts par Bootstrap */
    .user-name {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .user-name i {
        color: #6c757d;
    }
    
    .numeric {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
</style>

<div class="container">
    {#if loading}
        <div class="loading-overlay" transition:fade={{ duration: 200 }}>
            <div class="spinner"></div>
            <p>Chargement en cours...</p>
            <p class="loading-info">Le traitement des statistiques peut prendre jusqu'à 30 secondes.</p>
        </div>
    {/if}
    
    <div class="card shadow-sm mb-4">
        <div class="card-body">
            <div class="row align-items-center mb-3">
                <div class="col-md-8">
                    <div class="d-flex align-items-center">
                        <div class="bg-primary p-3 rounded-circle text-white me-3">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div>
                            <h1 class="h3 mb-0">Statistiques Horaires</h1>
                            <p class="text-muted mb-0">Analyse des appels par groupe d'utilisateurs</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-outline-secondary" on:click={() => window.print()}>
                            <i class="fas fa-print me-1"></i>
                            <span>Imprimer</span>
                        </button>
                        <button class="btn btn-outline-primary" on:click={() => {
                            selectedGroup = groups.length > 0 ? groups[0].user_group : '';
                            status = 'XFER';
                            dateWithHour = getCurrentDateWithHour();
                            fetchHourlyStats();
                        }}>
                            <i class="fas fa-sync-alt me-1"></i>
                            <span>Réinitialiser</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body d-flex align-items-center">
                            <i class="fas fa-users text-primary me-3 fs-4"></i>
                            <div>
                                <h5 class="card-title mb-0">{groups.length}</h5>
                                <p class="card-text text-muted">Groupes</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body d-flex align-items-center">
                            <i class="fas fa-tags text-primary me-3 fs-4"></i>
                            <div>
                                <h5 class="card-title mb-0">{statuses.length}</h5>
                                <p class="card-text text-muted">Statuts</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body d-flex align-items-center">
                            <i class="fas fa-clock text-primary me-3 fs-4"></i>
                            <div>
                                <h5 class="card-title mb-0">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</h5>
                                <p class="card-text text-muted">Dernier rafraîchissement</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="card shadow-sm mb-4">
        <div class="card-header">
            <h2 class="card-title">
                <div class="title-icon">
                    <i class="fas fa-filter"></i>
                </div>
                Filtrer les statistiques
            </h2>
            <div class="card-actions">
                <button class="btn btn-sm btn-outline" on:click={() => {
                    selectedGroup = groups.length > 0 ? groups[0].user_group : '';
                    status = 'XFER';
                    dateWithHour = getCurrentDateWithHour();
                }}>
                    <i class="fas fa-redo-alt mr-2"></i>
                    Réinitialiser
                </button>
            </div>
        </div>
        <div class="card-body">
            {#if error}
                <div class="alert alert-error" transition:fade={{ duration: 200 }}>
                    <i class="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                </div>
            {/if}
            
            <form on:submit={handleSubmit}>
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label for="group" class="form-label d-flex align-items-center">
                                <i class="fas fa-users me-2 text-primary"></i>
                                <span>Groupe d'utilisateurs</span>
                            </label>
                            <select 
                                id="group" 
                                class="form-select"
                                bind:value={selectedGroup}
                                on:change={handleGroupChange}
                                required
                            >
                                <option value="">Sélectionner un groupe</option>
                                {#each groups as group}
                                    <option value={group.user_group}>{group.user_group}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label for="status" class="form-label d-flex align-items-center">
                                <i class="fas fa-tag me-2 text-primary"></i>
                                <span>Statut</span>
                            </label>
                            <select 
                                id="status" 
                                class="form-select" 
                                bind:value={status}
                                required
                            >
                                <option value="">Sélectionner un statut</option>
                                {#each statuses as statusItem}
                                    <option value={statusItem.status}>{statusItem.status} - {statusItem.status_name}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label for="dateWithHour" class="form-label d-flex align-items-center">
                                <i class="fas fa-calendar-alt me-2 text-primary"></i>
                                <span>Date et heure</span>
                            </label>
                            <input 
                                type="text" 
                                id="dateWithHour" 
                                class="form-control" 
                                bind:value={dateWithHour} 
                                placeholder="YYYY-MM-DD HH"
                            />
                        </div>
                    </div>
                </div>
                
                <div class="d-flex flex-column mt-3">
                    <button type="submit" class="btn btn-primary" disabled={loading}>
                        {#if loading}
                            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            <span>Chargement...</span>
                        {:else}
                            <i class="fas fa-search me-2"></i>
                            <span>Rechercher les statistiques</span>
                        {/if}
                    </button>
                    <small class="text-muted mt-2" class:d-none={loading}>
                        <i class="fas fa-info-circle me-1"></i>
                        Les résultats s'afficheront ci-dessous
                    </small>
                </div>
            </form>
        </div>
    </div>
    
    {#if success && statsData.users.length > 0}
        <div class="card shadow-sm mb-4" transition:fly={{ y: 20, duration: 200 }}>
            <div class="card-header bg-light">
                <h5 class="mb-0">
                    <i class="fas fa-chart-line me-2 text-primary"></i>
                    Statistiques pour le groupe: <span class="fw-bold">{selectedGroup}</span> | Statut: <span class="fw-bold">{status}</span> | <span class="text-muted">{dateWithHour}</span>
                </h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Nom</th>
                                <th class="text-center">Appels (Heure)</th>
                                <th class="text-center">Appels (Total)</th>
                                <th class="text-center">Appels (Jour)</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each statsData.users as user, index (user.user_id)}
                                <tr transition:fly={{ y: 20, duration: 200, delay: index * 50 }}>
                                    <td>{user.user_id}</td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-user-circle text-secondary me-2"></i>
                                            <span>{user.full_name}</span>
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-primary rounded-pill">{user.hour_calls}</span>
                                    </td>
                                    <td class="text-center">{user.total_calls}</td>
                                    <td class="text-center">{user.day_calls}</td>
                                    <td class="text-center">
                                        <a href="/users/detail/{user.user_id}" class="btn btn-sm btn-outline-secondary">
                                            <i class="fas fa-eye me-1"></i>
                                            <span>Détails</span>
                                        </a>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                        <tfoot>
                            <tr class="table-primary fw-bold" transition:fly={{ y: 20, duration: 200, delay: statsData.users.length * 50 }}>
                                <td colspan="2">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-calculator me-2"></i>
                                        <span>TOTAL</span>
                                    </div>
                                </td>
                                <td class="text-center">{statsData.totals.hourCalls}</td>
                                <td class="text-center">{statsData.totals.totalCalls}</td>
                                <td class="text-center">{statsData.totals.dayCalls}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    {:else if success}
        <div class="card shadow-sm mb-4" transition:fly={{ y: 20, duration: 300 }}>
            <div class="card-body">
                <div class="alert alert-info d-flex align-items-center">
                    <i class="fas fa-info-circle me-2"></i>
                    <span>Aucune donnée trouvée pour les critères sélectionnés.</span>
                </div>
            </div>
        </div>
    {/if}
</div>
