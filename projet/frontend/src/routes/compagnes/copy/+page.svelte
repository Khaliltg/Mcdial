<script>
    import { onMount } from 'svelte';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

    let campaigns = [];
    let selectedCampaignId = '';
    let newCampaignId = '';
    let newCampaignName = '';
    let isLoading = true;
    let isCopying = false;
    let errorMessage = '';
    let successMessage = '';
    let showSuccessDetails = false;
    let copyResult = null;

    // Fetch all campaigns on component mount
    onMount(async () => {
        try {
            const response = await fetchWithAuth('http://localhost:8000/api/admin/compagnies/recuperer');
            if (response.ok) {
                campaigns = await response.json();
                campaigns.sort((a, b) => a.campaign_name.localeCompare(b.campaign_name));
            } else {
                errorMessage = 'Échec de la récupération des campagnes';
            }
        } catch (error) {
            errorMessage = 'Erreur lors de la récupération des campagnes';
            console.error(error);
        } finally {
            isLoading = false;
        }
    });

    // Handle campaign selection
    function handleCampaignSelect(event) {
        selectedCampaignId = event.target.value;
        if (selectedCampaignId) {
            const selectedCampaign = campaigns.find(c => c.campaign_id === selectedCampaignId);
            if (selectedCampaign) {
                // Generate suggested values for new campaign
                newCampaignId = `COPY_${selectedCampaign.campaign_id}`;
                newCampaignName = `Copy of ${selectedCampaign.campaign_name}`;
            }
        } else {
            newCampaignId = '';
            newCampaignName = '';
        }
    }

    // Copy campaign function
    async function copyCampaign() {
        // Validate inputs
        if (!selectedCampaignId) {
            errorMessage = 'Veuillez sélectionner une campagne à copier';
            return;
        }

        if (!newCampaignId) {
            errorMessage = 'Veuillez entrer un ID pour la nouvelle campagne';
            return;
        }

        if (!newCampaignName) {
            errorMessage = 'Veuillez entrer un nom pour la nouvelle campagne';
            return;
        }

        errorMessage = '';
        successMessage = '';
        isCopying = true;

        try {
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/copier/${selectedCampaignId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    new_campaign_id: newCampaignId,
                    new_campaign_name: newCampaignName
                })
            });

            const result = await response.json();

            if (response.ok) {
                successMessage = result.message || 'Campagne copiée avec succès';
                copyResult = result.data;
                showSuccessDetails = true;
                
                // Refresh the campaign list
                const campaignsResponse = await fetchWithAuth('http://localhost:8000/api/admin/compagnies/recuperer');
                if (campaignsResponse.ok) {
                    campaigns = await campaignsResponse.json();
                    campaigns.sort((a, b) => a.campaign_name.localeCompare(b.campaign_name));
                }
            } else {
                errorMessage = result.message || 'Échec de la copie de la campagne';
            }
        } catch (error) {
            errorMessage = 'Erreur lors de la copie de la campagne';
            console.error(error);
        } finally {
            isCopying = false;
        }
    }

    // Navigate to the new campaign
    function goToNewCampaign() {
        if (copyResult && copyResult.new_id) {
            window.location.href = `/compagnes/detail/${copyResult.new_id}`;
        }
    }
</script>

