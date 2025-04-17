<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    import { errorStore } from '$lib/stores/errorStore';
    import CampaignHeader from '$lib/components/campaign/CampaignHeader.svelte';
    import CampaignTabs from '$lib/components/campaign/CampaignTabs.svelte';
    import GeneralInformation from '$lib/components/campaign/GeneralInformation.svelte';
    import AdvancedConfiguration from '$lib/components/campaign/AdvancedConfiguration.svelte';
    import DialStatuses from '$lib/components/campaign/DialStatuses.svelte';
    import AdditionalSettings from '$lib/components/campaign/AdditionalSettings.svelte';
    import FooterActions from '$lib/components/campaign/FooterActions.svelte';
    import { page } from '$app/stores';
    import "flowbite";
    import { goto } from '$app/navigation';

    // Define types for better TypeScript support
    interface Campaign {
        campaign_id?: string;
        campaign_name?: string;
        campaign_description?: string;
        active?: string;
        dial_statuses?: string;
        list_id?: string;
        list_order?: string;
        auto_dial_level?: string;
        next_agent_call?: string;
        local_call_time?: string;
        campaign_changedate?: string;
        [key: string]: any; // Allow for additional properties
    }

    interface User {
        user_id?: string;
        full_name?: string;
        user?: string;
        email?: string;
        active?: boolean;
        role?: string;
        campaign_id?: string;
        [key: string]: any; // Allow for additional properties
    }

    interface CampaignList {
        list_id?: string;
        list_name?: string;
        list_description?: string;
        active?: string;
        tally?: number;
        list_lastcalldate?: string;
        local_call_time?: string;
        [key: string]: any; // Allow for additional properties
    }

    // UI state
    let activeTab: string = "general";
    let company: Campaign = {};
    let companyCopy: Campaign = {}; // Deep copy to avoid reactivity issues
    let users: User[] = [];
    let displayedUsers: User[] = [];
    let loading: boolean = true;
    let error: string | null = null;
    let saving: boolean = false;
    let success: string | null = null;
    let itemsPerPage: number = 5;
    let currentPage: number = 1;
    let advancedComponentLoaded: boolean = false;
    let dialStatusesComponentLoaded: boolean = false;
    let additionalComponentLoaded: boolean = false;

    // Campaign Lists state
    let campaignLists: CampaignList[] = [];
    let loadingLists: boolean = false;
    let listsError: string | null = null;

    const tabs = [
        { id: 'general', label: 'Informations Générales' },
        { id: 'additional', label: 'Paramètres Additionnels' },
        { id: 'advanced', label: 'Configuration Avancée' }
    ];

    // Get campaign ID from URL params
    $: campaignId = $page.params.campaign_id;

    /**
     * Fetches campaign details from the API
     */
    async function fetchCampaignDetails() {
        loading = true;
        error = null;
        try {
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/getById/${campaignId}`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les détails de la campagne`);
            }
            const data = await response.json();
            if (data && data.success === false) {
                throw new Error(data.message || 'Échec de la récupération des détails de la campagne');
            }
            
            // Use data.data if available, otherwise use data directly
            company = (data.data !== undefined) ? data.data : data;
            
            // Create a deep copy to avoid shared references
            companyCopy = JSON.parse(JSON.stringify(company));
            
            if (company?.campaign_id) {
                await fetchUserDetails(company.campaign_id);
            }
        } catch (err: any) {
            const errorMessage = err?.message || 'Une erreur est survenue lors de la récupération des détails';
            error = errorMessage;
            errorStore.set(errorMessage);
            setTimeout(() => errorStore.set(null), 5000);
            console.error('Error fetching campaign details:', err);
        } finally {
            loading = false;
        }
    }

    /**
     * Fetches user details associated with a campaign
     * @param campaign_id - The ID of the campaign
     */
    async function fetchUserDetails(campaign_id: string) {
        try {
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/getCampaignAgents/${campaign_id}`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les agents de la campagne`);
            }
            const data = await response.json();
            
            // Check if data.data exists, otherwise use data directly
            users = (data.data !== undefined) ? data.data : (Array.isArray(data) ? data : []);
            
            updateDisplayedUsers();
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors de la récupération des agents';
            console.error('Error fetching user details:', err);
            errorStore.set(errorMessage);
            setTimeout(() => errorStore.set(null), 5000);
        }
    }

    async function fetchCampaignLists() {
        try {
            loadingLists = true;
            listsError = null;
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/getCampaignLists/${campaignId}`);
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les listes de la campagne`);
            }
            
            const data = await response.json();
            
            // Check if data.data exists, otherwise use data directly
            campaignLists = (data.data !== undefined) ? data.data : 
                            (Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error fetching campaign lists:', err);
            listsError = err?.message || 'Erreur lors de la récupération des listes';
            errorStore.set(listsError);
            setTimeout(() => errorStore.set(null), 5000);
        } finally {
            loadingLists = false;
        }
    }

    /**
     * Format date for display
     * @param dateString - The date string to format
     * @returns Formatted date string
     */
    function formatDate(dateString: string): string {
        if (!dateString) return 'Jamais';
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Updates the displayed users based on pagination settings
     */
    function updateDisplayedUsers(): void {
        if (!Array.isArray(users)) {
            displayedUsers = [];
            return;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        displayedUsers = users.slice(startIndex, endIndex);
    }
    
    /**
     * Handles tab change
     * @param tabId - The ID of the tab to switch to
     */
    function handleTabChange(tabId: string): void {
        if (tabId === activeTab) return;
        
        // Set the active tab
        activeTab = tabId;
        
        // Mark appropriate component as loaded and ensure data is up to date
        if (tabId === 'advanced') {
            advancedComponentLoaded = true;
            // Create a deep copy for the advanced tab to prevent direct reference issues
            companyCopy = JSON.parse(JSON.stringify(company));
        } else if (tabId === 'additional') {
            additionalComponentLoaded = true;
        }
        
        console.log('Tab changed to:', tabId);
    }

    /**
     * Handles saving campaign changes
     */
    async function handleSave(): Promise<void> {
        try {
            saving = true;
            error = null;
            success = null;
            
            // Prepare data based on active tab
            const dataToSave = activeTab === 'advanced' ? companyCopy : company;
            
            // Clean data before sending to API
            const cleanedData = JSON.parse(JSON.stringify(dataToSave));
            
            // Remove any fields that shouldn't be sent to the API
            delete cleanedData._id;
            delete cleanedData.__v;
            
            // Show saving indicator in UI
            const savingMessage = document.createElement('div');
            savingMessage.className = 'position-fixed top-0 end-0 p-3 saving-toast';
            savingMessage.innerHTML = `
                <div class="toast show bg-white shadow-sm border-0" role="alert">
                    <div class="toast-body d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        <span>Enregistrement en cours...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(savingMessage);
            
            try {
                const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/update/${campaignId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cleanedData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    throw new Error(`Erreur ${response.status}: Impossible de mettre à jour la campagne`);
                }
                
                // Update the campaign data with the response
                const updatedData = await response.json();
                company = updatedData.data || updatedData;
                
                // Create a deep copy for the advanced tab
                companyCopy = JSON.parse(JSON.stringify(company));
                
                // Show success message
                success = 'Campagne mise à jour avec succès!';
                
                // Show success toast
                const successToast = document.createElement('div');
                successToast.className = 'position-fixed top-0 end-0 p-3 success-toast';
                successToast.innerHTML = `
                    <div class="toast show bg-success text-white shadow-sm border-0" role="alert">
                        <div class="toast-body d-flex align-items-center">
                            <i class="bi bi-check-circle-fill me-2"></i>
                            <span>Campagne mise à jour avec succès!</span>
                        </div>
                    </div>
                `;
                document.body.appendChild(successToast);
                
                // Remove success toast after 3 seconds
                setTimeout(() => {
                    if (document.body.contains(successToast)) {
                        document.body.removeChild(successToast);
                    }
                }, 3000);
                
                // Update errorStore for global notification
                errorStore.set('Campagne mise à jour avec succès!');
                setTimeout(() => errorStore.set(null), 3000);
            } finally {
                // Remove saving indicator
                if (document.body.contains(savingMessage)) {
                    document.body.removeChild(savingMessage);
                }
            }
            
            // Create a deep copy for the advanced tab
            companyCopy = JSON.parse(JSON.stringify(company));
            
            // Show success message using the handleComponentSaved function
            handleComponentSaved('Campagne mise à jour avec succès!');
            
            // Update errorStore for global notification
            errorStore.set('Campagne mise à jour avec succès!');
            setTimeout(() => errorStore.set(null), 3000);
            
            // Create a visual notification
            const successMessage = document.createElement('div');
            successMessage.className = 'position-fixed top-0 start-50 translate-middle-x p-3 mt-5';
            successMessage.style.zIndex = '1050';
            successMessage.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong>Campagne mise à jour avec succès!</strong>
                </div>
            `;
            document.body.appendChild(successMessage);
            
            // Remove the message after 3 seconds
            setTimeout(() => {
                successMessage.classList.add('fade');
                setTimeout(() => document.body.removeChild(successMessage), 300);
            }, 3000);
            
        } catch (err: any) {
            console.error('Error updating campaign:', err);
            const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
            error = errorMessage;
            errorStore.set(errorMessage);
            setTimeout(() => errorStore.set(null), 5000);
            
            // Show error in the UI if possible
            const errorElement = document.getElementById('campaign-error-message');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.parentElement.classList.remove('d-none');
            }
        } finally {
            saving = false;
        }
    }

    /**
     * Handles cancel action
     */
    function handleCancel(): void {
        goto('/compagnes/show');
    }

    /**
     * Handles page change for pagination
     * @param newPage - The new page number
     */
    function handlePageChange(newPage: number): void {
        currentPage = newPage;
        updateDisplayedUsers();
    }

    /**
     * Navigates to list detail page
     * @param listId - The ID of the list to view
     */
    function navigateToListDetail(listId: string): void {
        goto(`/lists/detail?id=${listId}`);
    }
    
    /**
     * Navigates to user detail page
     * @param userId - The ID of the user to view
     */
    function navigateToUserDetail(userId: string): void {
        goto(`/users/detail?id=${userId}`);
    }

    // Handle component events
    function handleComponentSaved(message: string = 'Modifications enregistrées avec succès!'): void {
        success = message;
        
        // Show success toast
        const successToast = document.createElement('div');
        successToast.className = 'position-fixed top-0 end-0 p-3 success-toast';
        successToast.innerHTML = `
            <div class="toast show bg-success text-white shadow-sm border-0" role="alert">
                <div class="toast-body d-flex align-items-center">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <span>${message}</span>
                </div>
            </div>
        `;
        document.body.appendChild(successToast);
        
        // Remove success toast after 3 seconds
        setTimeout(() => {
            if (document.body.contains(successToast)) {
                document.body.removeChild(successToast);
            }
            success = null;
        }, 3000);
    }
    
    // Initialize component on mount
    onMount(async () => {
        await fetchCampaignDetails();
        if (campaignId) {
            fetchCampaignLists();
        }
        
        // Add event listener for beforeunload to warn about unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (saving) {
                // Cancel the event and show confirmation dialog
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
            }
        });
    });
