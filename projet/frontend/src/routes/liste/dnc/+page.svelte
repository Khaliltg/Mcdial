<script>
  let phone = '';

  async function addDNC() {
    const res = await fetch('/api/dnc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (res.ok) {
      phone = '';
      alert('Numéro ajouté à la liste DNC');
    }
  }
</script>

<div class="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
  <h1 class="text-xl font-semibold text-gray-800">🚫 Ajouter un numéro DNC</h1>

  <div class="mt-4">
    <label class="block text-gray-700">Numéro de téléphone</label>
    <input type="text" bind:value={phone} class="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500" />

    <button on:click={addDNC} class="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
      Ajouter
    </button>
  </div>
</div>
