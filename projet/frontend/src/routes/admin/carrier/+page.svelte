<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // Données et états
  let carriers: any[] = [];
  let error: string = '';
  let newCarrier: any = null;
  let editingCarrier: any = null;
  let loading: boolean = true; // Ajout d'un état de chargement

  // Chargement initial des carriers
  onMount(async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/carriers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      carriers = await res.json();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false; // Indique que le chargement est terminé, succès ou échec
    }
  });

  // Ouvre le formulaire d'ajout
  function openAddForm() {
    error = '';
    newCarrier = {
      carrier_id: '',
      carrier_name: '',
      server_ip: '',
      protocol: '',
      registration_string: '',
      active: false,
      user_group: ''
    };
  }

  // Annule l'ajout
  function cancelAdd() {
    newCarrier = null;
    error = '';
  }

  // Envoie l'ajout au backend
  async function addCarrier() {
    // Validation front
    if (!newCarrier.carrier_name.trim()) {
      error = 'Le nom du carrier est requis.';
      return;
    }
    try {
      const payload = {
        ...newCarrier,
        active: newCarrier.active ? 'Y' : 'N'
      };
      const res = await fetchWithAuth('http://localhost:8000/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const created = await res.json();
      carriers = [...carriers, created];
      newCarrier = null;
      error = '';
    } catch (err) {
      error = err.message;
    }
  }

  // Ouvre le formulaire de modification
  function editCarrier(c: any) {
    error = '';
    editingCarrier = { ...c, active: c.active === 'Y' };
  }

  // Annule la modification
  function cancelEdit() {
    editingCarrier = null;
    error = '';
  }

  // Envoie la mise à jour au backend
  async function saveChanges() {
    if (!editingCarrier.carrier_name.trim()) {
      error = 'Le nom du carrier est requis.';
      return;
    }
    try {
      const payload = {
        ...editingCarrier,
        active: editingCarrier.active ? 'Y' : 'N'
      };
      const res = await fetchWithAuth(
        `http://localhost:8000/api/carriers/${editingCarrier.carrier_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      carriers = carriers.map(c =>
        c.carrier_id === editingCarrier.carrier_id ? { ...editingCarrier, active: editingCarrier.active ? 'Y' : 'N' } : c
      );
      editingCarrier = null;
      error = '';
    } catch (err) {
      error = err.message;
    }
  }
</script>

<style>
  /* Styles globaux pour une apparence moderne */
  :global(body) {
    font-family: 'Arial', sans-serif;
    background-color: #f4f5f7;
    color: #333;
  }

  /* Titre principal */
  .main-title {
    font-size: 2.5rem;
    font-weight: bold;
    color: #4a5568; /* Couleur plus douce */
    margin-bottom: 1rem;
    text-align: center;
  }

  /* Section conteneur */
  .container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 1.5rem;
    background-color: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  /* Message d'erreur */
  .error-message {
    color: #dc2626;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background-color: #fef2f2;
    border-radius: 0.375rem;
    border: 1px solid #f87171;
  }

  /* Message de chargement */
  .loading-message {
    text-align: center;
    color: #6b7280;
    font-style: italic;
  }

  /* Table des carriers */
  .carriers-table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    overflow: hidden; /* Important pour border-radius */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .carriers-table thead {
    background-color: #edf2f7;
    color: #4a5568;
    font-weight: 600;
  }

  .carriers-table th,
  .carriers-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  .carriers-table tbody tr:last-child td {
    border-bottom: none; /* Supprime la bordure du dernier élément */
  }

  .carriers-table tbody tr:hover {
    background-color: #f9fafb;
  }

  /* Bouton Modifier */
  .edit-button {
    background-color: #3b82f6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s ease-in-out;
    cursor: pointer;
    border: none;
    font-size: 0.875rem;
  }

  .edit-button:hover {
    background-color: #2563eb;
  }

  /* Bouton Ajouter Carrier */
  .add-carrier-button {
    background-color: #4f46e5;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s ease-in-out;
    cursor: pointer;
    border: none;
    font-size: 1rem;
    display: block;
    margin: 2rem auto;
    width: fit-content;
  }

  .add-carrier-button:hover {
    background-color: #4338ca;
  }

  /* Formulaire (Ajouter/Modifier) */
  .carrier-form {
    background-color: #fff;
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    max-width: 800px;
    margin: 2rem auto;
  }

  .form-title {
    font-size: 1.75rem;
    font-weight: bold;
    color: #374151;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.25rem;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    color: #4b5563;
    transition: border-color 0.2s ease-in-out;
  }

  .form-input:focus {
    border-color: #6366f1;
    outline: none;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .form-checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-checkbox {
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    color: #4f46e5;
    cursor: pointer;
  }

  .form-checkbox:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }

  .form-checkbox-label {
    font-size: 1rem;
    color: #374151;
  }

  /* Boutons d'action (Ajouter/Enregistrer, Annuler) */
  .form-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  .submit-button,
  .cancel-button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s ease-in-out;
    cursor: pointer;
    border: none;
  }

  .submit-button {
    background-color: #10b981;
    color: white;
  }

  .submit-button:hover {
    background-color: #059669;
  }

  .cancel-button {
    background-color: #e61919;
    color: white;
  }

  .cancel-button:hover {
    background-color: #4b5563;
  }

  /* Style pour les icônes d'état actif */
  .active-icon {
    font-size: 1.25rem;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .carriers-table {
      overflow-x: auto; /* Permet le défilement horizontal sur les petits écrans */
    }

    .form-grid {
      grid-template-columns: 1fr; /* Empile les éléments du formulaire sur les petits écrans */
    }
  }
</style>

<div class="container">
  <h1 class="main-title">Gestion des Carriers</h1>

  {#if error}
    <div class="error-message">Erreur : {error}</div>
  {:else if loading}
    <p class="loading-message">Chargement des données...</p>
  {:else}
    <div class="table-wrapper">
      <table class="carriers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>IP Serveur</th>
            <th>Protocole</th>
            <th>Registration</th>
            <th>Actif</th>
            <th>Groupe</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each carriers as c}
            <tr>
              <td>{c.carrier_id}</td>
              <td>{c.carrier_name}</td>
              <td>{c.server_ip}</td>
              <td>{c.protocol}</td>
              <td>{c.registration_string}</td>
              <td>
                {#if c.active === 'Y'}
                  <span class="active-icon">✅</span>
                {:else}
                  <span class="active-icon">❌</span>
                {/if}
              </td>
              <td>{c.user_group}</td>
              <td>
                <button class="edit-button" on:click={() => editCarrier(c)}>Modifier</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Bouton Ajouter -->
  <button class="add-carrier-button" on:click={openAddForm}>➕ Ajouter Carrier</button>

  {#if newCarrier}
    <div class="carrier-form">
      <h2 class="form-title">Ajouter un nouveau Carrier</h2>
      <form on:submit|preventDefault={addCarrier} class="space-y-4">
        <div class="form-grid">
          <input
            type="text"
            placeholder="Carrier ID"
            bind:value={newCarrier.carrier_id}
            class="form-input"
          />
          <input
            type="text"
            placeholder="Nom"
            bind:value={newCarrier.carrier_name}
            class="form-input"
          />
          <input
            type="text"
            placeholder="IP Serveur"
            bind:value={newCarrier.server_ip}
            class="form-input"
          />
          <input
            type="text"
            placeholder="Protocole"
            bind:value={newCarrier.protocol}
            class="form-input"
          />
          <input
            type="text"
            placeholder="Registration"
            bind:value={newCarrier.registration_string}
            class="form-input"
          />
          <div class="form-checkbox-group">
            <input
              type="checkbox"
              id="new-active"
              bind:checked={newCarrier.active}
              class="form-checkbox"
            />
            <label for="new-active" class="form-checkbox-label">Actif</label>
          </div>
          <input
            type="text"
            placeholder="Groupe"
            bind:value={newCarrier.user_group}
            class="form-input"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="submit-button">✅ Ajouter</button>
          <button type="button" on:click={cancelAdd} class="cancel-button">❌ Annuler</button>
        </div>
      </form>
    </div>
  {/if}

  {#if editingCarrier}
    <div class="carrier-form">
      <h2 class="form-title">Modifier Carrier #{editingCarrier.carrier_id}</h2>
      <form on:submit|preventDefault={saveChanges} class="space-y-4">
        <div class="form-grid">
          <input
            type="text"
            placeholder="Nom"
            bind:value={editingCarrier.carrier_name}
            class="form-input"
          />
          <input
            type="text"
            placeholder="IP Serveur"
            bind:value={editingCarrier.server_ip}
            class="form-input"
          />
          <input
            type="text"
            placeholder="Protocole"
            bind:value={editingCarrier.protocol}
            class="form-input"
          />
          <input
            type="text"
            placeholder="Registration"
            bind:value={editingCarrier.registration_string}
            class="form-input"
          />
          <div class="form-checkbox-group">
            <input
              type="checkbox"
              id="edit-active"
              bind:checked={editingCarrier.active}
              class="form-checkbox"
            />
            <label for="edit-active" class="form-checkbox-label">Actif</label>
          </div>
          <input
            type="text"
            placeholder="Groupe"
            bind:value={editingCarrier.user_group}
            class="form-input"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="submit-button">💾 Enregistrer</button>
          <button type="button" on:click={cancelEdit} class="cancel-button">❌ Annuler</button>
        </div>
      </form>
    </div>
  {/if}
</div>