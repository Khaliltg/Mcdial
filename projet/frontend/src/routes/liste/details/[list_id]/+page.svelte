<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let additionalData = {};
  let listId = null;

  $: {
    listId = $page.params.list_id;
    console.log(listId);
  }

  onMount(async () => {
    if (listId) {
      try {
        const response = await fetch(`http://localhost:8000/api/lists/getListById/${listId}`);
        if (response.ok) {
          additionalData = await response.json();
          console.log(additionalData);
        } else {
          alert('⚠️ Problème lors de la récupération des données supplémentaires.');
        }
      } catch (error) {
        alert('⚠️ Erreur lors de la récupération des données.');
      }
    } else {
      alert('⚠️ Aucun list_id trouvé dans l\'URL.');
    }
  });
</script>

<head>
  <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
</head>

<h2 class="text-center my-4">Détails supplémentaires</h2>

<div class="container">
  <!-- STATUSES TABLE -->
  <div class="table-responsive mb-4">
    <h3 class="mb-3">Statuts de la liste :</h3>
    <table class="table table-bordered table-striped">
      <thead class="thead-dark">
        <tr>
          <th>Type de Statut</th>
          <th>Nom de Statut</th>
          <th>Appels Effectués</th>
          <th>Appels Non Effectués</th>
          <th>Numéros Joignables</th>
          <th>Taux de Pénétration</th>
        </tr>
      </thead>
      <tbody>
        {#if additionalData.statuses && Array.isArray(additionalData.statuses)}
          {#each additionalData.statuses as status}
            <tr>
              <td>{status.status}</td>
              <td>{status.status_name}</td>
              <td>{status.called}</td>
              <td>{status.not_called}</td>
              <td>{status.dialable}</td>
              <td>{status.penetration}%</td>
            </tr>
          {/each}
          <tr class="table-info">
            <td colspan="5">Sous-totaux</td>
            <td>{additionalData.statuses.reduce((acc, status) => acc + status.penetration, 0)}%</td>
          </tr>
          <tr class="table-success">
            <td colspan="5">Total</td>
            <td>{additionalData.statuses.length}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="6">Aucun statut disponible.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- TIME ZONES TABLE -->
  <div class="table-responsive mb-4">
    <h3 class="mb-3">Fuseaux horaires :</h3>
    <table class="table table-bordered table-striped">
      <thead class="thead-dark">
        <tr>
          <th>Décalage GMT (heure locale)</th>
          <th>Appels Effectués</th>
          <th>Appels Non Effectués</th>
        </tr>
      </thead>
      <tbody>
        {#if additionalData.timezones && Array.isArray(additionalData.timezones)}
          {#each additionalData.timezones as timezone}
            <tr>
              <td>{timezone.gmt_offset} ({timezone.local_time})</td>
              <td>{timezone.called}</td>
              <td>{timezone.not_called}</td>
            </tr>
          {/each}
          <tr class="table-info">
            <td colspan="2">Sous-totaux</td>
            <td>{additionalData.timezones.reduce((acc, timezone) => acc + timezone.not_called, 0)}</td>
          </tr>
          <tr class="table-success">
            <td colspan="2">Total</td>
            <td>{additionalData.timezones.length}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="3">Aucun fuseau horaire disponible.</td>
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
          <th>Nom du Propriétaire</th>
          <th>Appels Effectués</th>
          <th>Appels Non Effectués</th>
        </tr>
      </thead>
      <tbody>
        {#if additionalData.owners && Array.isArray(additionalData.owners)}
          {#each additionalData.owners as owner}
            <tr>
              <td>{owner.name}</td>
              <td>{owner.called}</td>
              <td>{owner.not_called}</td>
            </tr>
          {/each}
          <tr class="table-info">
            <td colspan="2">Sous-totaux</td>
            <td>{additionalData.owners.reduce((acc, owner) => acc + owner.not_called, 0)}</td>
          </tr>
          <tr class="table-success">
            <td colspan="2">Total</td>
            <td>{additionalData.owners.length}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="3">Aucun propriétaire disponible.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- RANKS TABLE -->
  <div class="table-responsive mb-4">
    <h3 class="mb-3">Rangs :</h3>
    <table class="table table-bordered table-striped">
      <thead class="thead-dark">
        <tr>
          <th>Nom du Rang</th>
          <th>Appels Effectués</th>
          <th>Appels Non Effectués</th>
        </tr>
      </thead>
      <tbody>
        {#if additionalData.ranks && Array.isArray(additionalData.ranks)}
          {#each additionalData.ranks as rank}
            <tr>
              <td>{rank.rank}</td>
              <td>{rank.called}</td>
              <td>{rank.not_called}</td>
            </tr>
          {/each}
          <tr class="table-info">
            <td colspan="2">Sous-totaux</td>
            <td>{additionalData.ranks.reduce((acc, rank) => acc + rank.not_called, 0)}</td>
          </tr>
          <tr class="table-success">
            <td colspan="2">Total</td>
            <td>{additionalData.ranks.length}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="3">Aucun rang disponible.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- CALLED COUNTS TABLE -->
  <div class="table-responsive mb-4">
    <h3 class="mb-3">Comptes d'appels :</h3>
    <table class="table table-bordered table-striped">
      <thead class="thead-dark">
        <tr>
          <th>Statut</th>
          <th>Nom du Statut</th>
          <th>Nombre</th>
          <th>Sous-total</th>
        </tr>
      </thead>
      <tbody>
        {#if additionalData.calledCounts && Array.isArray(additionalData.calledCounts)}
          {#each additionalData.calledCounts as count}
            <tr>
              <td>{count.status}</td>
              <td>{count.status_name}</td>
              <td>{count.count}</td>
              <td>{count.count}</td>
            </tr>
          {/each}
          <tr class="table-info">
            <td colspan="3">Total</td>
            <td>{additionalData.calledCounts.length}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="4">Aucun compte d'appel disponible.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>