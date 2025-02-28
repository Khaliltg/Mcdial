<script>
  import { onMount } from "svelte";
  let list_id = "";
  let list_name = "";
  let list_description = "";
  let campaign_id = "";
  let active = "Y"; // Valeur par défaut

  let lists = [];

  async function handleSubmit() {
    try {
      const response = await fetch("http://localhost:8000/api/lists/ajouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_id,
          list_name,
          list_description,
          campaign_id,
          active
        }),
      });

      if (response.ok) {
        alert("Liste ajoutée avec succès !");
        fetchLists(); // Rafraîchir la liste après ajout
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert("Une erreur est survenue.");
    }
  }

  async function fetchLists() {
    try {
      const response = await fetch("http://localhost:8000/api/lists/afficher");
      lists = await response.json();
    } catch (error) {
      console.error("Erreur lors du chargement des listes:", error);
    }
  }

  onMount(fetchLists);
</script>

<style>
  /* Centrage complet du formulaire au milieu de la page */
  body {
    font-family: 'Arial', sans-serif;
    background-color: #f4f7fc;
    margin: 0 ;
    padding: 0;
    display: flex;
    justify-content: center; /* Centrer horizontalement */
    align-items: center; /* Centrer verticalement */
    height: 100vh; /* Prendre toute la hauteur de la fenêtre */
  }

  h1 {
    color: #007bff;
    text-align: center;
    margin-bottom: 20px;
  }

  form {
    background-color: white;
    padding: 30px;
    border-radius: 18px;
    width: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  form:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  input, select, button {
    width: 100%;
    padding: 12px;
    margin: 10px 0;
    border-radius: 5px;
    border: 1px solid #ccc;
    font-size: 16px;
  }

  input:focus, select:focus, button:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.4);
  }

  button {
    background-color: #007bff;
    color: white;
    cursor: pointer;
    border: none;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #0056b3;
  }

  select {
    background-color: #f4f7fc;
  }
</style>

<form on:submit|preventDefault={handleSubmit}>
  <h1>Ajouter une nouvelle liste</h1>
  
  <input type="text" bind:value={list_id} placeholder="ID de la liste" required />
  <input type="text" bind:value={list_name} placeholder="Nom de la liste" required />
  <input type="text" bind:value={list_description} placeholder="Description de la liste" />
  <input type="text" bind:value={campaign_id} placeholder="ID de la campagne" required />
  
  <select bind:value={active}>
    <option value="Y">Active</option>
    <option value="N">Inactive</option>
  </select>

  <button type="submit">Ajouter</button>
</form>
