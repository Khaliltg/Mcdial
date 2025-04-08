<script>
    import { onMount } from 'svelte';
    
    // État local pour les campagnes
    let campaigns = [];
    let isLoading = true;
    let error = null;
    let selectedCampaignId = null;
    
    // Composant pour afficher les list_mix (importé dynamiquement)
    let ListMixComponent;
    
    onMount(async () => {
      await fetchCampaigns();
      
      // Importer dynamiquement le composant ListMix
      import('../show_list_mix/+page.svelte')
        .then(module => {
          ListMixComponent = module.default;
        })
        .catch(err => {
          console.error("Erreur lors du chargement du composant ListMix:", err);
          error = "Impossible de charger le composant ListMix";
        });
    });
    
    // Récupérer toutes les campagnes
    async function fetchCampaigns() {
      isLoading = true;
      error = null;
      
      try {
        const response = await fetch('http://localhost:8000/api/admin/compagnies/recuperer');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          campaigns = result.data || [];
        } else {
          error = result.message || 'Erreur lors de la récupération des campagnes';
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des campagnes:', err);
        error = 'Erreur de connexion au serveur';
      } finally {
        isLoading = false;
      }
    }
    
    // Sélectionner une campagne
    function selectCampaign(campaignId) {
      selectedCampaignId = campaignId;
    }
    
    // Obtenir le nom de la campagne sélectionnée
    function getSelectedCampaignName() {
      if (!selectedCampaignId) return '';
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      return campaign ? campaign.name : '';
    }
  </script>
  
  <div class="campaign-manager">
    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}
    
    <!-- Section des campagnes -->
    <section class="campaigns-section">
      <h1>Campagnes</h1>
      
      {#if isLoading && campaigns.length === 0}
        <div class="loading">
          Chargement des campagnes...
        </div>
      {:else if campaigns.length === 0}
        <div class="empty-state">
          <p>Aucune campagne trouvée.</p>
        </div>
      {:else}
        <div class="campaigns-list">
          {#each campaigns as campaign (campaign.id)}
            <div 
              class="campaign-item" 
              class:active={selectedCampaignId === campaign.id}
              on:click={() => selectCampaign(campaign.id)}
            >
              <div class="campaign-name">{campaign.name}</div>
              <div class="campaign-status">{campaign.status}</div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
    
    <!-- Section des list mix -->
    <section class="list-mix-section">
      {#if selectedCampaignId}
        <div class="list-mix-header">
          <h2>List Mix pour: {getSelectedCampaignName()}</h2>
        </div>
        
        {#if ListMixComponent}
          <svelte:component this={ListMixComponent} campaignId={selectedCampaignId} />
        {:else}
          <div class="loading">
            Chargement du composant List Mix...
          </div>
        {/if}
      {:else}
        <div class="empty-selection">
          <p>Veuillez sélectionner une campagne pour voir ses list mix</p>
        </div>
      {/if}
    </section>
  </div>
  
  <style>
    .campaign-manager {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }
    
    @media (min-width: 992px) {
      .campaign-manager {
        grid-template-columns: 300px 1fr;
      }
    }
    
    .error-message {
      background-color: #ffebee;
      color: #c62828;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      grid-column: 1 / -1;
    }
    
    .loading, .empty-state, .empty-selection {
      text-align: center;
      padding: 40px 0;
      color: #666;
    }
    
    h1, h2 {
      margin-top: 0;
      margin-bottom: 20px;
    }
    
    h1 {
      font-size: 24px;
    }
    
    h2 {
      font-size: 20px;
    }
    
    /* Section des campagnes */
    .campaigns-section {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      height: fit-content;
    }
    
    .campaigns-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .campaign-item {
      background-color: white;
      border-radius: 4px;
      padding: 12px 15px;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    
    .campaign-item:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .campaign-item.active {
      border-left-color: #1976d2;
      background-color: #e3f2fd;
    }
    
    .campaign-name {
      font-weight: 500;
      margin-bottom: 5px;
    }
    
    .campaign-status {
      font-size: 12px;
      color: #666;
    }
    
    /* Section des list mix */
    .list-mix-section {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .list-mix-header {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .empty-selection {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
    }
    
    /* Responsive */
    @media (max-width: 991px) {
      .campaigns-section {
        margin-bottom: 20px;
      }
    }
  </style>