<script context="module" lang="ts">
  export async function load({ fetch }) {
    const res = await fetch('/api/lists');
    const lists = await res.json();
    return { props: { lists } };
  }
</script>

<script>
  export let lists: Array<{ id: number; name: string }>;
</script>

<h1>Listes</h1>
<input type="text" placeholder="Rechercher une liste" bind:value={searchTerm} />
<table>
  <thead>
    <tr>
      <th>Nom de la liste</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each lists as { id, name }}
      <tr>
        <td>{name}</td>
        <td>
          <button>Voir</button>
          <button>Modifier</button>
          <button>Supprimer</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
