<script>
  import { onMount } from 'svelte';
  import axios from "axios";
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  let name = '';
  let phone = '';
  let email = '';
  let address1 = '';
  let address2 = '';
  let address3 = '';
  let city = '';
  let state = '';
  let postalCode = '';
  let province = '';
  let country = '';
  let dateOfBirth = '';
  let show = '';
  let vendorId = '';
  let rank = '';
  let owner = '';
  let comments = '';
  let listId = '';
  let lists = [];
  let campaigns = [];
  let phoneCodes = [
    { code: '+93', country: 'Afghanistan' },
    { code: '+355', country: 'Albania' },
    // ... (other phone codes)
  ];
  let selectedCampaign = '';
  let selectedPhoneCode = '';
  let fileInput;

  async function loadLists() {
    const res = await fetchWithAuth('http://localhost:8000/api/lists/afficher');
    if (res.ok) {
      lists = await res.json();
    } else {
      console.error('Failed to load lists:', res.statusText);
    }
  }

  async function loadCampaigns() {
    const res = await fetchWithAuth('http://localhost:8000/api/lists/campaigns');
    if (res.ok) {
      campaigns = await res.json();
    } else {
      console.error('Failed to load campaigns:', res.statusText);
    }
  }

  async function addProspect() {
    // Basic validation
    if (!name || !phone || !listId || !selectedPhoneCode) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert('Veuillez entrer une adresse email valide.');
      return;
    }

    // Additional validations can be added here

    const formData = {
      name, phone, email, address1: address1 || '' , address2: address2 || '', address3: address3 || '', city, state,
      postalCode, province, country, dateOfBirth, show, vendorId,
      rank, owner, comments, listId, phone_code: selectedPhoneCode
      ,status: "new"
    };

    try {
      const res = await axios.post(
        'http://localhost:8000/api/lists/upload_leads',
        formData
      );

      if (res.status === 200) {
        alert('Prospect ajouté avec succès');
        // Clear form fields
       name = ''; phone = ''; email = ''; address1 = ''; address2 = '';
        address3 = ''; city = ''; state = ''; postalCode = ''; province = '';
        country = ''; dateOfBirth = ''; show = ''; vendorId = ''; rank = '';
        owner = ''; comments = ''; listId = '';
      } else {
        alert('Erreur : ' + (res.data.error || 'Une erreur est survenue.'));
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du prospect :', error);
      alert('Erreur lors de l\'ajout du prospect.');
    }
  }

  onMount(() => {
    loadLists();
    loadCampaigns();
  });
</script>

<div class="container">
  <div class="card">
    <h1 class="title">👤 Ajouter un prospect</h1>

    <div class="form-section">
      <div class="side-by-side">
        <div>
          <label class="label">Nom</label>
          <input type="text" bind:value={name} class="input-field" />
        </div>

        <div>
          <label class="label">Téléphone</label>
          <input type="text" bind:value={phone} class="input-field" />
        </div>
      </div>

      <div class="side-by-side">
        <div>
          <label class="label">Email</label>
          <input type="email" bind:value={email} class="input-field" />
        </div>

        <div>
          <label class="label">Adresse 1</label>
          <input type="text" bind:value={address1} class="input-field" />
        </div>
      </div>

      <div class="side-by-side">
        <div>
          <label class="label">Adresse 2</label>
          <input type="text" bind:value={address2} class="input-field" />
        </div>

        <div>
          <label class="label">Adresse 3</label>
          <input type="text" bind:value={address3} class="input-field" />
        </div>
      </div>

      <div class="side-by-side">
        <div>
          <label class="label">Ville</label>
          <input type="text" bind:value={city} class="input-field" />
        </div>

        <div>
          <label class="label">État</label>
          <input type="text" bind:value={state} class="input-field" />
        </div>
      </div>

      <div class="side-by-side">
        <div>
          <label class="label">Code Postal</label>
          <input type="text" bind:value={postalCode} class="input-field" />
        </div>

        <div>
          <label class="label">Province</label>
          <input type="text" bind:value={province} class="input-field" />
        </div>
      </div>

      <div class="side-by-side">
        <div>
          <label class="label">Pays</label>
          <input type="text" bind:value={country} class="input-field" />
        </div>

        <div>
          <label class="label">Date de Naissance</label>
          <input type="date" bind:value={dateOfBirth} class="input-field" />
        </div>
      </div>

      <div class="side-by-side">
        <div>
          <label class="label">Show</label>
          <input type="text" bind:value={show} class="input-field" />
        </div>

        <div>
          <label class="label">Vendor ID</label>
          <input type="text" bind:value={vendorId} class="input-field" />
        </div>
      </div>

      <div class="side-by-side">
        <div>
          <label class="label">Rank</label>
          <input type="text" bind:value={rank} class="input-field" />
        </div>

        <div>
          <label class="label">Propriétaire</label>
          <input type="text" bind:value={owner} class="input-field" />
        </div>
      </div>

      <label class="label">Commentaires</label>
      <textarea bind:value={comments} class="input-field"></textarea>

      <label class="label">Liste</label>
      <select bind:value={listId} class="input-field">
        <option value="" disabled selected>Choisissez une liste</option>
        {#each lists as { list_id, list_name }}
          <option value={list_id}>{list_name}</option>
        {/each}
      </select>

      <label class="label">Campagne</label>
      <select bind:value={selectedCampaign} class="input-field">
        <option value="" disabled selected>Choisissez une campagne</option>
        {#each campaigns as campaign}
          <option value={campaign.campaign_id}>{campaign.campaign_name}</option>
        {/each}
      </select>

      <label class="label">Code Téléphonique</label>
      <select bind:value={selectedPhoneCode} class="input-field">
        <option value="" disabled selected>Choisissez un code téléphonique</option>
        {#each phoneCodes as code}
          <option value={code.code}>{code.country} ({code.code})</option>
        {/each}
      </select>

      

      <button on:click={addProspect} class="button primary">
        Ajouter
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
    max-width: 800px;
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

  .side-by-side {
    display: flex;
    gap: 1rem;
  }

  .side-by-side > div {
    flex: 1;
  }
</style>
