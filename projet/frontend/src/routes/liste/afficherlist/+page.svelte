<script>
  import { onMount } from 'svelte';

  let lists = [];

  // Function to fetch lists from the API
  async function loadLists() {
    try {
      const res = await fetch('http://localhost:8000/api/lists/afficher');
      if (res.ok) {
        lists = await res.json();
      } else {
        throw new Error('Erreur lors de la récupération des listes');
      }
    } catch (error) {
      alert(error.message);
    }
  }

  onMount(loadLists);
</script>

<div class="container">
  <h1 class="title">📋 Listes Enregistrées</h1>

  {#if lists.length > 0}
    <table class="list-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom de la liste</th>
          <th>ID de campagne</th>
          <th>Actif</th>
        </tr>
      </thead>
      <tbody>
        {#each lists as list}
          <tr class="list-item">
            <td>{list.list_id}</td>
            <td>{list.list_name}</td>
            <td>{list.campaign_id}</td>
            <td>{list.active ? '✅' : '❌'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="no-list">Aucune liste trouvée.</p>
  {/if}
</div>

<style>
  /* Overall container styles */
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    font-family: 'Arial', sans-serif;
  }

  /* Title styles */
  .title {
    font-size: 2.5rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  /* Table styles */
  .list-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .list-table th,
  .list-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  .list-table th {
    background-color: #007bff;
    color: white;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .list-item {
    transition: background-color 0.3s;
  }

  .list-item:hover {
    background-color: #f1f1f1;
  }

  /* No list message styles */
  .no-list {
    text-align: center;
    color: #888;
    margin-top: 2rem;
    font-size: 1.2rem;
  }
</style>