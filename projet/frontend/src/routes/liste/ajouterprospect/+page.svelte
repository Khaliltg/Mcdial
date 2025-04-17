<script>
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  let listIdOverride = '';
  let fileLayout = 'standard';
  let fileInput;
  let selectedFile = null;
  let lists = [];
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  
  // Create a reference to axios if it's available globally
  let axios;

  async function loadLists() {
    try {
      isLoading = true;
      const response = await fetchWithAuth('http://localhost:8000/api/lists/afficher');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
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
      console.log('File selected:', selectedFile.name, 'Size:', selectedFile.size, 'bytes');
      errorMessage = '';
    } else {
      selectedFile = null;
    }
  }

  async function uploadLeads() {
    // Reset messages
    errorMessage = '';
    successMessage = '';

    // Validate file
    if (!selectedFile) {
        errorMessage = 'Veuillez sélectionner un fichier.';
        return;
    }

    // Validate list selection
    if (!listIdOverride) {
        errorMessage = 'Veuillez choisir une liste.';
        return;
    }

    isLoading = true;

    // Create FormData
    const formData = new FormData();
    
    // Append the file and other form fields
    formData.append('file', selectedFile);
    formData.append('listIdOverride', listIdOverride);
    formData.append('fileLayout', fileLayout);

    // Log the FormData contents for debugging
    console.log('FormData being sent:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    try {
        let response;

        // Use axios if available (as in the original code)
        if (axios) {
            console.log('Using axios for upload');
            response = await axios.post(
                'http://localhost:8000/api/lists/upload_leads',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
        } else {
            // Fallback to fetch if axios is not available
            console.log('Using fetch for upload');
            response = await fetchWithAuth('http://localhost:8000/api/lists/upload_leads', {
                method: 'POST',
                body: formData,
                // Don't set Content-Type for FormData, browser will set it with boundary
                headers: {}
            });
        }

        // Always await the JSON response after fetch or axios
        const data = await response.json();

        // Check if the server response indicates an error
        if (response.ok) {
            successMessage = data.message || 'Leads chargés avec succès';
            selectedFile = null;
            if (fileInput) fileInput.value = '';
        } else {
            console.error('Upload error response:', data); // Log the server response for errors
            errorMessage = data.error || 'Une erreur est survenue.';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des leads:', error);
        errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
    } finally {
        isLoading = false; // Reset loading state
    }
}

onMount(() => {
    loadLists();
    
    // Check if axios is available globally and store a reference
    if (window.axios) {
      axios = window.axios;
      console.log('Using global axios instance');
    } else {
      console.log('Axios not found, using fetch as fallback');
    }
  });
</script>

<div class="container">
  <div class="card">
    <h1 class="title">Charger de nouveaux prospects</h1>

    {#if errorMessage}
      <div class="alert error">
        {errorMessage}
      </div>
    {/if}

    {#if successMessage}
      <div class="alert success">
        {successMessage}
      </div>
    {/if}

    <!-- Important: Use a real HTML form element -->
    <form 
      id="upload-form" 
      enctype="multipart/form-data"
      on:submit|preventDefault={uploadLeads}
      class="form-section"
    >
      <div class="file-upload-container">
        <label class="label" for="file-input">Fichier de leads</label>
        <div class="file-input-wrapper">
          <input 
            id="file-input"
            name="file"
            type="file" 
            accept=".csv"
            bind:this={fileInput} 
            on:change={handleFileChange} 
            class="input-field file-input"
            disabled={isLoading}
          />
        </div>
        {#if selectedFile}
          <div class="file-info">
            <span>Fichier sélectionné: <strong>{selectedFile.name}</strong></span>
            <button 
              type="button"
              class="clear-file-btn" 
              on:click={() => { selectedFile = null; fileInput.value = ''; }}
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        {/if}
      </div>

      <label class="label" for="list-select">Liste de destination</label>
      <select 
        id="list-select"
        name="listIdOverride"
        bind:value={listIdOverride} 
        class="input-field"
        disabled={isLoading || lists.length === 0}
      >
        <option value="" disabled selected>Choisissez une liste</option>
        {#each lists as list}
          <option value={list.list_id}>{list.list_name}</option>
        {/each}
      </select>

      <label class="label" for="layout-select">Format du fichier</label>
      <select 
        id="layout-select"
        name="fileLayout"
        bind:value={fileLayout} 
        class="input-field"
        disabled={isLoading}
      >
        <option value="standard">Standard</option>
        <option value="custom_layout">Custom Layout</option>
        <option value="custom_template">Custom Template</option>
      </select>

      <button 
        type="submit"
        class="button primary"
        disabled={isLoading || !selectedFile || !listIdOverride}
      >
        {#if isLoading}
          Chargement en cours...
        {:else}
          Charger les leads
        {/if}
      </button>
    </form>
    
    <!-- Server configuration hint -->
    <div class="server-hint">
      <details>
        <summary>Problème de configuration serveur ?</summary>
        <div class="hint-content">
          <p>Si le problème persiste, vérifiez la configuration de multer sur le serveur :</p>
          <pre class="code-block">{'// Exemple de configuration multer correcte\nconst multer = require(\'multer\');\nconst upload = multer({ \n  storage: multer.memoryStorage() \n});\n\n// Utilisation dans la route\napp.post(\'/api/lists/upload_leads\', upload.single(\'file\'), controller.uploadLeads);'}</pre>
        </div>
      </details>
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f4f8;
    padding: 20px;
  }

  .card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 24px;
    width: 100%;
    max-width: 600px;
  }

  .title {
    color: #0056b3;
    font-size: 2rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .form-section {
    margin-bottom: 1rem;
  }

  .label {
    display: block;
    color: #4a5568;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .input-field {
    width: 100%;
    padding: 10px;
    margin-bottom: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
    background-color: white;
  }

  .input-field:focus {
    border-color: #0056b3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.2);
  }

  .input-field:disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
  }

  .file-upload-container {
    margin-bottom: 1rem;
  }

  .file-input-wrapper {
    position: relative;
    overflow: hidden;
    display: inline-block;
    width: 100%;
  }

  .file-input {
    cursor: pointer;
  }

  .file-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #4b5563;
    padding: 6px 10px;
    background-color: #f3f4f6;
    border-radius: 4px;
    margin-top: 4px;
    margin-bottom: 1rem;
  }

  .clear-file-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0 4px;
  }

  .clear-file-btn:hover:not(:disabled) {
    color: #ef4444;
  }

  .button {
    width: 100%;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .button.primary {
    background-color: #0056b3;
    color: white;
  }

  .button.primary:hover:not(:disabled) {
    background-color: #003d80;
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .alert {
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }

  .error {
    background-color: #fee2e2;
    color: #b91c1c;
    border: 1px solid #f87171;
  }

  .success {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }

  .server-hint {
    margin-top: 1rem;
    border-top: 1px solid #e5e7eb;
    padding-top: 0.5rem;
    font-size: 0.85rem;
  }

  details {
    color: #6b7280;
  }

  summary {
    cursor: pointer;
    font-weight: 500;
    padding: 0.5rem 0;
  }

  .hint-content {
    padding: 0.5rem;
    background-color: #f9fafb;
    border-radius: 4px;
  }

  .code-block {
    background-color: #f1f5f9;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.75rem;
    line-height: 1.4;
    white-space: pre;
    font-family: monospace;
  }
</style>