<script>
  import { onMount } from 'svelte';
  import Papa from 'papaparse';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  let listIdOverride = '';
  let fileLayout = 'standard';
  let fileInput;
  let selectedFile = null;
  let csvPreview = [];
  let lists = [];
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  async function loadLists() {
    try {
      isLoading = true;
      let response;
      if (typeof fetchWithAuth === 'function') {
        response = await fetchWithAuth('http://localhost:8000/api/lists/afficher');
      } else {
        response = await fetch('http://localhost:8000/api/lists/afficher');
      }
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
    errorMessage = '';
    successMessage = '';

    if (!selectedFile) {
      errorMessage = 'Veuillez sélectionner un fichier.';
      return;
    }

    if (!listIdOverride) {
      errorMessage = 'Veuillez choisir une liste.';
      return;
    }

    isLoading = true;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('listIdOverride', listIdOverride);
    formData.append('fileLayout', fileLayout);

    try {
      let response;
      if (typeof axios !== 'undefined') {
        // Use axios if available
        response = await axios.post(
          'http://localhost:8000/api/lists/upload_leads',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        // Axios puts response data in response.data
        if (response.status >= 200 && response.status < 300) {
          successMessage = response.data.message || 'Leads chargés avec succès';
          selectedFile = null;
          csvPreview = [];
          if (fileInput) fileInput.value = '';
        } else {
          errorMessage = response.data.error || 'Une erreur est survenue.';
        }
      } else if (typeof fetchWithAuth === 'function') {
        // Use fetchWithAuth if available
        response = await fetchWithAuth('http://localhost:8000/api/lists/upload_leads', {
          method: 'POST',
          body: formData,
          headers: {}
        });
        const data = await response.json();
        if (response.ok) {
          successMessage = data.message || 'Leads chargés avec succès';
          selectedFile = null;
          csvPreview = [];
          if (fileInput) fileInput.value = '';
        } else {
          errorMessage = data.error || 'Une erreur est survenue.';
        }
      } else {
        // Fallback to fetch
        response = await fetch('http://localhost:8000/api/lists/upload_leads', {
          method: 'POST',
          body: formData,
          headers: {}
        });
        const data = await response.json();
        if (response.ok) {
          successMessage = data.message || 'Leads chargés avec succès';
          selectedFile = null;
          csvPreview = [];
          if (fileInput) fileInput.value = '';
        } else {
          errorMessage = data.error || 'Une erreur est survenue.';
        }
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

<div class="container">
  <div class="card">
    <h1 class="title">Charger de nouveaux prospects</h1>

    {#if errorMessage}
      <div class="alert error">{errorMessage}</div>
    {/if}

    {#if successMessage}
      <div class="alert success">{successMessage}</div>
    {/if}

    <form on:submit|preventDefault={uploadLeads} enctype="multipart/form-data" class="form-section">
      <div class="file-upload-container">
        <label for="file-input">Fichier de leads</label>
        <input
          id="file-input"
          name="file"
          type="file"
          accept=".csv"
          bind:this={fileInput}
          on:change={handleFileChange}
          class="input-field"
          disabled={isLoading}
        />
        {#if selectedFile}
          <div class="file-info">
            Fichier sélectionné : <strong>{selectedFile.name}</strong>
            <button type="button" on:click={() => { selectedFile = null; csvPreview = []; fileInput.value = ''; }} disabled={isLoading}>✕</button>
          </div>
        {/if}
      </div>

      <label for="list-select">Liste de destination</label>
      <select id="list-select" bind:value={listIdOverride} class="input-field" disabled={isLoading || lists.length === 0}>
        <option value="" disabled selected>Choisissez une liste</option>
        {#each lists as list}
          <option value={list.list_id}>{list.list_name}</option>
        {/each}
      </select>

      <label for="layout-select">Format du fichier</label>
      <select id="layout-select" bind:value={fileLayout} class="input-field" disabled={isLoading}>
        <option value="standard">Standard</option>
        <option value="custom_layout">Custom Layout</option>
        <option value="custom_template">Custom Template</option>
      </select>

      <button type="submit" class="button primary" disabled={isLoading || !selectedFile || !listIdOverride}>
        {#if isLoading}
          Chargement en cours...
        {:else}
          Charger les leads
        {/if}
      </button>
    </form>

    {#if csvPreview.length > 0}
      <div class="csv-preview">
        <h3>Prévisualisation du fichier :</h3>
        <table class="preview-table">
          <thead>
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
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  .card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .title {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  .alert {
    padding: 0.8rem;
    margin-bottom: 1rem;
    border-radius: 6px;
  }
  .error {
    background-color: #ffe6e6;
    color: #cc0000;
  }
  .success {
    background-color: #e6ffee;
    color: #007f33;
  }
  .input-field {
    width: 100%;
    padding: 0.6rem;
    margin-top: 0.4rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
  .button.primary {
    background-color: #0077cc;
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  .button.primary:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  .csv-preview {
    margin-top: 2rem;
  }
  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .preview-table th, .preview-table td {
    border: 1px solid #ddd;
    padding: 6px 10px;
  }
  .preview-table th {
    background-color: #f4f4f4;
  }
</style>
