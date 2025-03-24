<script>
    import { onMount } from 'svelte';
    import axios from 'axios';
    import CampaignHeader from '$lib/components/campaign/CampaignHeader.svelte';
    import CampaignTabs from '$lib/components/campaign/CampaignTabs.svelte';
    import GeneralInformation from '$lib/components/campaign/GeneralInformation.svelte';
    import AdvancedConfiguration from '$lib/components/campaign/AdvancedConfiguration.svelte';
    import FooterActions from '$lib/components/campaign/FooterActions.svelte';
    import { page } from '$app/stores';
    import "flowbite";
    import { goto } from '$app/navigation';

    let activeTab = "general";
    let company = {};
    let users = [];
    let displayedUsers = [];
    let loading = true;
    let error = null;
    let saving = false;
    let itemsPerPage = 5;
    let currentPage = 1;

    // Campaign Lists state
    let campaignLists = [];
    let loadingLists = false;
    let listsError = null;

    const tabs = [
        { id: 'general', label: 'Informations Générales' },
        { id: 'advanced', label: 'Configuration Avancée' }
    ];

    // Get campaign ID from URL params
    $: campaignId = $page.params.campaign_id;

    async function fetchCampaignDetails() {
        loading = true;
        error = null;
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getById/${campaignId}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: Unable to fetch campaign details`);
            }
            const data = await response.json();
            company = data || {};
            if (company?.campaign_id) {
                await fetchUserDetails(company.campaign_id);
            }
        } catch (err) {
            error = err.message;
            console.error('Error fetching campaign details:', err);
        } finally {
            loading = false;
        }
    }

    async function fetchUserDetails(campaign_id) {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getCampaignAgents/${campaign_id}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: Unable to fetch campaign agents`);
            }
            users = await response.json();
            console.log(users);
            
            updateDisplayedUsers();
        } catch (err) {
            console.error('Error fetching user details:', err);
        }
    }

    async function fetchCampaignLists() {
        try {
            loadingLists = true;
            listsError = null;
            const response = await axios.get(`http://localhost:8000/api/admin/compagnies/getCampaignLists/${campaignId}`);
            campaignLists = response.data;
        } catch (err) {
            console.error('Error fetching campaign lists:', err);
            listsError = 'Failed to load campaign lists';
        } finally {
            loadingLists = false;
        }
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    function updateDisplayedUsers() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        displayedUsers = users.slice(startIndex, endIndex);
    }

    function handleTabChange(tabId) {
        activeTab = tabId;
    }

    async function handleSave() {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/update/${campaignId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(company)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: Failed to update campaign`);
            }

            const result = await response.json();
            console.log('Campaign updated successfully:', result);
        } catch (err) {
            console.error('Error updating campaign:', err);
            error = err.message;
        }
    }

    function handleCancel() {
        window.history.back();
    }

    function handlePageChange(newPage) {
        currentPage = newPage;
        updateDisplayedUsers();
    }

    function navigateToListDetail(listId) {
        goto(`/liste/list-details/${listId}`);
    }

    function navigateToUserDetail(userId) {
        goto(`/users/detail?id=${userId}`); // Navigate to the detail page
    }

    onMount(async () => {
        await fetchCampaignDetails();
        if (campaignId) {
            fetchCampaignLists();
        }
    });
</script>

<div class="min-vh-100 bg-gradient-light py-4">
    {#if loading}
        <div class="d-flex justify-content-center align-items-center min-vh-50">
            <div class="loading-spinner">
                <div class="spinner-grow text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <div class="spinner-grow text-primary ms-2" role="status" style="animation-delay: 0.2s">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <div class="spinner-grow text-primary ms-2" role="status" style="animation-delay: 0.4s">
                    <span class="visually-hidden">Chargement...</span>
                </div>
            </div>
        </div>
    {:else if error}
        <div class="container-fluid px-4">
            <div class="alert custom-alert-danger" role="alert">
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-2"></i>
                    <div>
                        <h6 class="alert-heading mb-1">Erreur</h6>
                        <p class="mb-0">{error}</p>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <div class="container-fluid px-4">
            <CampaignHeader title={company?.campaign_name || 'Détails de la Campagne'} />

            <CampaignTabs 
                {activeTab}
                {tabs}
                onTabChange={(tabId) => activeTab = tabId}
            />

            <div class="card custom-card hover-shadow mb-4">
                <div class="card-body">
                    {#if activeTab === 'general'}
                        <GeneralInformation bind:company={company} />
                    {:else if activeTab === 'advanced'}
                        <AdvancedConfiguration bind:company={company} />
                    {/if}
                </div>
            </div>

            <!-- Campaign Lists Table -->
            <div class="card custom-card hover-shadow mb-4">
                <div class="card-header border-bottom-0 bg-white py-3">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-list-ul fs-4 text-primary me-2"></i>
                            <h5 class="mb-0">Listes de la Campagne</h5>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    {#if loadingLists}
                        <div class="loading-container">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Chargement...</span>
                            </div>
                            <p class="text-muted mt-2">Chargement des listes...</p>
                        </div>
                    {:else if listsError}
                        <div class="alert custom-alert-danger mx-3 my-3" role="alert">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                <div>{listsError}</div>
                            </div>
                        </div>
                    {:else if campaignLists.length === 0}
                        <div class="empty-state">
                            <i class="bi bi-inbox fs-1 text-muted mb-2"></i>
                            <p class="mb-3">Aucune liste disponible pour cette campagne</p>
                        </div>
                    {:else}
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="bg-light">
                                    <tr>
                                        <th class="ps-4">ID Liste</th>
                                        <th>Nom</th>
                                        <th>Description</th>
                                        <th>Nombre</th>
                                        <th>Statut</th>
                                        <th>Dernier Appel</th>
                                        <th>Heure Locale</th>
                                        <th class="pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each campaignLists as list}
                                        <tr>
                                            <td class="ps-4 fw-medium">{list.list_id}</td>
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                                            <td>
                                                <div 
                                                    class="clickable-cell fw-medium d-flex align-items-center"
                                                    on:click={() => navigateToListDetail(list.list_id)}
                                                    role="button"
                                                    tabindex="0"
                                                >
                                                    <span>{list.list_name}</span>
                                                    <i class="bi bi-box-arrow-up-right ms-2 text-muted opacity-0"></i>
                                                </div>
                                            </td>
                                            <td>{list.list_description || '-'}</td>
                                            <td>
                                                <span class="badge bg-primary-subtle text-primary rounded-pill">
                                                    {list.tally}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge {list.active === 'Y' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} rounded-pill">
                                                    {list.active === 'Y' ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td>{formatDate(list.list_lastcalldate)}</td>
                                            <td>{list.local_call_time}</td>
                                            <td class="pe-4">
                                                <div class="d-flex gap-2">
                                                    <button class="btn btn-sm btn-light-hover" title="Modifier">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-light-hover text-danger" title="Supprimer">
                                                        <i class="bi bi-trash"></i>
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

            <!-- Campaign Users Table -->
            <div class="card custom-card hover-shadow mb-4">
                <div class="card-header bg-white py-3 border-bottom">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 text-primary">Utilisateurs de la Campagne</h5>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="border-0 px-4">Nom</th>
                                    <th class="border-0 px-4">Campagne</th>
                                    <th class="border-0 px-4">Rôle</th>
                                    <th class="border-0 px-4">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#if displayedUsers.length === 0}
                                    <tr>
                                        
                                        <td colspan="5" class="text-center py-4 text-muted">
                                            
                                            Aucun utilisateur assigné à cette campagne
                                        </td>
                                    </tr>
                                {:else}
                                    {#each displayedUsers as user}
                                        <tr>
                                            <td class="px-4">
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <!-- svelte-ignore a11y-no-static-element-interactions -->
                                                <div 
                                                    class="clickable-cell fw-medium d-flex align-items-center"
                                                    on:click={() => navigateToUserDetail(user.user_id)}
                                                    role="button"
                                                    tabindex="0"
                                                >
                                                    <span>{user.user || 'Inconnu'}</span>
                                                    <i class="bi bi-box-arrow-up-right ms-2 text-muted opacity-0"></i>
                                                </div>
                                            </td>
                                            <td class="px-4">{user.campaign_id || 'N/A'}</td>
                                            <td class="px-4">
                                                <span class="badge bg-primary-subtle text-primary rounded-pill px-3">
                                                    {user.role || 'Agent'}
                                                </span>
                                            </td>
                                            <td class="px-4">
                                                <span class="badge {user.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-3">
                                                    {user.active ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                        </tr>
                                    {/each}
                                {/if}
                            </tbody>
                        </table>
                    </div>
                    {#if users.length > itemsPerPage}
                        <div class="d-flex justify-content-center py-3 border-top">
                            <nav aria-label="Pagination des utilisateurs">
                                <ul class="pagination pagination-sm mb-0">
                                    <li class="page-item {currentPage === 1 ? 'disabled' : ''}">
                                        <button class="page-link" on:click={() => handlePageChange(currentPage - 1)}>
                                            Précédent
                                        </button>
                                    </li>
                                    {#each Array(Math.ceil(users.length / itemsPerPage)) as _, i}
                                        <li class="page-item {currentPage === i + 1 ? 'active' : ''}">
                                            <button class="page-link" on:click={() => handlePageChange(i + 1)}>
                                                {i + 1}
                                            </button>
                                        </li>
                                    {/each}
                                    <li class="page-item {currentPage === Math.ceil(users.length / itemsPerPage) ? 'disabled' : ''}">
                                        <button class="page-link" on:click={() => handlePageChange(currentPage + 1)}>
                                            Suivant
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    {/if}
                </div>
            </div>

            <FooterActions 
                onCancel={handleCancel}
                onSave={handleSave}
                disabled={loading}
            />
        </div>
    {/if}
</div>

<style>
    :global(.bg-gradient-light) {
        background: linear-gradient(to right, #f8f9fa, #ffffff);
    }

    :global(.custom-card) {
        border: none;
        border-radius: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        transition: all 0.3s ease;
    }

    :global(.custom-card:hover) {
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
    }

    :global(.custom-btn) {
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    :global(.custom-btn:hover) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.2);
    }

    :global(.custom-alert-danger) {
        background-color: #fff2f2;
        border: 1px solid #ffdbdb;
        border-radius: 12px;
        color: #dc3545;
    }

    :global(.avatar) {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(45deg, var(--bs-primary), #6610f2);
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.2);
    }

    :global(.badge) {
        font-weight: 500;
        padding: 0.5em 1em;
        border-radius: 8px;
        letter-spacing: 0.3px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    :global(.table) {
        --bs-table-hover-bg: rgba(var(--bs-primary-rgb), 0.02);
        --bs-table-hover-color: var(--bs-gray-900);
        margin-bottom: 0;
    }

    :global(.table th) {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.5px;
        color: var(--bs-gray-600);
        padding: 1rem;
    }

    :global(.table td) {
        padding: 1rem;
        vertical-align: middle;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    :global(.loading-container) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
    }

    :global(.empty-state) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        text-align: center;
        color: var(--bs-gray-600);
    }

    :global(.page-link) {
        border-radius: 8px;
        margin: 0 2px;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    :global(.page-link:hover) {
        background-color: var(--bs-primary);
        color: white;
        border-color: var(--bs-primary);
        transform: translateY(-1px);
    }

    :global(.page-item.active .page-link) {
        background: linear-gradient(45deg, var(--bs-primary), #6610f2);
        border: none;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.2);
    }

    .min-vh-50 {
        min-height: 50vh;
    }

    .loading-spinner {
        display: flex;
        align-items: center;
    }

    :global(.spinner-grow) {
        width: 1rem;
        height: 1rem;
    }

    :global(.clickable-cell) {
        cursor: pointer;
        padding: 0.5rem 0.75rem;
        margin: -0.5rem 0;
        border-radius: 8px;
        color: var(--bs-primary);
        position: relative;
        transition: all 0.2s ease;
    }

    :global(.clickable-cell:hover) {
        background-color: rgba(var(--bs-primary-rgb), 0.08);
    }

    :global(.clickable-cell:hover i) {
        opacity: 1 !important;
        transform: translateX(0);
    }

    :global(.clickable-cell i) {
        font-size: 0.875rem;
        transform: translateX(-4px);
        transition: all 0.2s ease;
    }

    :global(.clickable-cell:active) {
        transform: scale(0.98);
        background-color: rgba(var(--bs-primary-rgb), 0.12);
    }

    :global(.clickable-cell:focus) {
        outline: none;
        box-shadow: 0 0 0 2px rgba(var(--bs-primary-rgb), 0.25);
    }

    :global(.clickable-cell::after) {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 8px;
        background: radial-gradient(circle at center, rgba(var(--bs-primary-rgb), 0.12) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }

    :global(.clickable-cell:active::after) {
        opacity: 1;
        transition: opacity 0s;
    }
</style>
