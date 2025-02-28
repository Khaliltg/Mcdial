<script>
    import { onMount } from 'svelte';
  
    /**
     * @type {any[]}
     */
    let compagnies = [];
  
    onMount(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/admin/compagnies/recuperer');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        compagnies = await response.json();
      } catch (error) {
        console.error(error);
      }
    });
  </script>
  
  <div class="container mt-5">
    <h1 class="mb-4">Liste des Compagnies</h1>
<a href="/compagnes/add">    <button  class="btn btn-primary mb-3">Ajouter une Compagnie</button></a>
    
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>ID de Campagne</th>
          <th>Nom de Campagne</th>
          <th>Statut Actif</th>
        </tr>
      </thead>
      <tbody>
        {#each compagnies as compagnie}
          <tr>
            <td>{compagnie.campaign_id}</td>
            <td>{compagnie.campaign_name}</td>
            <td>{compagnie.active ? 'Oui' : 'Non'}</td> <!-- Affiche 'Oui' ou 'Non' selon la valeur -->
          </tr>
        {/each}
      </tbody>
    </table>
  </div>