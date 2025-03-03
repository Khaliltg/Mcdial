<script>
  import { onMount } from 'svelte';

  let listDetails = {};
  let errorMessage = '';
  let listId;
  let isLoading = true;

  onMount(async () => {
    const url = window.location.pathname;
    const parts = url.split('/');
    listId = parts[parts.length - 1]; // Extract list_id from URL

    try {
      const res = await fetch(`http://localhost:8000/api/lists/getListById/${listId}`);
      if (res.ok) {
        listDetails = await res.json();
      } else {
        errorMessage = '❌ Liste non trouvée';
      }
    } catch (error) {
      errorMessage = '⚠️ Erreur lors de la récupération des détails.';
    } finally {
      isLoading = false;
    }
  });
</script>

<!-- Bootstrap Container -->
<div class="container mt-5">
  <h1 class="text-center fw-bold title-header">
    <i class="bi bi-card-list"></i> Détails de la Liste
  </h1>

  {#if isLoading}
    <div class="text-center mt-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-2 text-muted">Chargement des données...</p>
    </div>
  {:else}
    {#if errorMessage}
      <div class="alert alert-danger text-center mt-4">{errorMessage}</div>
    {:else}
      <div class="card shadow-lg mt-4">
        <div class="card-header bg-gradient text-white">
          <h4 class="mb-0"><i class="bi bi-info-circle"></i> Informations Générales</h4>
        </div>
        <div class="card-body">
          <table class="table table-hover custom-table">
            <tbody>
              <tr>
                <th>🆔 ID de la liste :</th>
                <td>{listDetails.list_id || 'N/A'}</td>
              </tr>
              <tr>
                <th>📌 Nom de la liste :</th>
                <td>{listDetails.list_name || 'N/A'}</td>
              </tr>
              <tr>
                <th>📌 Active :</th>
                <td>
                  {#if listDetails.active}
                    <span class="badge bg-success"><i class="bi bi-check-circle"></i> Actif</span>
                  {:else}
                    <span class="badge bg-danger"><i class="bi bi-x-circle"></i> Inactif</span>
                  {/if}
                </td>
              </tr>
              <tr>
                <th>📜 Description :</th>
                <td>{listDetails.list_description || 'Aucune description'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Bouton Retour -->
      <div class="text-center mt-4">
        <a href="/liste/recherchelist" class="btn btn-primary btn-lg shadow-sm">
          ⬅ Retour à la liste
        </a>
      </div>
    {/if}
  {/if}
</div>

<!-- Bootstrap Icons Import (Ensure Bootstrap Icons are included in your project) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">

<!-- Styles Améliorés -->
<style>
  /* 🎨 Titre avec effet d'animation */
  .title-header {
    font-size: 2rem;
    color: #007bff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    animation: fadeIn 1s ease-in-out;
  }

  /* 🌈 Dégradé dans le header */
  .bg-gradient {
    background: linear-gradient(135deg, #007bff, #0056b3);
    padding: 15px;
    border-radius: 10px 10px 0 0;
  }

  /* 🏆 Table plus moderne */
  .custom-table th {
    width: 30%;
    background: #f8f9fa;
    font-weight: bold;
    padding: 10px;
    border-right: 2px solid #dee2e6;
  }

  .custom-table td {
    padding: 10px;
    font-size: 1.1rem;
  }

  /* 🖱️ Effet de survol */
  .custom-table tbody tr:hover {
    background: rgba(0, 123, 255, 0.1);
    transition: 0.3s;
  }

  /* ✨ Badge de statut */
  .badge {
    font-size: 1rem;
    padding: 8px 12px;
    border-radius: 20px;
  }

  /* 🖼️ Bouton amélioré */
  .btn-lg {
    padding: 10px 20px;
    font-size: 1.2rem;
    border-radius: 10px;
  }

  /* 🔥 Animation de fondu */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
