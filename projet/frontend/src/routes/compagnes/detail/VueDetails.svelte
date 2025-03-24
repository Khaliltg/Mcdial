<script>
    import { onMount } from 'svelte';
    import CampaignHeader from '$lib/components/campaign/CampaignHeader.svelte';
    import CampaignTabs from '$lib/components/campaign/CampaignTabs.svelte';
    import GeneralInformation from '$lib/components/campaign/GeneralInformation.svelte';
    import AdditionalSettings from '$lib/components/campaign/AdditionalSettings.svelte';
    import DialStatuses from '$lib/components/campaign/DialStatuses.svelte';
    import AdvancedConfiguration from '$lib/components/campaign/AdvancedConfiguration.svelte';
    import FooterActions from '$lib/components/campaign/FooterActions.svelte';
    import { onMount } from 'svelte';
    import "flowbite";

    export let company;
    let activeTab = "general";
    let id;
    let company = null;
    let user = [];
    let displayedUsers = [];
    let showAllUsers = false;
    let loading = true;
    let error = null;
    let itemsPerPage = 5;
    let currentPage = 1;
    const tabs = [
        { id: 'general', label: 'General Information', component: GeneralInformation },
        { id: 'additional', label: 'Additional Settings', component: AdditionalSettings },
        { id: 'dial', label: 'Dial Statuses', component: DialStatuses },
        { id: 'advanced', label: 'Advanced Configuration', component: AdvancedConfiguration }
    ];

    function handleTabChange(tabId) {
        activeTab = tabId;
    }

    function handleSave() {
        console.log('Saving changes...', company);
    }

    function handleCancel() {
        console.log('Cancelling changes...');
        window.history.back();
    }



    async function fetchUserDetails(campaign_id) {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getCampaignAgents/${campaign_id}`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les utilisateurs.`);
            }
            user = await response.json();
            updateDisplayedUsers();
        } catch (err) {
            error = err.message;
        }
    }

    function updateDisplayedUsers() {
        if (user && user.length > 0) {
            displayedUsers = showAllUsers ? user : user.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        } else {
            displayedUsers = [];
        }
    }

    function toggleShowAllUsers() {
        showAllUsers = !showAllUsers;
        updateDisplayedUsers();
    }

    function changePage(page) {
        currentPage = page;
        updateDisplayedUsers();
    }

    onMount(async () => {
        id = window.location.pathname.split("/").pop();
        loading = true;
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getById/${id}`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les détails de la compagnie.`);
            }
            company = await response.json();
            if (company && company.campaign_id) {
                await fetchUserDetails(company.campaign_id);
            }
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen bg-gray-100 py-8">
    <CampaignHeader />

    <CampaignTabs {activeTab} on:change={handleTabChange} />

    <div class="p-4 bg-white shadow rounded-lg">
        {#each tabs as { id, component } }
            {#if activeTab === id}
                <svelte:component this={component} />
            {/if}
        {/each}
    </div>

    <FooterActions on:save={handleSave} on:cancel={handleCancel} />
</div>

<style>
    /* Custom styles */
    input:read-only, 
    input[readonly] {
        cursor: not-allowed;
    }
    
    /* Smooth transitions */
    button, input, select {
        transition: all 0.2s ease;
    }
    
    /* Custom focus styles */
    input:focus, 
    select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
</style>
z