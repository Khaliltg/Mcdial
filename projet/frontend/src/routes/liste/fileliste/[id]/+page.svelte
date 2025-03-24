<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { writable } from 'svelte/store';

  export let listFiles = [];
  export let listInfo = {};

  let searchQuery = '';
  let errorMessage = '';
  let currentPage = 1;
  let itemsPerPage = 10; // Nombre d'éléments à afficher par page
  let debouncedSearchQuery = writable('');

  function returnToList() {
    goto('/liste/afficherlist');
  }

  $: listId = $page.params?.id;
  $: filteredFiles = listFiles.filter(file =>
    file.user?.toLowerCase().includes($debouncedSearchQuery.toLowerCase()) ||
    file.lead_id?.toString().includes($debouncedSearchQuery)
  );

  $: paginatedFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  async function load() {
    try {
      const res = await fetch(`http://localhost:8000/api/lists/files/${listId}`);
      if (!res.ok) {
        throw new Error('Erreur lors de la récupération des fichiers.');
      }
      listFiles = await res.json();

      const listInfoRes = await fetch(`http://localhost:8000/api/lists/getListById/${listId}`);
      listInfo = await listInfoRes.json();
    } catch (error) {
      console.error("Erreur de chargement :", error);
      errorMessage = "Erreur lors du chargement des données.";
      listFiles = [];
      listInfo = {};
    }
  }

  onMount(load);

  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const updateSearchQuery = debounce(() => {
    debouncedSearchQuery.set(searchQuery);
  }, 300);
</script>

<div class="container mt-5">
  <header class="d-flex justify-content-between align-items-center mb-4">
    <h1 class="header-title">Fichiers de la liste: (ID de campagne: {listId})</h1>
    <button class="btn btn-primary" on:click={returnToList}>Retour</button>
  </header>

  <!-- 🔍 Barre de recherche -->
  <div class="mb-3">
    <input
      type="text"
      bind:value={searchQuery}
      on:input={updateSearchQuery}
      placeholder="Rechercher par User ou Lead ID..."
      class="form-control"
      aria-label="Rechercher par User ou Lead ID"
    />
  </div>

  {#if errorMessage}
    <div class="alert alert-danger">{errorMessage}</div>
  {/if}

  <main class="mb-4">
    {#if paginatedFiles.length > 0}
      <table class="table table-striped">
        <thead class="thead-light">
          <tr>
            <th>Lead ID</th>
            <th>Entry Date</th>
            <th>Modify Date</th>
            <th>Status</th>
            <th>User</th>
            <th>Vendor Lead Code</th>
            <th>Source ID</th>
            <th>List ID</th>
            <th>GMT Offset Now</th>
            <th>Called Since Last Reset</th>
            <th>Phone Code</th>
            <th>Phone Number</th>
            <th>Title</th>
            <th>First Name</th>
            <th>Middle Initial</th>
            <th>Last Name</th>
            <th>Address 1</th>
            <th>Address 2</th>
            <th>Address 3</th>
            <th>City</th>
            <th>State</th>
            <th>Province</th>
            <th>Postal Code</th>
            <th>Country Code</th>
            <th>Gender</th>
            <th>Date of Birth</th>
            <th>Alt Phone</th>
            <th>Email</th>
            <th>Security Phrase</th>
            <th>Comments</th>
            <th>Called Count</th>
            <th>Last Local Call Time</th>
            <th>Rank</th>
            <th>Owner</th>
            <th>Entry List ID</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedFiles as file}
            <tr>
              <td>{file.lead_id}</td>
              <td>{file.entry_date}</td>
              <td>{file.modify_date}</td>
              <td>{file.status}</td>
              <td>{file.user}</td>
              <td>{file.vendor_lead_code}</td>
              <td>{file.source_id}</td>
              <td>{file.list_id}</td>
              <td>{file.gmt_offset_now}</td>
              <td>{file.called_since_last_reset}</td>
              <td>{file.phone_code}</td>
              <td>{file.phone_number}</td>
              <td>{file.title}</td>
              <td>{file.first_name}</td>
              <td>{file.middle_initial}</td>
              <td>{file.last_name}</td>
              <td>{file.address_1}</td>
              <td>{file.address_2}</td>
              <td>{file.address_3}</td>
              <td>{file.city}</td>
              <td>{file.state}</td>
              <td>{file.province}</td>
              <td>{file.postal_code}</td>
              <td>{file.country_code}</td>
              <td>{file.gender}</td>
              <td>{file.date_of_birth}</td>
              <td>{file.alt_phone}</td>
              <td>{file.email}</td>
              <td>{file.security_phrase}</td>
              <td>{file.comments}</td>
              <td>{file.called_count}</td>
              <td>{file.last_local_call_time}</td>
              <td>{file.rank}</td>
              <td>{file.owner}</td>
              <td>{file.entry_list_id}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <nav>
        <ul class="pagination justify-content-center">
          <li class="page-item">
            <button class="page-link" on:click={() => currentPage = Math.max(1, currentPage - 1)}>Previous</button>
          </li>
          <li class="page-item disabled">
            <span class="page-link">Page {currentPage}</span>
          </li>
          <li class="page-item">
            <button class="page-link" on:click={() => currentPage = Math.min(Math.ceil(filteredFiles.length / itemsPerPage), currentPage + 1)}>Next</button>
          </li>
        </ul>
      </nav>
    {:else}
      <div class="alert alert-warning">Aucun fichier trouvé.</div>
    {/if}
  </main>
</div>

<style>
  /* Additional custom styles can go here if needed */
</style>