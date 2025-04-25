<script>
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  let conferences = [];
  let serverIPs = [];
  let newConference = {conf_exten : '', server_ip: '', extension: '' };
  let useCustomIP = false;
  let customIP = '';
  let message = '';

  onMount(async () => {
    await fetchConferences();
    await fetchServerIPs();
  });

  async function fetchConferences() {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/conferences');
      conferences = await res.json();
    } catch (e) {
      console.error('Erreur de récupération des conférences:', e);
    }
  }

  async function fetchServerIPs() {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/conferences/server_ips');
      serverIPs = await res.json();
    } catch (e) {
      console.error('Erreur de récupération des IPs:', e);
    }
  }

  function handleIPSelection(e) {
    const value = e.target.value;
    if (value === '__custom__') {
      useCustomIP = true;
      newConference.server_ip = '';
    } else {
      useCustomIP = false;
      newConference.server_ip = value;
    }
  }

  async function addConference() {
    message = '';

    const finalIP = useCustomIP ? customIP : newConference.server_ip;
    const conf_exten = newConference.conf_exten.trim();
  const extension = newConference.extension.trim();

  if (!conf_exten || !finalIP.trim() || !extension) {
      message = 'Tous les champs sont requis!';
      console.error('Champs manquants :', { conf_exten, finalIP, extension });
      return;
    }

    try {
      const res = await fetchWithAuth('http://localhost:8000/api/conferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conf_exten,
          server_ip: finalIP,
          extension
        })
      });

      const data = await res.json();

      if (!res.ok) {
        message = data.error || 'Erreur serveur';
        console.error('Erreur côté serveur :', data);
        return;
      }

      message = 'Conférence ajoutée avec succès!';
      newConference = { conf_exten: '', server_ip: '', extension: '' };
      customIP = '';
      useCustomIP = false;
      await fetchConferences();
      await fetchServerIPs();
    } catch (e) {
      console.error('Erreur lors de l\'ajout de la conférence:', e);
      message = 'Erreur réseau ou serveur.';
    }
  }
  async function updateConference(id) {
  const conf = conferences.find(c => c.conf_exten === id);
  if (!conf) return;

  const newConfExten = prompt('Modifier conf_exten :', conf.conf_exten);
  const newServerIP = prompt('Modifier server_ip :', conf.server_ip);
  const newExtension = prompt('Modifier extension :', conf.extension);

  if (!newConfExten || !newServerIP || !newExtension) {
    alert('Tous les champs sont requis pour la mise à jour.');
    return;
  }

  try {
    const res = await fetchWithAuth(`http://localhost:8000/api/conferences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conf_exten: newConfExten,
        server_ip: newServerIP,
        extension: newExtension
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Erreur lors de la mise à jour :', data);
      alert(data.error || 'Erreur serveur');
      return;
    }

    message = 'Conférence modifiée avec succès !';
    await fetchConferences(); // Rafraîchir la liste
  } catch (e) {
    console.error('Erreur réseau lors de la mise à jour :', e);
    message = 'Erreur réseau ou serveur.';
  }
}

 
</script>

<h1>Conférences</h1>

<table>
  <thead>
    <tr>
      <th>conf_exten</th>
      <th>SERVER IP</th>
      <th>Extension</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each conferences as c}
      <tr>
        <td>{c.conf_exten}</td>
        <td>{c.server_ip}</td>
        <td>{c.extension}</td>
        <td>
          <button on:click={() => updateConference(c.conf_exten)}>Modifier</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<h2>Ajouter Conférence</h2>

<input bind:value={newConference.conf_exten} placeholder="Conférence" />

<!-- Sélecteur IP -->
<select on:change={handleIPSelection}>
  <option value="">-- Sélectionner une IP existante --</option>
  {#each serverIPs as ip}
    <option value={ip.server_ip}>{ip.server_ip}</option>
  {/each}
  <option value="__custom__">-- Nouvelle IP --</option>
</select>

<!-- Champ texte si nouvelle IP -->
{#if useCustomIP}
  <input bind:value={customIP} placeholder="Nouvelle IP" />
{/if}

<input bind:value={newConference.extension} placeholder="Extension" />
<button on:click={addConference}>Ajouter</button>

{#if message}
  <p>{message}</p>
{/if}

<style>
  /* Base styles */
  :global(body) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f8f9fa;
    color: #333;
    line-height: 1.6;
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
  }

  /* Table styles */
  table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #4b5563;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  th.sortable:hover {
    background-color: #f3f4f6;
  }

  td {
    font-size: 0.875rem;
  }

  .list-item:hover {
    background-color: #f9fafb;
  }

  /* Form and input styles */
  input, select {
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    display: block;
    margin: 0.5rem 0;
  }

  input:focus, select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  /* Button styles */
  button {
    padding: 0.5rem 1rem;
    cursor: pointer;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
  }

  button:hover {
    background-color: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  /* Status message */
  p {
    margin-top: 1rem;
    color: green;
  }
</style>
