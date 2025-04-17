<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
  import ListMixManager from '../../../../lib/components/campaign/CampaignTabListMix.svelte';
  import { fade, slide } from 'svelte/transition';
  
  onMount(async () => {
    await fetchCampaigns();
  });
  
  // État local pour les campagnes
  let campaigns = [];
  let isLoading = true;
  let error = null;
  let selectedCampaignId = null;
  let searchQuery = '';
  
  // Fonction pour récupérer les campagnes depuis l'API
  async function fetchCampaigns() {
    isLoading = true;
    error = null;
    
    try {
      // Utiliser fetchWithAuth pour l'authentification
      const response = await fetchWithAuth('http://localhost:8000/api/admin/compagnies/recuperer');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Récupérer directement le tableau de campagnes
        const result = await response.json();
        
        // Vérifier si le résultat est un tableau
        if (Array.isArray(result)) {
          campaigns = result;
        } else if (result && result.data && Array.isArray(result.data)) {
          // Fallback au cas où la structure serait différente
          campaigns = result.data;
        } else {
          throw new Error('Format de données inattendu');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des campagnes:', err);
        error = `Erreur: ${err.message}`;
      } finally {
        isLoading = false;
      }
    }
    
    // Fonction pour sélectionner une campagne
    function selectCampaign(campaignId) {
      selectedCampaignId = campaignId;
    }
    
    // Fonction pour revenir à la liste des campagnes
    function backToCampaigns() {
      selectedCampaignId = null;
    }
    
    // Obtenir le nom de la campagne sélectionnée
    function getSelectedCampaignName() {
      if (!selectedCampaignId) return '';
      const campaign = campaigns.find(c => c.campaign_id === selectedCampaignId);
      return campaign ? campaign.campaign_name : '';
    }
    
    // Filtrer les campagnes en fonction de la recherche
    $: filteredCampaigns = campaigns.filter(campaign => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        campaign.campaign_id.toLowerCase().includes(query) ||
        campaign.campaign_name.toLowerCase().includes(query) ||
        (campaign.campaign_description && campaign.campaign_description.toLowerCase().includes(query))
      );
    });
</script>

<div class="app-container">
  {#if selectedCampaignId}
    <!-- Vue des list mix pour la campagne sélectionnée -->
    <div class="list-mix-container" in:fade={{ duration: 300 }}>
      <header class="section-header">
        <button class="back-button" on:click={backToCampaigns}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour
        </button>
        <h2>List Mix pour: <span class="highlight">{getSelectedCampaignName()}</span></h2>
      </header>
      
      <ListMixManager campaignId={selectedCampaignId} />
    </div>
  {:else}
    <!-- Vue de la liste des campagnes -->
    <div class="campaigns-container" in:fade={{ duration: 300 }}>
      <header class="section-header">
        <h1>Gestion des Campagnes</h1>
        <button class="refresh-button" on:click={fetchCampaigns}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Actualiser
        </button>
      </header>
      
      {#if error}
        <div class="error-message" in:slide={{ duration: 300 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      {/if}
      
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            bind:value={searchQuery} 
            placeholder="Rechercher une campagne..." 
            class="search-input"
          />
          {#if searchQuery}
            <button class="clear-search" on:click={() => searchQuery = ''}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          {/if}
        </div>
        <div class="campaign-count">
          {filteredCampaigns.length} campagne{filteredCampaigns.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {#if isLoading}
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Chargement des campagnes...</p>
        </div>
      {:else if filteredCampaigns.length === 0}
        <div class="empty-state">
          {#if searchQuery}

            <p>Aucune campagne ne correspond à votre recherche</p>
            <button class="reset-search" on:click={() => searchQuery = ''}>Réinitialiser la recherche</button>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <p>Aucune campagne trouvée</p>
          {/if}
        </div>
      {:else}
        <div class="table-container">
          <table class="campaigns-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Description</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredCampaigns as campaign (campaign.campaign_id)}
                <tr 
                  class="campaign-row" 
                  on:click={() => selectCampaign(campaign.campaign_id)}
                  on:keydown={(e) => e.key === 'Enter' && selectCampaign(campaign.campaign_id)}
                  tabindex="0"
                >
                  <td class="campaign-id">{campaign.campaign_id}</td>
                  <td class="campaign-name">{campaign.campaign_name}</td>
                  <td class="campaign-description">{campaign.campaign_description || '-'}</td>
                  <td class="campaign-status">
                    <span class="status-badge" class:active={campaign.active === 'Y'}>
                      {campaign.active === 'Y' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .app-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #1a202c;
    margin: 0;
  }
  
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #1a202c;
    margin: 0;
  }
  
  .highlight {
    color: #3182ce;
  }
  
  .refresh-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #ebf8ff;
    color: #2b6cb0;
    border: 1px solid #bee3f8;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .refresh-button:hover {
    background-color: #bee3f8;
  }
  
  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #f7fafc;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: 16px;
  }
  
  .back-button:hover {
    background-color: #edf2f7;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 12px;
    background-color: #fff5f5;
    color: #c53030;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    border-left: 4px solid #fc8181;
  }
  
  .search-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .search-input-wrapper {
    position: relative;
    flex: 1;
    max-width: 400px;
    display: flex;
    align-items: center;
  }
  
  .search-input-wrapper svg {
    position: absolute;
    left: 12px;
    color: #718096;
  }
  
  .search-input {
    width: 100%;
    padding: 10px 40px 10px 40px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
  
  .clear-search {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 0;
  }
  
  .campaign-count {
    font-size: 14px;
    color: #718096;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: #4a5568;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(66, 153, 225, 0.2);
    border-top: 3px solid #4299e1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: #718096;
    background-color: #f7fafc;
    border-radius: 8px;
    text-align: center;
  }
  
  .empty-state svg {
    margin-bottom: 16px;
    color: #a0aec0;
  }
  
  .empty-state p {
    margin-bottom: 16px;
    font-size: 16px;
  }
  
  .reset-search {
    background-color: #edf2f7;
    color: #4a5568;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .reset-search:hover {
    background-color: #e2e8f0;
  }
  
  .table-container {
    overflow-x: auto;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .campaigns-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
  }
  
  .campaigns-table th {
    background-color: #f7fafc;
    color: #4a5568;
    font-weight: 600;
    text-align: left;
    padding: 14px 20px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 14px;
  }
  
  .campaigns-table td {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    transition: all 0.2s ease;
  }
  
  .campaign-row {
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .campaign-row:hover {
    background-color: #f0f9ff;
  }
  
  .campaign-row:hover::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: #4299e1;
  }
  
  .campaign-row:focus {
    outline: none;
    background-color: #ebf8ff;
  }
  
  .campaign-id {
    font-family: monospace;
    color: #4a5568;
    font-weight: 500;
  }
  
  .campaign-name {
    font-weight: 500;
    color: #2d3748;
  }
  
  .campaign-description {
    color: #718096;
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    background-color: #f7fafc;
    color: #718096;
  }
  
  .status-badge.active {
    background-color: #e6fffa;
    color: #2c7a7b;
  }
  
  /* Animation pour les transitions */
  .list-mix-container, .campaigns-container {
    width: 100%;
  }
</style>