<script>
  import { onMount } from 'svelte';

  /**
   * @type {any[]}
   */
  let compagnies = [];
  let showAll = false; // Variable réactive pour contrôler l'affichage des compagnies actives

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/compagnies/recuperer'); // URL API pour récupérer les compagnies
      if (response.ok) {
        compagnies = await response.json();
      } else {
        console.error('Échec de la récupération des compagnies');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des compagnies:', error);
    }
  });

  function toggleShowAll() {
    showAll = !showAll; // Bascule entre afficher toutes les compagnies et uniquement les actives
  }
</script>

<div class="container-fluid py-4">
  <div class="row">
    <div class="col-12">
      <h1 class="mb-4 font-semibold">Show Campanin</h1>
      <div class="card shadow-sm">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <a href="/compagnes/add" class="btn btn-light btn-sm">
            <i class="bi bi-building me-2"></i>Add New Company
          </a>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-missing-attribute -->
          <a on:click="{toggleShowAll}" class="btn btn-light btn-sm">
            <i class="bi bi-filter me-2"></i>
            {#if showAll}
              Show Active Companies
            {:else}
              Show All Companies
            {/if}
          </a>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Company ID</th>
                  <th>Company Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {#each compagnies as compagnie}
                  {#if showAll || compagnie.active === 'Y'}
                    <tr>
                      <td><a href="/compagnies/detail/{compagnie.campaign_id}" class="text-decoration-none text-primary">{compagnie.campaign_id}</a></td>
                      <td>{compagnie.campaign_name}</td>
                      <td>
                        <span class={`badge ${compagnie.active === 'Y' ? 'bg-success' : 'bg-danger'}`}>
                          {compagnie.active === 'Y' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Style général de la carte */
  .card {
    border-radius: 10px;
  }

  /* Tableau avec des bordures fines et un fond alterné */
  .table-hover tbody tr:hover {
    background-color: #f1f1f1;
  }

  /* Titres en gras et taille plus grande */
  h1 {
    font-size: 2.5rem;
  }

  /* Badge pour les compagnies actives/inactives */
  .badge {
    font-size: 0.85rem;
    padding: 5px 10px;
    border-radius: 12px;
  }

  /* Personnalisation des boutons dans l'en-tête */
  .btn-light {
    font-size: 0.875rem;
    padding: 10px 20px;
    border-radius: 25px;
  }

  /* Personnalisation des boutons dans le tableau */
  .btn-sm {
    font-size: 0.75rem;
    padding: 5px 10px;
    border-radius: 15px;
  }

  .table-bordered {
    border: 1px solid #ddd;
  }

  .table-dark {
    background-color: #343a40;
    color: white;
  }

  .table th, .table td {
    padding: 12px;
    text-align: center;
  }

  /* Amélioration de l'icône et du texte dans le tableau */
  .text-decoration-none:hover {
    text-decoration: underline;
  }

  /* Effet d'ombre douce sur la carte */
  .shadow-sm {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  /* Ajout d'un espacement pour les éléments dans le tableau */
  .table td, .table th {
    vertical-align: middle;
  }
</style>
