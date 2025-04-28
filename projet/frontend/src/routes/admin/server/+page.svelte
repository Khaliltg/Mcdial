<script>
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  let servers = [];

  onMount(async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/servers');
      const data = await res.json();
      servers = data;
    } catch (error) {
      console.error('Erreur de chargement des serveurs :', error);
    }
  });

  async function updateServer(server) {
    try {
      // Si c'est un nouveau serveur (ID temporaire)
      if (server.server_id.toString().startsWith('temp-')) {
        await createServer(server);
        return;
      }

      // Sinon, mettre à jour un serveur existant
      const res = await fetchWithAuth(`http://localhost:8000/api/servers/${server.server_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(server)
      });

      if (res.ok) {
        alert('Serveur mis à jour avec succès');
      } else {
        const err = await res.text();
        console.error('Erreur :', err);
        alert('Erreur lors de la mise à jour du serveur');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      alert('Erreur lors de la mise à jour du serveur');
    }
  }

  function addServer() {
    servers = [
      ...servers,
      {
        server_id: `temp-${Date.now()}`, // ID temporaire pour le front
        server_description: '',
        server_ip: '',
        active: false,
        active_agent_login_server: 'N',
        asterisk_version: '',
        max_vicidial_trunks: 0,
        local_gmt: 0
      }
    ];
  }

  // Fonction pour créer un nouveau serveur
  async function createServer(server) {
    try {
      // Préparer les données à envoyer (sans l'ID temporaire)
      const serverData = {
        server_description: server.server_description,
        server_ip: server.server_ip,
        active: server.active,
        active_agent_login_server: server.active_agent_login_server,
        asterisk_version: server.asterisk_version,
        max_vicidial_trunks: server.max_vicidial_trunks,
        local_gmt: server.local_gmt
      };

      const res = await fetchWithAuth('http://localhost:8000/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serverData)
      });

      if (res.ok) {
        const newServer = await res.json();
        // Remplacer le serveur temporaire par celui retourné par l'API
        servers = servers.map(s => 
          s.server_id === server.server_id ? newServer : s
        );
        alert('Nouveau serveur créé avec succès');
      } else {
        const err = await res.text();
        console.error('Erreur lors de la création du serveur:', err);
        alert('Erreur lors de la création du serveur');
      }
    } catch (error) {
      console.error('Erreur lors de la création du serveur:', error);
      alert('Erreur lors de la création du serveur');
    }
  }
</script>

<!-- ✅ BOUTON AJOUTER -->
<div class="mb-4">
  <button
    class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
    on:click={addServer}
  >
    ➕ Ajouter un serveur
  </button>
</div>

<div class="overflow-x-auto rounded-xl shadow-lg border border-gray-200 bg-white">
  <table class="min-w-full divide-y divide-gray-200 text-sm">
    <thead class="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
      <tr>
        <th class="px-6 py-4 text-left">ID</th>
        <th class="px-6 py-4 text-left">Description</th>
        <th class="px-6 py-4 text-left">IP</th>
        <th class="px-6 py-4 text-center">Active</th>
        <th class="px-6 py-4 text-left">Agent</th>
        <th class="px-6 py-4 text-left">Version</th>
        <th class="px-6 py-4 text-left">Trunks</th>
        <th class="px-6 py-4 text-left">GMT</th>
        <th class="px-6 py-4 text-center">Action</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 bg-white">
      {#each servers as server (server.server_id)}
        <tr class="hover:bg-gray-50 transition">
          <td class="px-6 py-3 font-medium text-gray-700">{server.server_id}</td>
          <td class="px-6 py-3">
            <input class="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring focus:ring-blue-300" bind:value={server.server_description} />
          </td>
          <td class="px-6 py-3">
            <input class="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1" bind:value={server.server_ip} />
          </td>
          <td class="px-6 py-3 text-center">
            <input type="checkbox" class="h-5 w-5 text-blue-600" bind:checked={server.active} />
          </td>
          <td class="px-6 py-3">
            <select class="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1" bind:value={server.active_agent_login_server}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </td>
          <td class="px-6 py-3">
            <input class="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1" bind:value={server.asterisk_version} />
          </td>
          <td class="px-6 py-3">
            <input type="number" class="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1" bind:value={server.max_vicidial_trunks} />
          </td>
          <td class="px-6 py-3">
            <input type="number" class="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1" bind:value={server.local_gmt} />
          </td>
          <td class="px-6 py-3 text-center">
            <button 
              class="inline-flex items-center px-4 py-1.5 text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition font-semibold shadow-sm"
              on:click={() => updateServer(server)}>
              {server.server_id.toString().startsWith('temp-') ? '✅ Créer' : '💾 Modifier'}
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
