<script>
  import { onMount } from 'svelte';
  import Papa from 'papaparse';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // API URL from environment variable with fallback
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Variables for form state
  let listIdOverride = '';
  let fileLayout = 'standard';
  let fileInput;
  let selectedFile = null;
  let csvPreview = [];
  let lists = [];
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let isFormValid = false;

  // Validate form whenever dependencies change
  $: isFormValid = selectedFile && listIdOverride;

  async function loadLists() {
    try {
      isLoading = true;
      const response = await fetchWithAuth(`${API_BASE_URL}/api/lists/afficher`);
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      lists = await response.json();
    } catch (error) {
      console.error('Failed to load lists:', error);
      errorMessage = 'Impossible de charger les listes. Veuillez réessayer.';
    } finally {
      isLoading = false;
    }
  }

  function handleFileChange(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      selectedFile = files[0];
      errorMessage = '';
      parseCSVPreview(selectedFile);
    } else {
      selectedFile = null;
      csvPreview = [];
    }
  }

  function parseCSVPreview(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        csvPreview = results.data;
        console.log('CSV Preview:', csvPreview);
      },
      error: (err) => {
        console.error('Erreur de lecture CSV :', err);
        errorMessage = 'Erreur lors de la lecture du fichier CSV.';
      }
    });
  }

  async function uploadLeads() {
    // Reset messages
    errorMessage = '';
    successMessage = '';

    // Validation
    if (!selectedFile) {
      errorMessage = 'Veuillez sélectionner un fichier.';
      return;
    }

    if (!listIdOverride) {
      errorMessage = 'Veuillez choisir une liste.';
      return;
    }

    // Prepare form data
    isLoading = true;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('listIdOverride', listIdOverride);
    formData.append('fileLayout', fileLayout);

    try {
      // Utiliser fetch directement pour l'upload de fichiers au lieu de fetchWithAuth
      // car fetchWithAuth ajoute automatiquement le header Content-Type: application/json
      const token = document.cookie.split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${API_BASE_URL}/api/prospects/upload_leads`, {
        method: 'POST',
        body: formData,
        headers: {
          // Ne pas définir Content-Type, le navigateur le fera automatiquement avec la bonne boundary
          // pour les données multipart/form-data
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        // Success handling
        successMessage = data.message || 'Leads chargés avec succès';
        
        // Reset form
        selectedFile = null;
        csvPreview = [];
        if (fileInput) fileInput.value = '';
      } else {
        // Error handling
        errorMessage = data.error || 'Une erreur est survenue lors du chargement des leads.';
      }
    } catch (error) {
      console.error('Erreur lors du chargement des leads:', error);
      errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadLists();
  });
</script>

<div class="page-container">
  <div class="content-wrapper">
    <div class="header-section">
      <h1 class="page-title">Importation de prospects</h1>
      <p class="page-description">Chargez votre fichier CSV contenant les données des prospects à ajouter au système</p>
    </div>

    <!-- Alerts -->
    {#if errorMessage}
      <div class="alert alert-error" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        {errorMessage}
      </div>
    {/if}

    {#if successMessage}
      <div class="alert alert-success" role="alert">
        <i class="fas fa-check-circle me-2"></i>
        {successMessage}
      </div>
    {/if}

    <div class="card glass-card">
      <div class="card-body">
        <form on:submit|preventDefault={uploadLeads} enctype="multipart/form-data">
          <div class="row">
            <!-- File Upload Section -->
            <div class="col-md-12 mb-4">
              <div class="file-upload-section">
                <div class="upload-container">
                  <label for="file-input" class="form-label">Fichier CSV</label>
                  <div class="custom-file-input">
                    <input
                      id="file-input"
                      name="file"
                      type="file"
                      accept=".csv"
                      bind:this={fileInput}
                      on:change={handleFileChange}
                      class="form-control"
                      disabled={isLoading}
                    />
                    <div class="file-input-overlay">
                      {#if selectedFile}
                        <span class="selected-filename">{selectedFile.name}</span>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-clear" 
                          on:click={() => { selectedFile = null; csvPreview = []; fileInput.value = ''; }} 
                          disabled={isLoading}
                          aria-label="Supprimer le fichier sélectionné"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      {:else}
                        <span>Choisir un fichier CSV</span>
                        <i class="fas fa-upload ms-2"></i>
                      {/if}
                    </div>
                  </div>
                  <small class="form-text text-muted">Formats acceptés: .csv</small>
                </div>
              </div>
            </div>

            <!-- Form Controls -->
            <div class="col-md-6 mb-3">
              <label for="list-select" class="form-label">Liste de destination</label>
              <select 
                id="list-select" 
                bind:value={listIdOverride} 
                class="form-select" 
                disabled={isLoading || lists.length === 0}
                aria-describedby="list-help"
              >
                <option value="" disabled selected>Choisissez une liste</option>
                {#each lists as list}
                  <option value={list.list_id}>{list.list_name}</option>
                {/each}
              </select>
              <small id="list-help" class="form-text text-muted">Liste où les prospects seront ajoutés</small>
            </div>

            <div class="col-md-6 mb-3">
              <label for="layout-select" class="form-label">Format du fichier</label>
              <select 
                id="layout-select" 
                bind:value={fileLayout} 
                class="form-select" 
                disabled={isLoading}
                aria-describedby="layout-help"
              >
                <option value="standard">Standard</option>
                <option value="custom_layout">Custom Layout</option>
                <option value="custom_template">Custom Template</option>
              </select>
              <small id="layout-help" class="form-text text-muted">Format de données du fichier CSV</small>
            </div>

            <div class="col-12 mt-3">
              <button 
                type="submit" 
                class="btn btn-primary" 
                disabled={isLoading || !selectedFile || !listIdOverride}
              >
                {#if isLoading}
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Importation en cours...
                {:else}
                  <i class="fas fa-file-import me-2"></i>
                  Importer les prospects
                {/if}
              </button>
              <a href="/liste/afficher" class="btn btn-outline-secondary ms-2">
                <i class="fas fa-arrow-left me-1"></i>
                Retour à la liste
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- CSV Preview -->
    {#if csvPreview.length > 0}
      <div class="preview-section mt-4">
        <div class="card glass-card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-table me-2"></i>
              Prévisualisation du fichier
            </h5>
          </div>
          <div class="card-body table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-light">
                <tr>
                  {#each Object.keys(csvPreview[0]) as key}
                    <th>{key}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each csvPreview as row}
                  <tr>
                    {#each Object.values(row) as value}
                      <td>{value}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
            <div class="preview-info text-muted">
              <small>Affichage des 5 premières lignes uniquement</small>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Page Layout */
  .page-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  /* Header Styles */
  .header-section {
    margin-bottom: 1rem;
  }
  
  .page-title {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
  }
  
  .page-description {
    color: #666;
    font-size: 1rem;
    max-width: 800px;
  }
  
  /* Card Styles */
  .glass-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    border: 1px solid rgba(209, 213, 219, 0.3);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }
  
  .glass-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  }
  
  .card-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(209, 213, 219, 0.3);
    background: rgba(249, 250, 251, 0.8);
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  
  .card-body {
    padding: 1.5rem;
  }
  
  /* Alert Styles */
  .alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
  
  .alert-error {
    background-color: rgba(254, 226, 226, 0.8);
    color: #b91c1c;
    border-left: 4px solid #ef4444;
  }
  
  .alert-success {
    background-color: rgba(209, 250, 229, 0.8);
    color: #047857;
    border-left: 4px solid #10b981;
  }
  
  /* Form Styles */
  .form-label {
    font-weight: 500;
    color: #4b5563;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .form-control, .form-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: #fff;
    transition: border-color 0.2s ease;
  }
  
  .form-control:focus, .form-select:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }
  
  .form-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  /* File Upload Styles */
  .file-upload-section {
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 1.5rem;
    background-color: rgba(249, 250, 251, 0.8);
    transition: all 0.3s ease;
  }
  
  .file-upload-section:hover {
    border-color: #3b82f6;
  }
  
  .custom-file-input {
    position: relative;
  }
  
  .custom-file-input input[type="file"] {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  .file-input-overlay {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: #fff;
    cursor: pointer;
  }
  
  .selected-filename {
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .btn-clear {
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .btn-clear:hover {
    background-color: #f3f4f6;
    color: #ef4444;
  }
  
  /* Button Styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .btn-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
  }
  
  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }
  
  .btn-primary:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
  
  .btn-outline-secondary {
    background-color: transparent;
    color: #4b5563;
    border: 1px solid #d1d5db;
  }
  
  .btn-outline-secondary:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }
  
  /* Table Styles */
  .table-responsive {
    overflow-x: auto;
  }
  
  .table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.875rem;
  }
  
  .table th {
    background-color: #f9fafb;
    color: #4b5563;
    font-weight: 600;
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
  }
  
  .table-striped tbody tr:nth-of-type(odd) {
    background-color: rgba(249, 250, 251, 0.5);
  }
  
  .table-hover tbody tr:hover {
    background-color: rgba(243, 244, 246, 0.7);
  }
  
  .preview-info {
    text-align: right;
    padding: 0.5rem 0;
  }
  
  /* Utility Classes */
  .mt-3 { margin-top: 1rem; }
  .mt-4 { margin-top: 1.5rem; }
  .mb-0 { margin-bottom: 0; }
  .mb-3 { margin-bottom: 1rem; }
  .mb-4 { margin-bottom: 1.5rem; }
  .ms-2 { margin-left: 0.5rem; }
  .me-1 { margin-right: 0.25rem; }
  .me-2 { margin-right: 0.5rem; }
  .row { display: flex; flex-wrap: wrap; margin: 0 -0.75rem; }
  .col-12 { width: 100%; padding: 0 0.75rem; }
  .col-md-6 { width: 100%; padding: 0 0.75rem; }
  .col-md-12 { width: 100%; padding: 0 0.75rem; }
  
  @media (min-width: 768px) {
    .col-md-6 { width: 50%; }
  }
</style>
