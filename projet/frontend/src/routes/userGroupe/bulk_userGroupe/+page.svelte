<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    
    let oldGroup = '';
    let newGroup = '';
    let groups = [];
    let message = '';
    let stage = 'one_user_group_change'; // Valeur par défaut
    let loading = false;
    let error = null;
    let showConfirmation = false;
    let affectedUsersCount = 0;
    let apiBaseUrl = 'http://localhost:8000/api/admin/usergroup';

    // Récupérer les groupes d'utilisateurs
    async function fetchUserGroups() {
      try {
        loading = true;
        const response = await fetchWithAuth(`${apiBaseUrl}/getUsersGroups`);
        
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

    // Obtenir le nombre d'utilisateurs affectés via l'API
    async function getAffectedUsersCount() {
      try {
        // Si aucun groupe n'est sélectionné pour le mode "groupe spécifique", retourner 0
        if (stage === 'one_user_group_change' && !oldGroup) {
          return 0;
        }
        
        const response = await fetchWithAuth(`${apiBaseUrl}/getAffectedUsersCount?oldGroup=${oldGroup}&stage=${stage}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du comptage des utilisateurs');
        }
        
        const data = await response.json();
        return data.success ? data.count : 0;
      } catch (err) {
        console.error('Erreur lors du comptage des utilisateurs:', err);
        return 0;
      }
    }

    // Afficher la confirmation avant de soumettre
    async function confirmChange(event) {
      event.preventDefault();
      
      if (!oldGroup && stage === 'one_user_group_change') {
        message = 'Veuillez sélectionner le groupe source.';
        return;
      }
      
      if (!newGroup) {
        message = 'Veuillez sélectionner le groupe de destination.';
        return;
      }
      
      loading = true;
      affectedUsersCount = await getAffectedUsersCount();
      loading = false;
      
      if (affectedUsersCount === 0) {
        message = 'Aucun utilisateur ne sera affecté par cette modification.';
        return;
      }
      
      showConfirmation = true;
    }

    // Traiter le formulaire pour changer les groupes d'utilisateurs
    async function submitForm(event) {
      event.preventDefault();
      loading = true;
      
      try {
        const response = await fetchWithAuth(`${apiBaseUrl}/bulkChangeUserGroup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldGroup, newGroup, stage }),
        });

        if (response.ok) {
          const data = await response.json();
          message = data.message || `${data.affectedRows} utilisateurs ont été transférés avec succès vers le groupe "${groups.find(g => g.user_group === newGroup)?.group_name || newGroup}"!`;
          // Redirect to afficher page after 2 seconds
          setTimeout(() => {
            goto('/userGroupe/afficher');
          }, 2000);
        } else {
          const errorData = await response.json();
          message = errorData.message || 'Erreur lors du changement de groupe.';
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        message = 'Erreur lors du changement de groupe. Veuillez réessayer.';
      } finally {
        loading = false;
      }
    }

    function handleStageChange(e) {
      stage = e.target.value;
    }
    
    function closeMessage() {
      message = '';
    }
    
    function cancelConfirmation() {
      showConfirmation = false;
    }

    // Initialiser le composant
    onMount(() => {
      fetchUserGroups();
    });
</script>