</script>

<div class="min-vh-100 bg-gradient-light py-4">
    {#if loading}
        <div class="d-flex justify-content-center align-items-center min-vh-50">
            <div class="loading-spinner">
                <div class="spinner-grow spinner-grow-sm text-primary mx-1" role="status"></div>
                <div class="spinner-grow spinner-grow-sm text-primary mx-1" role="status" style="animation-delay: 0.1s;"></div>
                <div class="spinner-grow spinner-grow-sm text-primary mx-1" role="status" style="animation-delay: 0.2s;"></div>
                <span class="ms-2">Chargement des données...</span>
            </div>
        </div>
    {:else if error}
        <div class="container-fluid px-4">
            <div class="alert custom-alert-danger d-flex align-items-center mt-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>
                    <h6 class="alert-heading mb-1">Erreur</h6>
                    <p id="campaign-error-message" class="mb-0">{error}</p>
                </div>
            </div>
        </div>
    {:else}
        <div class="container-fluid px-4">
            <CampaignHeader title={company?.campaign_name || 'Détails de la Campagne'} />

            <CampaignTabs 
                {activeTab}
                {tabs}
                on:change={e => handleTabChange(e.detail)} 
            />
            
            {#if success}
                <div class="alert alert-success alert-dismissible fade show mt-3" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    {success}
                    <button type="button" class="btn-close" on:click={() => success = null} aria-label="Close"></button>
                </div>
            {/if}

            <div class="card shadow-sm border-0 mb-4">
                <div class="card-body p-4">
                    {#if activeTab === 'general'}
                        <GeneralInformation bind:company />
                    {:else if activeTab === 'additional' && additionalComponentLoaded}
                        <AdditionalSettings bind:company />
                    {:else if activeTab === 'advanced' && advancedComponentLoaded}
                        <AdvancedConfiguration 
                            bind:company={companyCopy} 
                            on:saved={() => handleComponentSaved('Configuration avancée mise à jour avec succès!')} 
                        />
                    {/if}
                </div>
            </div>

            <!-- Campaign Lists Table -->
            <div class="card shadow-sm border-0 mb-4">
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
                    {:else if !campaignLists || campaignLists.length === 0}
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
            <div class="card shadow-sm border-0 mb-4">
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
                                {#if !displayedUsers || displayedUsers.length === 0}
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
                                                <span class="badge bg-primary-subtle text-primary rounded-pill">
                                                    {user.role || 'Agent'}
                                                </span>
                                            </td>
                                            <td class="px-4">
                                                <span class="badge {user.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill">
                                                    {user.active ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                        </tr>
                                    {/each}
                                {/if}
                            </tbody>
                        </table>
                    </div>
                    {#if users && users.length > itemsPerPage}
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

            <div class="d-flex justify-content-end gap-3 mt-4 mb-4">
                <button 
                    type="button" 
                    class="btn btn-light px-4 py-2" 
                    on:click={handleCancel}
                    disabled={saving}
                >
                    <i class="bi bi-x-lg me-2"></i>
                    Annuler
                </button>
                <button 
                    type="button" 
                    class="btn btn-primary px-4 py-2" 
                    on:click={handleSave}
                    disabled={saving}
                >
                    {#if saving}
                        <div class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">Chargement...</span>
                        </div>
                        Enregistrement...
                    {:else}
                        <i class="bi bi-check-lg me-2"></i>
                        Enregistrer
                    {/if}
                </button>
            </div>

    <!-- Loading indicator during save -->
    {#if saving}
        <div class="d-flex justify-content-center my-3">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Enregistrement en cours...</span>
            </div>
            <span class="ms-2">Enregistrement en cours...</span>
        </div>
    {/if}

</div>
    {/if}
</div>

<style>
    :global(.bg-gradient-light) {
        background: linear-gradient(to bottom, rgba(var(--bs-light-rgb), 0.5), rgba(var(--bs-light-rgb), 0.2));
    }

    :global(.custom-btn-primary) {
        background: linear-gradient(45deg, var(--bs-primary), #6610f2);
        border: none;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.2);
        transform: translateY(0);
        transition: all 0.2s ease;
    }

    :global(.custom-btn-primary:hover) {
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
    
    :global(.success-toast) {
        z-index: 9999;
    }
    
    :global(.error-toast) {
        z-index: 9999;
    }
    
    :global(.saving-toast) {
        z-index: 9999;
    }
    
    :global(.btn) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
    }
    
    :global(.btn:hover:not(:disabled)) {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    :global(.btn:active:not(:disabled)) {
        transform: translateY(0);
    }
    
    :global(.btn:disabled) {
        cursor: not-allowed;
        opacity: 0.65;
    }

    :global(.custom-alert-danger) {
        background-color: #fff2f2;
        border: 1px solid #ffdbdb;
        border-radius: 12px;
        color: #dc3545;
    }
    
    :global(.empty-state) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        text-align: center;
        color: var(--bs-secondary);
    }
    
    :global(.loading-container) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    }
    
    :global(.clickable-cell) {
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    :global(.clickable-cell:hover) {
        color: var(--bs-primary);
    }
    
    :global(.clickable-cell:hover i) {
        opacity: 1 !important;
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