<div class="copy-campaign-container">
    <div class="header">
        <h1>Copier une Campagne</h1>
        <p class="description">Créez une copie d'une campagne existante avec un nouvel ID et un nouveau nom</p>
    </div>

    {#if errorMessage}
        <div class="alert alert-error">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>{errorMessage}</span>
            <button class="close-button" on:click={() => errorMessage = ''}>×</button>
        </div>
    {/if}

    {#if successMessage}
        <div class="alert alert-success">
            <i class="bi bi-check-circle-fill"></i>
            <span>{successMessage}</span>
            <button class="close-button" on:click={() => successMessage = ''}>×</button>
        </div>
    {/if}

    <div class="card">
        <div class="card-body">
            {#if isLoading}
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Chargement des campagnes...</p>
                </div>
            {:else}
                <div class="form-group">
                    <label for="campaignSelect">Sélectionnez une campagne à copier</label>
                    <select 
                        id="campaignSelect" 
                        class="form-control" 
                        bind:value={selectedCampaignId} 
                        on:change={handleCampaignSelect}
                        disabled={isCopying}
                    >
                        <option value="">-- Sélectionnez une campagne --</option>
                        {#each campaigns as campaign}
                            <option value={campaign.campaign_id}>
                                {campaign.campaign_name} ({campaign.campaign_id})
                            </option>
                        {/each}
                    </select>
                </div>

                {#if selectedCampaignId}
                    <div class="selected-campaign">
                        <h3>Détails de la campagne sélectionnée</h3>
                        <div class="campaign-details">
                            {#if campaigns.find(c => c.campaign_id === selectedCampaignId)}
                                {@const campaign = campaigns.find(c => c.campaign_id === selectedCampaignId)}
                                <div class="detail-item">
                                    <span class="detail-label">ID de la campagne:</span>
                                    <span class="detail-value">{campaign.campaign_id}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Nom de la campagne:</span>
                                    <span class="detail-value">{campaign.campaign_name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Statut:</span>
                                    <span class="detail-value status-badge {campaign.active === 'Y' ? 'active' : 'inactive'}">
                                        {campaign.active === 'Y' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="new-campaign-form">
                        <h3>Informations de la nouvelle campagne</h3>
                        <div class="form-group">
                            <label for="newCampaignId">Nouvel ID de campagne</label>
                            <input 
                                type="text" 
                                id="newCampaignId" 
                                class="form-control" 
                                bind:value={newCampaignId} 
                                disabled={isCopying}
                                placeholder="Entrez un ID unique"
                            />
                        </div>
                        <div class="form-group">
                            <label for="newCampaignName">Nouveau nom de campagne</label>
                            <input 
                                type="text" 
                                id="newCampaignName" 
                                class="form-control" 
                                bind:value={newCampaignName} 
                                disabled={isCopying}
                                placeholder="Entrez un nom unique"
                            />
                        </div>
                    </div>

                    <div class="copy-info">
                        <div class="info-icon">
                            <i class="bi bi-info-circle-fill"></i>
                        </div>
                        <div class="info-text">
                            <p>La nouvelle campagne sera créée avec tous les paramètres de la campagne source, 
                            mais avec l'ID et le nom que vous avez spécifiés.</p>
                        </div>
                    </div>
                {/if}

                <div class="actions">
                    <a href="/compagnes/show" class="btn btn-secondary" disabled={isCopying}>
                        Annuler
                    </a>
                    <button 
                        class="btn btn-primary" 
                        on:click={copyCampaign} 
                        disabled={!selectedCampaignId || !newCampaignId || !newCampaignName || isCopying}
                    >
                        {#if isCopying}
                            <div class="spinner-small"></div>
                            Copie en cours...
                        {:else}
                            <i class="bi bi-files"></i>
                            Copier la campagne
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
    </div>

    {#if showSuccessDetails && copyResult}
        <div class="success-details card">
            <div class="card-header">
                <h3>Campagne copiée avec succès</h3>
            </div>
            <div class="card-body">
                <div class="detail-item">
                    <span class="detail-label">Campagne d'origine:</span>
                    <span class="detail-value">{copyResult.original_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Nouvelle campagne:</span>
                    <span class="detail-value">{copyResult.new_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Nouveau nom:</span>
                    <span class="detail-value">{copyResult.new_name}</span>
                </div>
                <div class="actions mt-4">
                    <button class="btn btn-success" on:click={goToNewCampaign}>
                        <i class="bi bi-arrow-right-circle"></i>
                        Aller à la nouvelle campagne
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .copy-campaign-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .header {
        margin-bottom: 30px;
        text-align: center;
    }

    .header h1 {
        font-size: 28px;
        color: #333;
        margin-bottom: 10px;
    }

    .description {
        color: #666;
        font-size: 16px;
    }

    .card {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 30px;
    }

    .card-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        background-color: #f8f9fa;
    }

    .card-header h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
    }

    .card-body {
        padding: 20px;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
    }

    .form-control {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
    }

    .form-control:focus {
        outline: none;
        border-color: #80bdff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .selected-campaign {
        margin-top: 30px;
        margin-bottom: 20px;
    }

    .selected-campaign h3, .new-campaign-form h3 {
        font-size: 18px;
        margin-bottom: 15px;
        color: #333;
    }

    .campaign-details {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 20px;
    }

    .new-campaign-form {
        margin-bottom: 20px;
    }

    .detail-item {
        margin-bottom: 10px;
        display: flex;
    }

    .detail-label {
        font-weight: 500;
        color: #555;
        width: 180px;
        flex-shrink: 0;
    }

    .detail-value {
        color: #333;
    }

    .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
    }

    .status-badge.active {
        background-color: #d4edda;
        color: #155724;
    }

    .status-badge.inactive {
        background-color: #f8d7da;
        color: #721c24;
    }

    .copy-info {
        margin: 20px 0;
        display: flex;
        background-color: #e7f3ff;
        border-radius: 6px;
        padding: 15px;
    }

    .info-icon {
        margin-right: 15px;
        color: #0d6efd;
        font-size: 24px;
    }

    .info-text p {
        margin: 0 0 10px 0;
        color: #333;
    }

    .info-text p:last-child {
        margin-bottom: 0;
    }

    .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
    }

    .btn {
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        text-decoration: none;
    }

    .btn i {
        margin-right: 8px;
    }

    .btn-primary {
        background-color: #0d6efd;
        color: white;
    }

    .btn-primary:hover {
        background-color: #0b5ed7;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
        background-color: #5c636a;
    }

    .btn-success {
        background-color: #198754;
        color: white;
    }

    .btn-success:hover {
        background-color: #157347;
    }

    .btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }

    .alert {
        padding: 15px;
        margin-bottom: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
    }

    .alert i {
        margin-right: 10px;
        font-size: 18px;
    }

    .alert-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .alert-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .close-button {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
    }

    .loading-state {
        text-align: center;
        padding: 30px;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid #0d6efd;
        margin: 0 auto 15px;
        animation: spin 1s linear infinite;
    }

    .spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 2px solid white;
        margin-right: 8px;
        animation: spin 1s linear infinite;
    }

    .success-details {
        border-top: 4px solid #198754;
    }

    .mt-4 {
        margin-top: 20px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        .detail-item {
            flex-direction: column;
        }

        .detail-label {
            width: 100%;
            margin-bottom: 4px;
        }

        .actions {
            flex-direction: column;
            gap: 10px;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>