<style>
    :global(body) {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
    }

    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      position: relative;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0) 100%);
      z-index: 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
    }

    .header-title i {
      color: #2563eb;
      font-size: 1.5rem;
    }
    
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .refresh-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      color: #4b5563;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .refresh-button:hover {
      background: #f9fafb;
      color: #1f2937;
    }
    
    .refresh-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .main-content {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
      position: relative;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 500;
      color: #4b5563;
      font-size: 0.95rem;
    }

    .form-group select,
    .form-group button {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.75rem;
      background-color: white;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      position: relative;
      z-index: 1;
    }

    .form-group select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 20px;
    }

    .form-group select:focus,
    .form-group button:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .form-group button {
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      color: white;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .form-group button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .form-group button:disabled {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }

    .message {
      padding: 1rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .message-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .message-close {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.7;
      font-size: 0.875rem;
      padding: 0.25rem;
    }
    
    .message-close:hover {
      opacity: 1;
    }

    .message.success {
      background: #dcfce7;
      color: #166534;
      border-left: 4px solid #166534;
    }

    .message.error {
      background: #fee2e2;
      color: #991b1b;
      border-left: 4px solid #991b1b;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .confirmation-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }
    
    .confirmation-content {
      background: white;
      border-radius: 1rem;
      width: 90%;
      max-width: 500px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .confirmation-header {
      background: #f9fafb;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .confirmation-header i {
      color: #f59e0b;
      font-size: 1.5rem;
    }
    
    .confirmation-header h3 {
      margin: 0;
      color: #1f2937;
      font-weight: 600;
      font-size: 1.25rem;
    }
    
    .confirmation-body {
      padding: 1.5rem;
    }
    
    .confirmation-details {
      background: #f9fafb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin: 1rem 0;
    }
    
    .detail-item {
      display: flex;
      margin-bottom: 0.5rem;
    }
    
    .detail-item:last-child {
      margin-bottom: 0;
    }
    
    .detail-label {
      font-weight: 600;
      width: 4rem;
      color: #4b5563;
    }
    
    .detail-value {
      color: #1f2937;
    }
    
    .confirmation-warning {
      color: #ef4444;
      font-weight: 500;
      margin-bottom: 0;
    }
    
    .confirmation-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    
    .cancel-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      color: #4b5563;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .cancel-button:hover {
      background: #f9fafb;
      color: #1f2937;
    }
    
    .confirm-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #2563eb;
      border: none;
      border-radius: 0.5rem;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .confirm-button:hover {
      background: #1d4ed8;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 1rem;
      }

      .header {
        padding: 1.5rem;
      }

      .header-title {
        font-size: 1.5rem;
      }
      
      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .header-actions {
        width: 100%;
      }
      
      .refresh-button {
        width: 100%;
        justify-content: center;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group select,
      .form-group button {
        padding: 0.75rem;
        font-size: 0.875rem;
      }
      
      .confirmation-content {
        width: 95%;
      }
    }
</style>

<div class="page-container">
  {#if loading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Chargement en cours...</p>
    </div>
  {/if}

  <header class="header">
    <div class="header-content">
      <h1 class="header-title">
        <i class="fas fa-users-cog"></i>
        Modification en Masse des Groupes d'Utilisateurs
      </h1>
      <div class="header-actions">
        <button class="refresh-button" on:click={fetchUserGroups} disabled={loading}>
          <i class="fas fa-sync-alt"></i>
          Actualiser les groupes
        </button>
      </div>
    </div>
  </header>

  <main class="main-content">
    {#if error}
      <div class="message error">
        <i class="fas fa-exclamation-circle"></i>
        {error}
      </div>
    {/if}

    {#if message}
      <div class="message {message.includes('succès') || message.includes('transférés') ? 'success' : 'error'}">
        <i class="fas {message.includes('succès') || message.includes('transférés') ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>{message}</span>
      </div>
    {/if}

    <form on:submit={confirmChange}>
      <div class="form-group">
        <label for="oldGroup">
          <i class="fas fa-users"></i> Groupe Actuel
        </label>
        <select id="oldGroup" bind:value={oldGroup} disabled={stage === 'all_user_group_change'} required={stage === 'one_user_group_change'}>
          <option value="" disabled selected={!oldGroup}>Sélectionner le groupe actuel</option>
          {#each groups as group}
            <option value={group.user_group}>{group.user_group} - {group.group_name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="newGroup">
          <i class="fas fa-user-tag"></i> Nouveau Groupe
        </label>
        <select id="newGroup" bind:value={newGroup} required>
          <option value="" disabled selected={!newGroup}>Sélectionner le nouveau groupe</option>
          {#each groups as group}
            <option value={group.user_group}>{group.user_group} - {group.group_name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="stage">
          <i class="fas fa-filter"></i> Type de Modification
        </label>
        <select id="stage" bind:value={stage} on:change={handleStageChange}>
          <option value="one_user_group_change">Modifier un groupe spécifique</option>
          <option value="all_user_group_change">Modifier tous les utilisateurs non-admin</option>
        </select>
      </div>

      <div class="form-group">
        <button type="submit" disabled={loading}>
          {#if loading}
            <div class="spinner-small"></div>
            <span>Traitement...</span>
          {:else}
            <i class="fas fa-exchange-alt"></i>
            <span>Modifier les Groupes</span>
          {/if}
        </button>
      </div>
    </form>
  </main>
</div>

{#if showConfirmation}
  <div class="confirmation-modal" transition:fade>
    <div class="confirmation-content">
      <div class="confirmation-header">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Confirmer la modification</h3>
      </div>
      
      <div class="confirmation-body">
        <p>Vous êtes sur le point de modifier le groupe de <strong>{affectedUsersCount}</strong> utilisateur(s).</p>
        
        <div class="confirmation-details">
          {#if stage === 'one_user_group_change'}
            <div class="detail-item">
              <span class="detail-label">De:</span>
              <span class="detail-value">{groups.find(g => g.user_group === oldGroup)?.group_name || oldGroup}</span>
            </div>
          {:else}
            <div class="detail-item">
              <span class="detail-label">De:</span>
              <span class="detail-value">Tous les utilisateurs non-admin</span>
            </div>
          {/if}
          
          <div class="detail-item">
            <span class="detail-label">Vers:</span>
            <span class="detail-value">{groups.find(g => g.user_group === newGroup)?.group_name || newGroup}</span>
          </div>
        </div>
        
        <p class="confirmation-warning">Cette action ne peut pas être annulée.</p>
      </div>
      
      <div class="confirmation-footer">
        <button class="cancel-button" on:click={cancelConfirmation}>
          <i class="fas fa-times"></i>
          Annuler
        </button>
        <button class="confirm-button" on:click={submitForm}>
          <i class="fas fa-check"></i>
          Confirmer
        </button>
      </div>
    </div>
  </div>
{/if}