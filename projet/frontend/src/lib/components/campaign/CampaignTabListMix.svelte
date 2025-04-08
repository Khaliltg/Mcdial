<script>
    import { onMount } from 'svelte';
  
    // Props
    export let campaignId = null;
    
    // État local
    let listMixes = [];
    let isLoading = true;
    let error = null;
    let availableLists = [];
    let newListMix = {
      vcl_name: '',
      mix_method: 'EVEN_MIX',
      UI_status: 'ACTIVE'
    };
    let isAddingNew = false;
    let isReordering = false;
    let draggedItem = null;
    let selectedLists = [];
  
    // Méthodes de mixage disponibles
    const mixMethods = [
      { value: 'EVEN_MIX', label: 'Mélange équilibré' },
      { value: 'IN_ORDER', label: 'En ordre' },
      { value: 'RANDOM', label: 'Aléatoire' }
    ];
  
    // Options de statut
    const statusOptions = [
      { value: 'ACTIVE', label: 'Actif' },
      { value: 'INACTIVE', label: 'Inactif' }
    ];
  
    // API Base URL
    const API_BASE_URL = 'http://localhost:8000/api/admin/compagnies';
  
    // Récupérer les list mix au chargement du composant
    onMount(async () => {
      if (campaignId) {
        await fetchListMixes();
        await fetchAvailableLists();
      }
    });
  
    // Récupérer les list mix depuis l'API
    async function fetchListMixes() {
  isLoading = true;
  error = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/listMix/${campaignId}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      listMixes = result.data || [];
      
      // Convertir list_mix_container en tableau pour chaque list mix
      listMixes = listMixes.map(mix => ({
        ...mix,
        listContainer: parseListContainer(mix.list_mix_container)
      }));
    } else {
      error = result.message || 'Erreur lors de la récupération des list mix';
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des list mix:', err);
    error = 'Erreur de connexion au serveur';
    
    // Pour le développement, on peut simuler des données
    if (process.env.NODE_ENV !== 'production') {
      listMixes = [];
    }
  } finally {
    isLoading = false;
  }
}
  
    // Parser le contenu du list_mix_container
    function parseListContainer(container) {
      if (!container) return [];
      
      try {
        // Si c'est un JSON, on le parse
        return JSON.parse(container);
      } catch (e) {
        // Sinon, on suppose que c'est une liste d'IDs séparés par des virgules
        return container.split(',').map(id => id.trim()).filter(id => id);
      }
    }
  
    // Formater le list_mix_container pour l'envoi
    function formatListContainer(lists) {
      return JSON.stringify(lists);
    }
  
    // Récupérer les listes disponibles pour cette campagne
    async function fetchAvailableLists() {
      try {
        const response = await fetch(`${API_BASE_URL}/getCampaignLists/${campaignId}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          availableLists = result.data || [];
        } else {
          console.error('Erreur lors de la récupération des listes:', result.message);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des listes disponibles:', err);
        
        // Pour le développement, on peut simuler des données
        if (process.env.NODE_ENV !== 'production') {
          availableLists = [
            { list_id: '1001', list_name: 'Liste clients actifs' },
            { list_id: '1002', list_name: 'Liste prospects' },
            { list_id: '1003', list_name: 'Liste clients inactifs' }
          ];
        }
      }
    }
  
    // Ajouter un nouveau list mix
    async function addListMix() {
      if (!newListMix.vcl_name) {
        error = 'Veuillez saisir un nom pour le list mix';
        return;
      }
  
      if (selectedLists.length === 0) {
        error = 'Veuillez sélectionner au moins une liste';
        return;
      }
  
      isLoading = true;
      error = null;
      
      try {
        // Adapter les données selon la structure attendue par le backend
        const listMixData = {
          vcl_name: newListMix.vcl_name,
          list_id: selectedLists[0], // Utiliser le premier ID de liste comme list_id principal
          list_mix_container: formatListContainer(selectedLists),
          mix_method: newListMix.mix_method,
          status: newListMix.UI_status === 'ACTIVE' ? 'Y' : 'N' // Convertir UI_status en status (Y/N)
        };
        
        const response = await fetch(`${API_BASE_URL}/listMix/${campaignId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(listMixData)
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Rafraîchir les données
          await fetchListMixes();
          
          // Réinitialiser le formulaire
          newListMix = {
            vcl_name: '',
            mix_method: 'EVEN_MIX',
            UI_status: 'ACTIVE'
          };
          selectedLists = [];
          isAddingNew = false;
        } else {
          error = result.message || 'Erreur lors de l\'ajout du list mix';
        }
      } catch (err) {
        console.error('Erreur lors de l\'ajout du list mix:', err);
        error = 'Erreur de connexion au serveur: ' + err.message;
      } finally {
        isLoading = false;
      }
    }
  
    // Supprimer un list mix
    async function deleteListMix(vclId) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce list mix ?')) {
        return;
      }
      
      isLoading = true;
      error = null;
      
      try {
        const response = await fetch(`${API_BASE_URL}/listMix/${campaignId}/${vclId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Rafraîchir les données
          await fetchListMixes();
        } else {
          error = result.message || 'Erreur lors de la suppression du list mix';
        }
      } catch (err) {
        console.error('Erreur lors de la suppression du list mix:', err);
        error = 'Erreur de connexion au serveur';
      } finally {
        isLoading = false;
      }
    }
  
    // Changer le statut d'un list mix
    function toggleStatus(vclId, currentStatus) {
  // Toggle between ACTIVE and INACTIVE
  const status = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  
  // Send the status field
  updateListMix(vclId, { status });
}

  
    // Mettre à jour un list mix
    async function updateListMix(vclId, data) {
      isLoading = true;
      error = null;
      
      try {
        console.log('Sending update data:', data);
        
        const response = await fetch(`${API_BASE_URL}/listMix/${campaignId}/${vclId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Rafraîchir les données
          await fetchListMixes();
        } else {
          error = result.message || 'Erreur lors de la mise à jour du list mix';
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour du list mix:', err);
        error = 'Erreur de connexion au serveur: ' + err.message;
      } finally {
        isLoading = false;
      }
    }
  
    // Changer la méthode de mixage
    function changeMixMethod(vclId, newMethod) {
      updateListMix(vclId, { mix_method: newMethod });
    }
  
    // Gérer la sélection/désélection d'une liste
    function toggleListSelection(listId) {
      if (selectedLists.includes(listId)) {
        selectedLists = selectedLists.filter(id => id !== listId);
      } else {
        selectedLists = [...selectedLists, listId];
      }
    }
  
    // Obtenir le nom de la liste à partir de son ID
    function getListName(listId) {
      const list = availableLists.find(list => list.list_id.toString() === listId.toString());
      return list ? list.list_name : `Liste #${listId}`;
    }
  
    // Fonctions pour le drag and drop (réorganisation)
    function startReordering() {
      isReordering = true;
    }
  
    function cancelReordering() {
      isReordering = false;
    }
  
    function handleDragStart(e, item) {
      draggedItem = item;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.vcl_id);
      e.target.classList.add('dragging');
    }
  
    function handleDragEnd(e) {
      e.target.classList.remove('dragging');
    }
  
    function handleDragOver(e, targetItem) {
      e.preventDefault();
      if (draggedItem && draggedItem.vcl_id !== targetItem.vcl_id) {
        e.dataTransfer.dropEffect = 'move';
      }
    }
  
    function handleDrop(e, targetItem) {
      e.preventDefault();
      if (draggedItem && draggedItem.vcl_id !== targetItem.vcl_id) {
        // Réorganiser localement
        const draggedIndex = listMixes.findIndex(item => item.vcl_id === draggedItem.vcl_id);
        const targetIndex = listMixes.findIndex(item => item.vcl_id === targetItem.vcl_id);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newListMixes = [...listMixes];
          const [removed] = newListMixes.splice(draggedIndex, 1);
          newListMixes.splice(targetIndex, 0, removed);
          
          listMixes = newListMixes;
        }
      }
    }
  
    // Sauvegarder l'ordre après réorganisation
    async function saveReordering() {
      isLoading = true;
      error = null;
      
      try {
        const listMixOrder = listMixes.map(mix => mix.vcl_id);
        
        const response = await fetch(`${API_BASE_URL}/listMix/${campaignId}/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            list_mix_order: listMixOrder 
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Rafraîchir les données
          await fetchListMixes();
          isReordering = false;
        } else {
          error = result.message || 'Erreur lors de la réorganisation des list mix';
        }
      } catch (err) {
        console.error('Erreur lors de la réorganisation des list mix:', err);
        error = 'Erreur de connexion au serveur';
      } finally {
        isLoading = false;
      }
    }
  </script>
  
  <div class="list-mix-container">
    <div class="header-actions">
      {#if !isAddingNew}
        <div class="actions">
          <button class="btn-primary" on:click={() => isAddingNew = true}>
            Ajouter un List Mix
          </button>
          
          {#if listMixes.length > 1 && !isReordering}
            <button class="btn-secondary" on:click={startReordering}>
              Réorganiser
            </button>
          {/if}
          
          {#if isReordering}
            <div class="reorder-actions">
              <button class="btn-success" on:click={saveReordering}>
                Enregistrer l'ordre
              </button>
              <button class="btn-danger" on:click={cancelReordering}>
                Annuler
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
    
    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}
    
    {#if isAddingNew}
      <div class="add-form">
        <h3>Ajouter un nouveau List Mix</h3>
        
        <div class="form-group">
          <label for="vcl-name">Nom du List Mix</label>
          <input 
            type="text" 
            id="vcl-name" 
            bind:value={newListMix.vcl_name} 
            placeholder="Entrez un nom pour ce list mix"
          />
        </div>
        
        <div class="form-group">
          <label for="mix-method">Méthode de mixage</label>
          <select id="mix-method" bind:value={newListMix.mix_method}>
            {#each mixMethods as method}
              <option value={method.value}>{method.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="status">Statut</label>
          <select id="status" bind:value={newListMix.UI_status}>
            {#each statusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label>Sélectionner les listes</label>
          <div class="lists-selection">
            {#if availableLists.length === 0}
              <p class="no-lists">Aucune liste disponible pour cette campagne</p>
            {:else}
              {#each availableLists as list (list.list_id)}
                <div class="list-checkbox">
                  <label>
                    <input 
                      type="checkbox" 
                      value={list.list_id} 
                      checked={selectedLists.includes(list.list_id)} 
                      on:change={() => toggleListSelection(list.list_id)}
                    />
                    {list.list_name || `Liste #${list.list_id}`}
                  </label>
                </div>
              {/each}
            {/if}
          </div>
        </div>
        
        <div class="form-actions">
          <button 
            class="btn-success" 
            on:click={addListMix} 
            disabled={isLoading || !newListMix.vcl_name || selectedLists.length === 0}
          >
            {isLoading ? 'Ajout en cours...' : 'Ajouter'}
          </button>
          <button class="btn-secondary" on:click={() => isAddingNew = false}>
            Annuler
          </button>
        </div>
      </div>
    {/if}
    
    {#if isLoading && !listMixes.length}
      <div class="loading">
        Chargement des list mix...
      </div>
    {:else if !listMixes.length}
      <div class="empty-state">
        <p>Aucun list mix trouvé pour cette campagne.</p>
        {#if !isAddingNew}
          <button class="btn-primary" on:click={() => isAddingNew = true}>
            Ajouter un premier List Mix
          </button>
        {/if}
      </div>
    {:else}
      <div class="list-mix-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Méthode</th>
              <th>Listes</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each listMixes as mix (mix.vcl_id)}
              <tr 
                class:draggable={isReordering}
                draggable={isReordering}
                on:dragstart={e => isReordering && handleDragStart(e, mix)}
                on:dragend={e => isReordering && handleDragEnd(e)}
                on:dragover={e => isReordering && handleDragOver(e, mix)}
                on:drop={e => isReordering && handleDrop(e, mix)}
              >
                <td>{mix.vcl_id}</td>
                <td>{mix.vcl_name}</td>
                <td>
                  {#if isReordering}
                    {mixMethods.find(m => m.value === mix.mix_method)?.label || mix.mix_method}
                  {:else}
                    <select 
                      value={mix.mix_method} 
                      on:change={e => changeMixMethod(mix.vcl_id, e.target.value)}
                    >
                      {#each mixMethods as method}
                        <option value={method.value}>{method.label}</option>
                      {/each}
                    </select>
                  {/if}
                </td>
                <td>
                  <div class="list-container">
                    {#if mix.listContainer && mix.listContainer.length > 0}
                      <ul class="list-items">
                        {#each mix.listContainer as listId, index}
                          {#if index < 3}
                            <li>{getListName(listId)}</li>
                          {:else if index === 3}
                            <li>+{mix.listContainer.length - 3} autres</li>
                          {/if}
                        {/each}
                      </ul>
                    {:else}
                      <span class="no-lists">Aucune liste</span>
                    {/if}
                  </div>
                </td>
                <td>
                  {#if isReordering}
                    <span class="status-badge" class:active={mix.status === 'ACTIVE'}>
                      {mix.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                    </span>
                  {:else}
                    <label class="toggle">
                      <input 
                        type="checkbox" 
                        checked={mix.status === 'ACTIVE'} 
                        on:change={() => toggleStatus(mix.vcl_id, mix.status)}
                      >
                      <span class="slider"></span>
                      <span class="status-text">
                        {mix.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                      </span>
                    </label>
                  {/if}
                </td>
                <td>
                  {#if !isReordering}
                    <button 
                      class="btn-danger btn-sm" 
                      on:click={() => deleteListMix(mix.vcl_id)}
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
  
  <style>
    .list-mix-container {
      width: 100%;
      margin: 0 auto;
    }
    
    .header-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    .reorder-actions {
      display: flex;
      gap: 10px;
    }
    
    .error-message {
      background-color: #fff5f5;
      color: #c53030;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      border-left: 4px solid #fc8181;
    }
    
    .loading, .empty-state {
      text-align: center;
      padding: 40px 0;
      color: #718096;
      background-color: #f7fafc;
      border-radius: 8px;
    }
    
    .empty-state p {
      margin-bottom: 20px;
    }
    
    .add-form {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .add-form h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #2d3748;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #4a5568;
    }
    
    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .lists-selection {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background-color: white;
    }
    
    .list-checkbox {
      margin-bottom: 8px;
    }
    
    .list-checkbox:last-child {
      margin-bottom: 0;
    }
    
    .list-checkbox label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: normal;
    }
    
    .no-lists {
      color: #718096;
      font-style: italic;
    }
    
    select, input[type="text"] {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    
    select:focus, input[type="text"]:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    }
    
    .list-mix-table {
      width: 100%;
      overflow-x: auto;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background-color: #f7fafc;
      color: #4a5568;
      font-weight: 600;
      font-size: 14px;
    }
    
    tr:hover {
      background-color: #f0f9ff;
    }
    
    .draggable {
      cursor: move;
    }
    
    .draggable:hover {
      background-color: #ebf8ff;
    }
    
    .dragging {
      opacity: 0.5;
      background-color: #ebf8ff;
    }
    
    .list-container {
      max-width: 250px;
    }
    
    .list-items {
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 13px;
    }
    
    .list-items li {
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background-color: #f7fafc;
      color: #718096;
    }
    
    .status-badge.active {
      background-color: #e6fffa;
      color: #2c7a7b;
    }
    
    /* Buttons */
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background-color: #4299e1;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: #3182ce;
    }
    
    .btn-secondary {
      background-color: #edf2f7;
      color: #4a5568;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: #e2e8f0;
    }
    
    .btn-success {
      background-color: #48bb78;
      color: white;
    }
    
    .btn-success:hover:not(:disabled) {
      background-color: #38a169;
    }
    
    .btn-danger {
      background-color: #f56565;
      color: white;
    }
    
    .btn-danger:hover:not(:disabled) {
      background-color: #e53e3e;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    /* Toggle switch */
    .toggle {
      position: relative;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
    }
    
    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
      background-color: #cbd5e0;
      border-radius: 20px;
      transition: .4s;
      margin-right: 8px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      border-radius: 50%;
      transition: .4s;
    }
    
    input:checked + .slider {
      background-color: #48bb78;
    }
    
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    
    .status-text {
      font-size: 14px;
    }
  </style>