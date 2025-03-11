<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let additionalData = {};
  let listId = null;
  let isLoading = true;
  let errorMessage = '';

  // Reactive statement to get listId from the page params
  $: {
    listId = $page.params.list_id;
    console.log('listId:', listId);
  }

  // Function to fetch list
  async function fetchList() {
    if (listId) {
      try {
        const response = await fetch(`http://localhost:8000/api/lists/getListById/${listId}`);
        if (response.ok) {
          additionalData = await response.json();
          console.log('Fetched additionalData:', additionalData);
        } else {
          errorMessage = 'Erreur lors de la récupération des données.';
        }
      } catch (error) {
        errorMessage = 'Erreur lors de la récupération des données.';
      } finally {
        isLoading = false;  // Set loading to false at the end
      }
    } else {
      errorMessage = 'Aucun list_id trouvé dans l\'URL.';
      isLoading = false;
    }
  }

  onMount(() => {
    fetchList();
  });
</script>

<head>
  <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
</head>

<h2 class="text-center my-4">Détails supplémentaires</h2>

<div class="container">
  {#if isLoading}
    <p>Chargement des détails...</p>
  {:else if errorMessage}
    <p class="text-danger">{errorMessage}</p>
  {:else}
    <!-- LIST DETAILS TABLE -->
    <div class="table-responsive mb-4">
      <h3 class="mb-3">Détails de la Liste :</h3>
      <table class="table table-bordered table-striped">
        <thead class="thead-dark">
          <tr>
            <th>Champ</th>
            <th>Valeur</th>
          </tr>
        </thead>
        <tbody>
          {#if additionalData.listDetails}
            {#each Object.entries(additionalData.listDetails) as [key, value]}
              <tr>
                <td>{key}</td>
                <td>{value !== null ? value : 'Aucun'}</td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="2">Aucun détail disponible.</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- GMT OFFSETS TABLE -->
    <div class="table-responsive mb-4">
      <h3 class="mb-3">Fuseaux horaires :</h3>
      <table class="table table-bordered table-striped">
        <thead class="thead-dark">
          <tr>
            <th>GMT Offset</th>
            <th>Called Since Last Reset</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {#if additionalData.gmtOffsets && additionalData.gmtOffsets.length > 0}
            {#each additionalData.gmtOffsets as offset}
              <tr>
                <td>{offset.gmt_offset_now}</td>
                <td>{offset.called_since_last_reset}</td>
                <td>{offset.count}</td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="3">Aucun fuseau horaire disponible.</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- STATUSES TABLE -->
    <div class="table-responsive mb-4">
      <h3 class="mb-3">Statuts de la liste :</h3>
      <table class="table table-bordered table-striped">
        <thead class="thead-dark">
          <tr>
            <th>Statut</th>
            <th>Called Since Last Reset</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {#if additionalData.statuses && additionalData.statuses.length > 0}
            {#each additionalData.statuses as status}
              <tr>
                <td>{status.status}</td>
                <td>{status.called_since_last_reset}</td>
                <td>{status.count}</td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="3">Aucun statut disponible.</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- OWNERS TABLE -->
    <div class="table-responsive mb-4">
      <h3 class="mb-3">Propriétaires :</h3>
      <table class="table table-bordered table-striped">
        <thead class="thead-dark">
          <tr>
            <th>Propriétaire</th>
            <th>Called Since Last Reset</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {#if additionalData.owners && additionalData.owners.length > 0}
            {#each additionalData.owners as owner}
              <tr>
                <td>{owner.owner}</td>
                <td>{owner.called_since_last_reset}</td>
                <td>{owner.count}</td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="3">Aucun propriétaire disponible.</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- FIELDS COUNT -->
    <div class="mb-4">
      <p>{additionalData.fieldsCount ? additionalData.fieldsCount : 'Aucun'}</p>
    </div>
  {/if}
</div>