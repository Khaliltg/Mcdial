<script>
  import { onMount } from 'svelte';
  import axios from 'axios';

  let listIdOverride = '';
  let fileLayout = 'standard';
  let fileInput;
  let selectedFile;

  async function uploadLeads() {
    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('listIdOverride', listIdOverride);
    formData.append('fileLayout', fileLayout);

    try {
      const res = await axios.post(
        'http://localhost:8000/api/prospects/upload_leads',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (res.status === 200) {
        alert('Leads chargés avec succès');
      } else {
        alert('Erreur : ' + (res.data.error || 'Une erreur est survenue.'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des leads :', error);
      alert('Erreur lors du chargement des leads.');
    }
  }
</script>

<div class="container">
  <div class="card">
    <h1 class="title">Charger de nouveaux prospects</h1>

    <div class="form-section">
      <label class="label">Fichier de leads</label>
      <input type="file" bind:this={fileInput} on:change={() => selectedFile = fileInput.files[0]} class="input-field" />

      <label class="label">List ID Override</label>
      <input type="text" bind:value={listIdOverride} class="input-field" />

      <label class="label">File Layout</label>
      <select bind:value={fileLayout} class="input-field">
        <option value="standard">Standard</option>
        <option value="custom_layout">Custom Layout</option>
        <option value="custom_template">Custom Template</option>
      </select>

      <button on:click={uploadLeads} class="button primary">
        Charger les leads
      </button>
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
    padding: 20px;
    width: 100%;
    max-width: 600px;
  }

  .title {
    color: #0056b3;
    font-size: 2rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .label {
    color: #4a5568;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .input-field {
    width: 100%;
    padding: 10px;
    margin-bottom: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
  }

  .input-field:focus {
    border-color: #0056b3;
    outline: none;
  }

  .button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .button.primary {
    background-color: #0056b3;
    color: white;
  }

  .button.primary:hover {
    background-color: #003d80;
  }
</style>
